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

const keywordLexicon = [
  "数据分析",
  "用户增长",
  "内容运营",
  "小红书",
  "投放复盘",
  "用户调研",
  "竞品分析",
  "SQL",
  "Excel",
  "Python",
  "A/B",
  "社群运营",
  "活动策划",
  "产品",
  "运营",
  "反馈",
  "复盘"
];

const structureMarkers = ["教育", "实习", "项目", "经历", "技能", "获奖", "校园", "工作", "证书"];
const evidenceMarkers = ["负责", "参与", "完成", "输出", "提升", "降低", "增长", "优化", "分析", "整理", "%", "人", "份", "次", "篇"];

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function includesLoose(text: string, keyword: string) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function pickEvidence(text: string, terms: string[]) {
  const lines = text
    .split(/\n|。|；|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => terms.some((term) => includesLoose(line, term))) ?? lines[0] ?? "暂未找到明确证据句。";
}

function riskLevel(score: number): RiskLevel {
  if (score >= 82) return "low";
  if (score >= 62) return "medium";
  return "high";
}

export function analyzeResumeInput(input: AnalysisRequest): AnalysisResponse {
  const jdText = input.jdText.trim();
  const resumeText = input.resumeText.trim();
  const jdKeywords = unique(keywordLexicon.filter((keyword) => includesLoose(jdText, keyword)));
  const matchedKeywords = jdKeywords.filter((keyword) => includesLoose(resumeText, keyword));
  const missingKeywords = jdKeywords.filter((keyword) => !includesLoose(resumeText, keyword));

  const keywordCoverage = jdKeywords.length === 0 ? 58 : clamp((matchedKeywords.length / jdKeywords.length) * 100);
  const structureClarity = clamp(
    42 +
      structureMarkers.filter((marker) => includesLoose(resumeText, marker)).length * 8 +
      Math.min(resumeText.split(/\n/).filter(Boolean).length, 10) * 2
  );
  const evidenceStrength = clamp(
    38 +
      evidenceMarkers.filter((marker) => includesLoose(resumeText, marker)).length * 4 +
      (/\d/.test(resumeText) ? 14 : 0)
  );
  const atsReadability = clamp(82 - (input.resumeFileName && !/\.(txt|md)$/i.test(input.resumeFileName) ? 8 : 0) - (resumeText.length < 160 ? 18 : 0));

  const score = clamp(keywordCoverage * 0.36 + structureClarity * 0.22 + evidenceStrength * 0.28 + atsReadability * 0.14);
  const level = riskLevel(score);

  const findings: AnalysisFinding[] = [];
  if (missingKeywords.length > 0) {
    findings.push({
      type: "关键词缺失风险",
      severity: missingKeywords.length >= 3 ? "high" : "medium",
      source: "resume",
      evidence: `JD 提到 ${missingKeywords.slice(0, 5).join("、")}，简历中未形成明确表达。`,
      suggestion: "把真实经历转译为岗位关键词，但不要新增未发生过的项目或数据。"
    });
  }

  if (evidenceStrength < 70) {
    findings.push({
      type: "经历证据不足",
      severity: evidenceStrength < 55 ? "high" : "medium",
      source: "resume",
      evidence: pickEvidence(resumeText, matchedKeywords.length ? matchedKeywords : evidenceMarkers),
      suggestion: "为关键经历补充对象、动作、方法和结果，例如数据规模、分析方法、输出物或协作结果。"
    });
  }

  if (structureClarity < 70) {
    findings.push({
      type: "结构可读性风险",
      severity: "medium",
      source: "resume",
      evidence: "简历结构标题或分段信号不足，自动解析时可能难以定位教育、项目、技能等信息。",
      suggestion: "使用清晰栏目标题，并将项目经历按职责、行动、结果拆分。"
    });
  }

  if (/形象气质佳|抗压|吃苦耐劳|年轻|不限经验/.test(jdText)) {
    findings.push({
      type: "岗位隐性门槛风险",
      severity: "medium",
      source: "jd",
      evidence: pickEvidence(jdText, ["形象气质佳", "抗压", "吃苦耐劳", "年轻", "不限经验"]),
      suggestion: "该风险不计入个人分数，建议在投递或面试中围绕能力要求进一步澄清。"
    });
  }

  if (findings.length === 0) {
    findings.push({
      type: "低风险",
      severity: "low",
      source: "system",
      evidence: "JD 关键词、简历结构和经历证据整体匹配度较好。",
      suggestion: "可继续补充量化结果，让表达更适合自动化系统和 HR 快速阅读。"
    });
  }

  const targetTitle = input.jobTitle.trim() || "目标岗位";
  const mainMissing = missingKeywords.slice(0, 3).join("、") || "岗位核心能力";

  return {
    analysisId: input.analysisId || `analysis_${Date.now()}`,
    createdAt: new Date().toISOString(),
    providerMode: "rules",
    score,
    level,
    summary:
      level === "low"
        ? "当前材料具备较好的算法可读性，可继续优化量化证据。"
        : "主要风险不是能力不足，而是部分经历尚未被转译成岗位系统容易识别的表达。",
    dimensions: [
      {
        key: "keywordCoverage",
        label: "关键词覆盖",
        score: keywordCoverage,
        summary: matchedKeywords.length ? `已覆盖 ${matchedKeywords.join("、")}` : "暂未覆盖明显岗位关键词"
      },
      {
        key: "structureClarity",
        label: "结构清晰度",
        score: structureClarity,
        summary: "检测教育、项目、经历与技能等结构信号"
      },
      {
        key: "evidenceStrength",
        label: "经历证据",
        score: evidenceStrength,
        summary: "衡量行动、方法、对象和结果是否清楚"
      },
      {
        key: "atsReadability",
        label: "ATS 可读性",
        score: atsReadability,
        summary: input.resumeFileName ? `已接收 ${input.resumeFileName}` : "基于粘贴文本进行解析"
      }
    ],
    findings,
    suggestions: [
      {
        title: "补齐岗位关键词",
        description: `优先处理 ${mainMissing} 等表达缺口。`,
        example: `将真实经历改写为“围绕${mainMissing}整理反馈、分析表现并输出复盘建议”。`
      },
      {
        title: "把经历写成证据链",
        description: "避免只写“熟悉、参与、负责”，补充对象、动作和产出。",
        example: "参与内容运营数据整理，按渠道归纳用户反馈，输出选题优化建议。"
      },
      {
        title: "准备人工复核说明",
        description: "对于校园项目、跨专业或非典型经历，用能力语言解释相关性。",
        example: `我的经历与${targetTitle}的要求相关，主要体现在信息整理、用户反馈分析和阶段复盘能力。`
      }
    ],
    reviewScripts: {
      manualReview: `您好，我刚刚投递贵司【${targetTitle}】岗位。由于我的部分经历属于校园项目或跨领域实践，可能无法完全通过自动化筛选呈现其相关性。为便于贵团队更全面评估，我补充说明：我曾围绕用户反馈、内容表现或项目复盘进行整理分析，具备与岗位相关的信息处理、协作和优化能力。若方便，烦请进行人工复核。感谢您的时间。`,
      interviewExplanation: `这段经历虽然不是传统实习，但我承担了信息整理、问题分析和结果复盘工作。它对应到${targetTitle}岗位中，主要体现为快速理解业务目标、拆解任务并沉淀可执行建议的能力。`
    }
  };
}

