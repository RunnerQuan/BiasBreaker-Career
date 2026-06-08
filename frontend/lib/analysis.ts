import {
  clamp,
  extractJDKeywords,
  findMatchedKeywords,
  findMissingKeywords,
  findRiskMarkers,
  includesLoose,
  selectCareerLexicon,
  unique,
  type SelectedLexicon
} from "./lexicon";

export type RiskLevel = "low" | "medium" | "high";

export type AnalysisRequest = {
  analysisId?: string;
  jobTitle: string;
  jdText: string;
  resumeText: string;
  resumeFileName?: string;
};

export type AnalysisDimension = {
  key: "keywordCoverage" | "structureClarity" | "evidenceStrength" | "atsReadability";
  label: string;
  score: number;
  summary: string;
};

export type AnalysisFinding = {
  type: string;
  severity: RiskLevel;
  source: "jd" | "resume" | "system";
  evidence: string;
  suggestion: string;
};

export type AnalysisSuggestion = {
  title: string;
  description: string;
  example: string;
};

export type AnalysisResponse = {
  analysisId: string;
  createdAt: string;
  providerMode: "rules" | "llm";
  semanticMatch?: {
    score: number;
    summary: string;
    topEvidence: string[];
  };
  score: number;
  level: RiskLevel;
  summary: string;
  dimensions: AnalysisDimension[];
  findings: AnalysisFinding[];
  suggestions: AnalysisSuggestion[];
  reviewScripts: {
    manualReview: string;
    interviewExplanation: string;
  };
};

type StructureScoreResult = {
  score: number;
  summary: string;
  matchedSections: string[];
};

type EvidenceScoreResult = {
  score: number;
  summary: string;
  matchedByCategory: Record<EvidenceCategory, string[]>;
  completeChains: string[];
  hasChain: boolean;
};

type AtsReadabilityResult = {
  score: number;
  summary: string;
};

type EvidenceCategory = "action" | "object" | "method" | "output" | "metric";

function pickEvidence(text: string, terms: string[]) {
  const lines = splitEvidenceUnits(text);
  return lines.find((line) => terms.some((term) => includesLoose(line, term))) ?? lines[0] ?? "暂未找到明确证据句。";
}

function riskLevel(score: number): RiskLevel {
  if (score > 90) return "low";
  if (score >= 75) return "medium";
  return "high";
}

export function riskLevelFromScore(score: number): RiskLevel {
  return riskLevel(score);
}

export function calculateTotalScore(dimensions: AnalysisDimension[]) {
  const scores = Object.fromEntries(dimensions.map((item) => [item.key, item.score])) as Partial<Record<AnalysisDimension["key"], number>>;
  return clamp(
    (scores.keywordCoverage ?? 0) * 0.34 +
      (scores.structureClarity ?? 0) * 0.2 +
      (scores.evidenceStrength ?? 0) * 0.32 +
      (scores.atsReadability ?? 0) * 0.14
  );
}

export function analyzeResumeInput(input: AnalysisRequest): AnalysisResponse {
  const jdText = input.jdText.trim();
  const resumeText = input.resumeText.trim();
  const selectedLexicon = selectCareerLexicon(jdText, input.jobTitle);
  const jdKeywords = extractJDKeywords(jdText, selectedLexicon);
  const dynamicKeywords = extractDynamicJDKeywords(jdText);
  const fallbackKeywords = selectedLexicon.keywords.slice(0, 24);
  const targetKeywords = unique([...(jdKeywords.length ? jdKeywords : fallbackKeywords), ...dynamicKeywords]).slice(0, 48);
  const matchedKeywords = findMatchedKeywords(resumeText, targetKeywords, selectedLexicon.synonyms);
  const missingKeywords = findMissingKeywords(resumeText, targetKeywords, selectedLexicon.synonyms);
  const riskMarkers = findRiskMarkers(jdText, selectedLexicon);

  const keywordCoverage = scoreKeywordCoverage(targetKeywords, matchedKeywords, resumeText, selectedLexicon);
  const structure = scoreStructureClarity(resumeText, selectedLexicon.structureMarkers);
  const evidence = scoreEvidenceQuality(resumeText, selectedLexicon);
  const atsReadabilityResult = scoreAtsReadability(resumeText, input.resumeFileName, structure.score);

  const dimensions: AnalysisDimension[] = [
    {
      key: "keywordCoverage",
      label: "关键词覆盖",
      score: keywordCoverage,
      summary: matchedKeywords.length ? `已覆盖 ${matchedKeywords.slice(0, 8).join("、")}` : "暂未覆盖明显岗位关键词"
    },
    {
      key: "structureClarity",
      label: "结构清晰度",
      score: structure.score,
      summary: structure.summary
    },
    {
      key: "evidenceStrength",
      label: "经历证据",
      score: evidence.score,
      summary: evidence.summary
    },
    {
      key: "atsReadability",
      label: "系统可读性（ATS）",
      score: atsReadabilityResult.score,
      summary: atsReadabilityResult.summary
    }
  ];

  const score = calculateTotalScore(dimensions);
  const level = riskLevel(score);
  const targetTitle = input.jobTitle.trim() || selectedLexicon.domain.name || "目标岗位";
  const mainMissing = unique(missingKeywords).slice(0, 3).join("、") || "岗位核心能力";
  const evidenceTerms = unique([
    ...matchedKeywords,
    ...Object.values(evidence.matchedByCategory).flat()
  ]);

  const findings: AnalysisFinding[] = [];
  if (missingKeywords.length > 0) {
    findings.push({
      type: "岗位关键词转译不足",
      severity: missingKeywords.length >= 5 ? "high" : "medium",
      source: "resume",
      evidence: `系统识别该 JD 更接近【${selectedLexicon.domain.name}】，但 ${missingKeywords.slice(0, 6).join("、")} 等表达在简历中不明显。`,
      suggestion: "优先把真实经历转译为岗位语言；如果确实没有相关经历，使用“待补充/待确认”而不是编造。"
    });
  }

  if (evidence.score < 76 || evidence.completeChains.length < 2) {
    findings.push({
      type: "经历证据链不足",
      severity: evidence.score < 62 ? "high" : "medium",
      source: "resume",
      evidence: pickEvidence(resumeText, evidenceTerms.length ? evidenceTerms : targetKeywords),
      suggestion: "建议补齐“动作—对象—方法/工具—产出/指标”链条，尤其要说明具体对象、使用方法、产出物和可核验结果。"
    });
  }

  if (structure.score < 76) {
    findings.push({
      type: "结构可读性风险",
      severity: structure.score < 62 ? "high" : "medium",
      source: "resume",
      evidence: `当前识别到的核心栏目为：${structure.matchedSections.join("、") || "较少"}。`,
      suggestion: "建议明确教育、经历/项目、技能、荣誉/证书等栏目，并控制长段落，使用项目符号展示关键经历。"
    });
  }

  if (riskMarkers.length > 0) {
    findings.push({
      type: "岗位隐性门槛风险",
      severity: "medium",
      source: "jd",
      evidence: pickEvidence(jdText, riskMarkers),
      suggestion: "该风险不计入个人能力分数。建议投递或面试时围绕能力要求进一步澄清，必要时准备人工复核说明。"
    });
  }

  if (findings.length === 0) {
    findings.push({
      type: "低风险",
      severity: "low",
      source: "system",
      evidence: `JD 与简历在【${selectedLexicon.domain.name}】方向上的关键词、结构与经历证据整体匹配度较好。`,
      suggestion: "可继续补充量化结果，让表达更适合自动化系统和 HR 快速阅读。"
    });
  }

  return {
    analysisId: input.analysisId || `analysis_${Date.now()}`,
    createdAt: new Date().toISOString(),
    providerMode: "rules",
    score,
    level,
    summary:
      level === "low"
        ? `当前材料在【${selectedLexicon.domain.name}】方向具备较好的算法可读性，可继续优化量化证据。`
        : `主要风险不是能力不足，而是部分经历尚未被转译成【${selectedLexicon.domain.name}】岗位系统容易识别的表达。`,
    dimensions,
    findings,
    suggestions: [
      {
        title: "补齐岗位关键词",
        description: `优先处理 ${mainMissing} 等表达缺口。`,
        example: `将真实经历改写为“围绕${mainMissing}进行资料整理、问题分析，并输出可复用的复盘建议”。`
      },
      {
        title: "把经历写成证据链",
        description: "避免只写“熟悉、参与、负责”，补充对象、方法、工具、产出和指标。",
        example: "参与用户反馈整理，使用 Excel 按问题类型归类，输出选题优化清单，支持后续内容复盘。"
      },
      {
        title: "准备人工复核说明",
        description: "对于校园项目、跨专业或非典型经历，用能力语言解释相关性。",
        example: `我的经历与${targetTitle}的要求相关，主要体现在信息整理、问题分析、跨团队协作和结果复盘能力。`
      }
    ],
    reviewScripts: {
      manualReview: `您好，我刚刚投递贵司【${targetTitle}】岗位。由于我的部分经历属于校园项目或跨领域实践，可能无法完全通过自动化筛选呈现其相关性。为便于贵团队更全面评估，我补充说明：我曾围绕${mainMissing}相关任务进行资料整理、问题分析和结果复盘，具备与岗位相关的信息处理、协作和优化能力。若方便，烦请进行人工复核。感谢您的时间。`,
      interviewExplanation: `这段经历虽然不是传统实习，但我承担了信息整理、问题分析和结果复盘工作。它对应到${targetTitle}岗位中，主要体现为快速理解业务目标、拆解任务、使用合适工具处理信息并沉淀可执行建议的能力。`
    }
  };
}

function scoreKeywordCoverage(targetKeywords: string[], matchedKeywords: string[], resumeText: string, selectedLexicon: SelectedLexicon) {
  if (targetKeywords.length === 0) return 56;
  const rawCoverage = (matchedKeywords.length / targetKeywords.length) * 100;
  const exactCoreMatches = selectedLexicon.domain.coreSkills.filter((term) => includesLoose(resumeText, term)).length;
  const toolMatches = selectedLexicon.domain.tools.filter((term) => includesLoose(resumeText, term)).length;
  const breadthBonus = Math.min(8, exactCoreMatches * 2 + toolMatches);
  const missingPenalty = Math.max(0, targetKeywords.length - matchedKeywords.length - 4) * 1.5;
  return clamp(rawCoverage * 0.9 + breadthBonus - missingPenalty);
}

function scoreStructureClarity(resumeText: string, structureMarkers: string[]): StructureScoreResult {
  const lines = resumeText.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const text = resumeText.trim();
  const matchedSections = unique(structureMarkers.filter((marker) => includesLoose(text, marker)));
  const sectionGroups = [
    /教育|学校|学历|专业|GPA|本科|硕士|博士/,
    /实习|工作经历|实践经历|项目经历|项目|科研经历|比赛|竞赛/,
    /技能|专业技能|技术栈|工具|证书/,
    /获奖|荣誉|奖项|作品集|论文|校园经历|社团/
  ];
  const coreSectionCount = sectionGroups.filter((pattern) => pattern.test(text)).length;
  const yearCount = unique(text.match(/20\d{2}/g) ?? []).length;
  const bulletLikeLines = lines.filter((line) => /^[-•·*]|^[0-9一二三四五六七八九十]+[、.．]/.test(line)).length;
  const longLines = lines.filter((line) => line.length > 150).length;
  const veryLongLines = lines.filter((line) => line.length > 240).length;
  const denseParagraphPenalty = Math.min(14, longLines * 4 + veryLongLines * 6);
  const lineScore = Math.min(18, lines.length * 1.4);
  const sectionScore = Math.min(36, coreSectionCount * 9 + Math.min(matchedSections.length, 6) * 2);
  const hierarchyScore = Math.min(18, bulletLikeLines * 2 + (lines.length >= 10 ? 6 : 0));
  const timeScore = yearCount >= 2 ? 12 : yearCount === 1 ? 7 : 0;
  let score = 34 + sectionScore + lineScore + hierarchyScore + timeScore - denseParagraphPenalty;

  const canReachFullBand = coreSectionCount >= 4 && lines.length >= 12 && yearCount >= 2 && longLines <= 2;
  if (!canReachFullBand) score = Math.min(score, 88);

  const summaryParts = [
    `识别核心栏目 ${coreSectionCount}/4`,
    yearCount ? `包含 ${yearCount} 类年份信号` : "时间线信号不足",
    longLines ? `存在 ${longLines} 个长段落` : "段落长度正常"
  ];

  return {
    score: clamp(score),
    summary: summaryParts.join("；"),
    matchedSections
  };
}

function scoreEvidenceQuality(resumeText: string, selectedLexicon: SelectedLexicon): EvidenceScoreResult {
  const evidenceLexicon = selectedLexicon.evidenceLexicon as Record<EvidenceCategory, string[]>;
  const units = splitEvidenceUnits(resumeText);
  const matchedByCategory = (Object.entries(evidenceLexicon) as [EvidenceCategory, string[]][]).reduce<Record<EvidenceCategory, string[]>>(
    (result, [category, terms]) => {
      result[category] = unique(terms.filter((term) => includesLoose(resumeText, term)));
      return result;
    },
    { action: [], object: [], method: [], output: [], metric: [] }
  );

  const completeChains = units.filter((unit) => {
    const hasAction = evidenceLexicon.action.some((term) => includesLoose(unit, term));
    const hasObject = evidenceLexicon.object.some((term) => includesLoose(unit, term));
    const hasMethod = evidenceLexicon.method.some((term) => includesLoose(unit, term));
    const hasOutput = evidenceLexicon.output.some((term) => includesLoose(unit, term));
    const hasMetric = evidenceLexicon.metric.some((term) => includesLoose(unit, term)) || /\d+/.test(unit);
    return hasAction && hasObject && (hasMethod || hasOutput || hasMetric);
  });

  const categoryCoverage = Object.values(matchedByCategory).filter((items) => items.length > 0).length;
  const hasNumericMetric = /\d+|%|提升|降低|增长|减少|准确率|召回率|转化率|留存率|GMV|ROI/i.test(resumeText);
  const methodOrOutputCount = matchedByCategory.method.length + matchedByCategory.output.length;
  const vagueCount = countMatches(resumeText, /学习能力强|认真负责|沟通能力|抗压|熟悉相关|负责相关|提升效率|优化体验|参与项目/g);

  let score = 38;
  score += categoryCoverage * 6;
  score += Math.min(30, completeChains.length * 10);
  score += Math.min(12, methodOrOutputCount * 2);
  score += hasNumericMetric ? 12 : 0;
  score -= Math.min(16, vagueCount * 4);

  const canReachFullBand = completeChains.length >= 2 && hasNumericMetric && methodOrOutputCount >= 2 && vagueCount <= 1;
  if (!canReachFullBand) score = Math.min(score, 88);

  return {
    score: clamp(score),
    summary: completeChains.length
      ? `识别 ${completeChains.length} 条较完整证据链${hasNumericMetric ? "，含结果/指标" : "，量化结果仍可加强"}`
      : "动作、对象、方法或结果链条仍需补齐",
    matchedByCategory,
    completeChains,
    hasChain: completeChains.length > 0
  };
}

function scoreAtsReadability(resumeText: string, resumeFileName: string | undefined, structureClarity: number): AtsReadabilityResult {
  const fileName = resumeFileName || "";
  const hasFile = Boolean(fileName);
  const isPlainTextFile = /\.(txt|md)$/i.test(fileName);
  const isParsedDocument = /\.(pdf|docx)$/i.test(fileName);
  const textLength = resumeText.trim().length;
  const readableRatio = readableTextRatio(resumeText);
  const hasEnoughText = textLength >= 300;
  const hasRichText = textLength >= 800;
  const hasRichStructure = structureClarity >= 80;
  const hasReadableChars = readableRatio >= 0.65;
  const hasVeryReadableChars = readableRatio >= 0.78;
  const hasLikelyGarbledText = textLength > 0 && readableRatio < 0.45;
  const hasContact = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|1[3-9]\d{9}/.test(resumeText);
  const hasYearSignal = /20\d{2}/.test(resumeText);
  const lines = resumeText.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const longLines = lines.filter((line) => line.length > 180).length;
  const symbolRatio = abnormalSymbolRatio(resumeText);

  let score = 58;
  const reasons: string[] = [];

  if (!hasFile) {
    score += 8;
    reasons.push("基于粘贴文本分析");
  } else if (isPlainTextFile) {
    score += 12;
    reasons.push(`已接收 ${fileName}，纯文本格式便于系统读取`);
  } else if (isParsedDocument) {
    score += hasEnoughText ? 10 : 3;
    reasons.push(`已成功解析 ${fileName}`);
  } else {
    score += 1;
    reasons.push(`已接收 ${fileName}，该格式存在一定解析不确定性`);
  }

  if (hasRichStructure) {
    score += 10;
    reasons.push("栏目结构清晰");
  } else if (structureClarity < 60) {
    score -= 10;
    reasons.push("栏目结构信号不足");
  }

  if (hasRichText) {
    score += 8;
    reasons.push("可提取文本较充分");
  } else if (hasEnoughText) {
    score += 5;
    reasons.push("可提取文本长度正常");
  } else if (textLength < 160) {
    score -= 18;
    reasons.push("可提取文本过短，可能存在扫描件或解析缺失");
  } else {
    score -= 6;
    reasons.push("可提取文本偏短");
  }

  if (hasVeryReadableChars) {
    score += 6;
    reasons.push("文本字符可读性高");
  } else if (hasReadableChars) {
    score += 3;
    reasons.push("文本字符可读性正常");
  } else if (hasLikelyGarbledText) {
    score -= 16;
    reasons.push("疑似存在乱码或不可读字符");
  }

  if (hasContact) score += 4;
  else {
    score -= 6;
    reasons.push("联系方式信号不足");
  }

  if (hasYearSignal) score += 4;
  else {
    score -= 5;
    reasons.push("时间线信息不足");
  }

  if (longLines > 2) {
    score -= Math.min(12, longLines * 3);
    reasons.push("存在较多长行，可能影响 PDF 顺序解析");
  }

  if (symbolRatio > 0.12) {
    score -= 8;
    reasons.push("特殊符号比例偏高");
  }

  const canReachFullBand = hasEnoughText && hasRichStructure && hasVeryReadableChars && hasContact && hasYearSignal && longLines <= 2 && symbolRatio <= 0.12;
  if (!canReachFullBand) score = Math.min(score, 90);

  return {
    score: clamp(score),
    summary: reasons.slice(0, 4).join("；") || "基于文件格式、文本提取质量、栏目结构和字符可读性进行评估"
  };
}

function extractDynamicJDKeywords(jdText: string) {
  const stopWords = new Set(["负责", "参与", "协助", "相关", "工作", "岗位", "要求", "能力", "优先", "良好", "具备", "熟悉", "了解", "完成"]);
  const englishTerms = jdText.match(/[A-Za-z][A-Za-z0-9+#./-]{1,30}/g) ?? [];
  const chineseTerms = jdText.match(/[\u4e00-\u9fa5A-Za-z0-9+#./-]{2,12}/g) ?? [];
  const abilityPattern = /分析|运营|设计|开发|管理|搭建|优化|投放|研究|沟通|复盘|增长|建模|测试|交付|调研|策划|剪辑|审核|采购|销售|招聘|财务|算法|模型|数据|用户|产品/;
  return unique([
    ...englishTerms.filter((term) => term.length <= 32),
    ...chineseTerms.filter((term) => abilityPattern.test(term) && !stopWords.has(term) && term.length >= 3)
  ]).slice(0, 18);
}

function splitEvidenceUnits(text: string) {
  return text
    .split(/\n|。|；|;|(?<=\d[）)])|(?<=\))\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 8);
}

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

function readableTextRatio(text: string) {
  const compact = text.replace(/\s/g, "");
  if (!compact.length) return 0;
  const readable = compact.match(/[\u4e00-\u9fa5A-Za-z0-9%.,，。:：;；/()（）+\-#]/g)?.length ?? 0;
  return readable / compact.length;
}

function abnormalSymbolRatio(text: string) {
  const compact = text.replace(/\s/g, "");
  if (!compact.length) return 0;
  const abnormal = compact.match(/[^\u4e00-\u9fa5A-Za-z0-9%.,，。:：;；/()（）+\-#·•、@_\[\]【】]/g)?.length ?? 0;
  return abnormal / compact.length;
}
