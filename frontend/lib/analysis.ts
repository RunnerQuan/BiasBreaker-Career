import {
  clamp,
  extractJDKeywords,
  findMatchedKeywords,
  findMissingKeywords,
  findRiskMarkers,
  includesLoose,
  scoreEvidenceChain,
  selectCareerLexicon,
  unique
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

type AtsReadabilityResult = {
  score: number;
  summary: string;
};

function pickEvidence(text: string, terms: string[]) {
  const lines = text
    .split(/\n|。|；|;/)
    .map((line) => line.trim())
    .filter(Boolean);
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

export function analyzeResumeInput(input: AnalysisRequest): AnalysisResponse {
  const jdText = input.jdText.trim();
  const resumeText = input.resumeText.trim();
  const selectedLexicon = selectCareerLexicon(jdText, input.jobTitle);
  const jdKeywords = extractJDKeywords(jdText, selectedLexicon);
  const fallbackKeywords = selectedLexicon.keywords.slice(0, 24);
  const targetKeywords = jdKeywords.length ? jdKeywords : fallbackKeywords;
  const matchedKeywords = findMatchedKeywords(resumeText, targetKeywords, selectedLexicon.synonyms);
  const missingKeywords = findMissingKeywords(resumeText, targetKeywords, selectedLexicon.synonyms);
  const evidence = scoreEvidenceChain(resumeText, selectedLexicon);
  const riskMarkers = findRiskMarkers(jdText, selectedLexicon);

  const keywordCoverage = targetKeywords.length === 0 ? 58 : clamp((matchedKeywords.length / targetKeywords.length) * 100);
  const structureClarity = clamp(
    42 +
      selectedLexicon.structureMarkers.filter((marker) => includesLoose(resumeText, marker)).length * 5 +
      Math.min(resumeText.split(/\n/).filter(Boolean).length, 10) * 2
  );
  const evidenceStrength = evidence.score;
  const atsReadabilityResult = scoreAtsReadability(resumeText, input.resumeFileName, structureClarity);
  const atsReadability = atsReadabilityResult.score;

  const score = clamp(keywordCoverage * 0.34 + structureClarity * 0.2 + evidenceStrength * 0.32 + atsReadability * 0.14);
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

  if (evidenceStrength < 72 || !evidence.hasChain) {
    findings.push({
      type: "经历证据链不足",
      severity: evidenceStrength < 58 ? "high" : "medium",
      source: "resume",
      evidence: pickEvidence(resumeText, evidenceTerms.length ? evidenceTerms : targetKeywords),
      suggestion: "建议补齐“动作—对象—方法/工具—产出/指标”链条，例如说明你分析了什么对象、用什么方法、输出了什么结果。"
    });
  }

  if (structureClarity < 70) {
    findings.push({
      type: "结构可读性风险",
      severity: "medium",
      source: "resume",
      evidence: "简历结构标题或分段信号不足，自动解析时可能难以定位教育、项目、实习、技能等信息。",
      suggestion: "使用清晰栏目标题，并将项目经历按背景、职责、行动、结果拆分。"
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
    dimensions: [
      {
        key: "keywordCoverage",
        label: "关键词覆盖",
        score: keywordCoverage,
        summary: matchedKeywords.length ? `已覆盖 ${matchedKeywords.slice(0, 8).join("、")}` : "暂未覆盖明显岗位关键词"
      },
      {
        key: "structureClarity",
        label: "结构清晰度",
        score: structureClarity,
        summary: "检测教育、项目、经历、技能等结构信号"
      },
      {
        key: "evidenceStrength",
        label: "经历证据",
        score: evidenceStrength,
        summary: evidence.hasChain ? "已形成基础证据链" : "动作、对象、方法或结果链条仍需补齐"
      },
      {
        key: "atsReadability",
        label: "系统可读性（ATS）",
        score: atsReadability,
        summary: atsReadabilityResult.summary
      }
    ],
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
  const hasExcellentStructure = structureClarity >= 92;
  const hasReadableChars = readableRatio >= 0.65;
  const hasVeryReadableChars = readableRatio >= 0.78;
  const hasLikelyGarbledText = textLength > 0 && readableRatio < 0.45;

  let score = 68;
  const reasons: string[] = [];

  if (!hasFile) {
    score += 8;
    reasons.push("基于粘贴文本分析");
  } else if (isPlainTextFile) {
    score += 14;
    reasons.push(`已接收 ${fileName}，纯文本格式便于系统读取`);
  } else if (isParsedDocument) {
    score += hasEnoughText ? 12 : 4;
    reasons.push(`已成功解析 ${fileName}`);
  } else {
    score += 2;
    reasons.push(`已接收 ${fileName}，该格式存在一定解析不确定性`);
  }

  if (hasRichStructure) {
    score += hasExcellentStructure ? 10 : 7;
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

  return {
    score: clamp(score),
    summary: reasons.slice(0, 4).join("；") || "基于文件格式、文本提取质量、栏目结构和字符可读性进行评估"
  };
}

function readableTextRatio(text: string) {
  const compact = text.replace(/\s/g, "");
  if (!compact.length) return 0;
  const readable = compact.match(/[\u4e00-\u9fa5A-Za-z0-9%.,，。:：;；/()（）+\-#]/g)?.length ?? 0;
  return readable / compact.length;
}
