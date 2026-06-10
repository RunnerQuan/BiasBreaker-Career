import {
  analyzeResumeInput,
  calculateTotalScore,
  type AnalysisDimension,
  type AnalysisFinding,
  type AnalysisRequest,
  type AnalysisResponse,
  type AnalysisSuggestion,
  riskLevelFromScore,
  type RiskLevel
} from "./analysis";
import type { LLMProvider } from "./model-provider";
import type { SemanticSignals } from "./semantic-analysis";

type JsonObject = Record<string, unknown>;
type DimensionKey = AnalysisDimension["key"];

type DimensionAdjustment = {
  key: DimensionKey;
  delta: number;
  reason: string;
};

const DELTA_LIMITS: Record<DimensionKey, { min: number; max: number }> = {
  keywordCoverage: { min: -15, max: 15 },
  structureClarity: { min: -8, max: 5 },
  evidenceStrength: { min: -20, max: 10 },
  atsReadability: { min: -5, max: 5 }
};

const FINDING_TYPE_LABELS: Record<string, string> = {
  keywordGap: "岗位关键词缺口",
  keywordCoverage: "岗位关键词覆盖不足",
  missingKeywords: "岗位关键词缺失",
  evidenceMisalignment: "经历证据与岗位要求不匹配",
  weakEvidence: "经历证据不足",
  evidenceGap: "经历证据不足",
  missingMetrics: "成果量化不足",
  lackOfMetrics: "成果量化不足",
  translatableSkills: "可迁移能力未充分转译",
  transferableSkills: "可迁移能力未充分转译",
  atsReadability: "系统可读性（ATS）风险",
  atsRisk: "系统可读性（ATS）风险",
  structureIssue: "简历结构表达问题",
  structureClarity: "简历结构表达问题",
  unclearResponsibility: "职责表达不清",
  genericDescription: "经历描述过于泛化"
};

export async function analyzeResumeWithLLM(
  input: AnalysisRequest,
  provider: LLMProvider,
  semanticSignals?: SemanticSignals
): Promise<AnalysisResponse> {
  const fallback = analyzeResumeInput(input);
  const result = await provider.generate({
    task: "resume-algorithm-readability-analysis",
    responseFormat: "json",
    messages: [
      {
        role: "system",
        content: [
          "你是 BiasBreaker Career 的语义校准与证据约束改写引擎，目标是帮助非典型求职者避免被 ATS/招聘算法误读。",
          "你不能直接覆盖规则分，也不能直接决定最终总分。规则分是稳定、可复现的底座；你的工作是基于 JD、简历和语义证据，对规则分做有限幅度校准，并生成可对照的改写建议。",
          "必须遵守：1. 只基于输入 JD、简历和 Embedding 语义证据；2. 不编造经历、项目、数据、公司、职位、奖项或结果；3. 不承诺录用；4. 不输出年龄、性别、地域、学校出身等歧视性结论；5. 对岗位隐性门槛只做风险提示，不把它归咎于候选人。",
          "校准原则：关键词覆盖可以因同义表达、跨专业经历转译适度上调或下调；经历证据要更严格，若只有空泛动作词但缺少对象/方法/产出/指标，应下调；结构清晰度和 ATS 可读性只能小幅校准，因为它们主要由系统解析质量决定。",
          "改写原则：每条 suggestion 必须包含 original、risk、rewritten、reason、severity。original 必须来自简历原文或对原文的忠实摘录；risk 必须说明算法/HR 误读风险；rewritten 只能改写已有经历，缺少数据时用 [待确认：...] 占位；reason 解释为什么这样改。",
          "所有面向用户展示的字段必须使用简体中文。findings.type 必须是简洁、自然的中文问题名称，禁止输出 keywordGap、evidenceMisalignment、translatableSkills 等英文枚举、变量名或 camelCase 标识。",
          "输出严格 JSON，不要 Markdown，不要解释 JSON 外的任何文字。"
        ].join("\n")
      },
      {
        role: "user",
        content: buildPrompt(input, fallback, semanticSignals)
      }
    ]
  });

  return normalizeLLMResponse(result.text, fallback, semanticSignals);
}

function buildPrompt(input: AnalysisRequest, fallback: AnalysisResponse, semanticSignals?: SemanticSignals) {
  return JSON.stringify(
    {
      task: "基于规则分进行语义校准，并生成算法可读性报告。不要直接重评分，只输出每个维度的有限调整项 delta 和理由；改写建议必须使用“原句-风险-改写后-改写理由”的结构。",
      outputContract: {
        dimensionAdjustments:
          "必须返回数组。每项包含 key, delta, reason。key 只能是 keywordCoverage/structureClarity/evidenceStrength/atsReadability。delta 是整数，表示在规则分基础上的调整，不是最终分。reason 必须引用 JD/简历中的具体证据或指出缺失证据。",
        deltaLimits:
          "系统会强制裁剪：keywordCoverage [-15,+15]；evidenceStrength [-20,+10]；structureClarity [-8,+5]；atsReadability [-5,+5]。不要试图绕过限制。",
        summary: "不超过 80 字，先说核心结论，再说最需要修正的一点。",
        findings:
          "返回 2-4 项。每项包含 type,severity,source,evidence,suggestion。type 必须是面向求职者展示的简体中文问题名称，不得使用英文枚举、变量名或 camelCase，例如不得输出 keywordGap、evidenceMisalignment、translatableSkills。可使用“岗位关键词缺口”“经历证据与岗位要求不匹配”“可迁移能力未充分转译”“成果量化不足”“系统可读性（ATS）风险”等自然中文名称。evidence 必须引用或概括原文具体证据；suggestion 必须指出如何修，不要泛泛而谈。",
        suggestions:
          "返回 3 项。每项必须包含 title,description,example,original,risk,rewritten,reason,severity。severity 为 low/medium/high。original 是简历原句或忠实摘录；risk 是误读风险；rewritten 是改写后可替换文本；reason 是改写理由；example 应与 rewritten 保持一致。缺少真实数据时必须使用 [待确认：具体数据/指标]，不能编造。",
        reviewScripts:
          "manualReview 是给 HR/招聘方的复核话术，120-180 字；interviewExplanation 是面试解释，100-160 字；岗位名必须简短，不要复制完整 JD。"
      },
      suggestionExample: {
        title: "补齐岗位关键词：用户增长与活动转化",
        severity: "medium",
        original: "负责校园活动宣传和社群维护。",
        risk: "原句未体现 JD 中的用户增长、活动转化等核心能力，ATS 可能只识别为普通宣传协助。",
        rewritten: "参与校园社群运营与活动转化，通过微信群触达、报名反馈整理和活动复盘，支持用户增长目标。",
        reason: "将“宣传、维护”转译为“社群运营、活动转化、用户增长”，但不编造不存在的数据。",
        description: "把泛化职责转译为岗位语言。",
        example: "参与校园社群运营与活动转化，通过微信群触达、报名反馈整理和活动复盘，支持用户增长目标。"
      },
      scoringGuidance: {
        finalFormula: "最终维度分 = 规则分 + 有界 delta；最终总分 = keywordCoverage * 0.34 + structureClarity * 0.20 + evidenceStrength * 0.32 + atsReadability * 0.14。系统会自动计算，你不需要返回最终 score。",
        keywordCoverage: "若简历没有字面关键词，但存在同义能力或可证明的跨经历转译，可小幅上调；若只是泛泛接近但没有岗位核心能力，不要上调。",
        evidenceStrength: "若规则因动作词、对象词误判高分，但实际没有方法、产出、指标或业务结果，应下调；如果有完整证据链但词库漏识别，可小幅上调。",
        structureClarity: "只在栏目明显混乱、长段落堆叠、时间线不可定位时小幅下调；不要因为内容好就上调结构。",
        atsReadability: "你只能看到解析后的文本，因此不要大幅调整 ATS；仅在明显存在乱码、术语极不稳定、缩写未解释、职责分散时小幅下调。"
      },
      ruleDimensions: fallback.dimensions.map((item) => ({
        key: item.key,
        label: item.label,
        score: item.score,
        summary: item.summary
      })),
      ruleSuggestions: fallback.suggestions,
      semanticSignals,
      jobTitle: compactJobTitle(input.jobTitle, input.jdText),
      jdText: compactText(input.jdText, 3800),
      resumeFileName: input.resumeFileName,
      resumeText: compactText(input.resumeText, 6500)
    },
    null,
    0
  );
}

function normalizeLLMResponse(text: string, fallback: AnalysisResponse, semanticSignals?: SemanticSignals): AnalysisResponse {
  const parsed = parseJsonObject(text);
  const reviewScripts = asObject(parsed.reviewScripts);
  const adjustments = normalizeAdjustments(parsed.dimensionAdjustments);
  const dimensions = applyAdjustments(fallback.dimensions, adjustments);
  const score = calculateTotalScore(dimensions);
  const level = riskLevelFromScore(score);

  return {
    ...fallback,
    providerMode: "llm",
    semanticMatch: semanticSignals,
    score,
    level,
    summary: normalizeString(parsed.summary, fallback.summary),
    dimensions,
    findings: normalizeFindings(parsed.findings, fallback.findings),
    suggestions: normalizeSuggestions(parsed.suggestions, fallback.suggestions),
    reviewScripts: {
      manualReview: normalizeString(reviewScripts.manualReview, fallback.reviewScripts.manualReview),
      interviewExplanation: normalizeString(
        reviewScripts.interviewExplanation,
        fallback.reviewScripts.interviewExplanation
      )
    }
  };
}

function normalizeAdjustments(value: unknown): DimensionAdjustment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asObject(item);
      const key = normalizeDimensionKey(record.key);
      if (!key) return undefined;
      const limits = DELTA_LIMITS[key];
      const rawDelta = Number(record.delta);
      const delta = Number.isFinite(rawDelta) ? Math.min(limits.max, Math.max(limits.min, Math.round(rawDelta))) : 0;
      const reason = normalizeString(record.reason, "基于语义证据进行有限校准。");
      return { key, delta, reason };
    })
    .filter((item): item is DimensionAdjustment => Boolean(item && item.delta !== 0));
}

function applyAdjustments(ruleDimensions: AnalysisDimension[], adjustments: DimensionAdjustment[]) {
  return ruleDimensions.map((dimension) => {
    const adjustment = adjustments.find((item) => item.key === dimension.key);
    if (!adjustment) return dimension;
    const adjustedScore = clampInteger(dimension.score + adjustment.delta, dimension.score);
    const sign = adjustment.delta > 0 ? "+" : "";
    return {
      ...dimension,
      score: adjustedScore,
      summary: `${dimension.summary}；LLM校准 ${sign}${adjustment.delta}：${adjustment.reason}`
    };
  });
}

function parseJsonObject(text: string): JsonObject {
  try {
    return asObject(JSON.parse(text));
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("模型未返回有效 JSON。");
    return asObject(JSON.parse(match[0]));
  }
}

function normalizeFindings(value: unknown, fallback: AnalysisFinding[]) {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item, type: normalizeFindingType(item.type) }));
  const items = value
    .map((item) => {
      const record = asObject(item);
      return {
        type: normalizeFindingType(record.type),
        severity: normalizeLevel(record.severity, "medium"),
        source: normalizeSource(record.source),
        evidence: normalizeString(record.evidence, ""),
        suggestion: normalizeString(record.suggestion, "")
      };
    })
    .filter((item) => item.type && item.evidence && item.suggestion);

  return items.length
    ? items.slice(0, 6)
    : fallback.map((item) => ({ ...item, type: normalizeFindingType(item.type) }));
}

function normalizeFindingType(value: unknown) {
  const raw = normalizeString(value, "待优化问题");
  const direct = FINDING_TYPE_LABELS[raw];
  if (direct) return direct;

  const normalizedKey = raw.replace(/[\s_-]+/g, "").toLowerCase();
  const matchedEntry = Object.entries(FINDING_TYPE_LABELS).find(
    ([key]) => key.replace(/[\s_-]+/g, "").toLowerCase() === normalizedKey
  );
  if (matchedEntry) return matchedEntry[1];

  return /[A-Za-z]/.test(raw) && !/[\u4e00-\u9fff]/.test(raw) ? "待优化问题" : raw;
}

function normalizeSuggestions(value: unknown, fallback: AnalysisSuggestion[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => {
      const record = asObject(item);
      const rewritten = normalizeString(record.rewritten, normalizeString(record.example, ""));
      const original = normalizeString(record.original, "");
      const risk = normalizeString(record.risk, normalizeString(record.description, ""));
      const reason = normalizeString(record.reason, normalizeString(record.description, ""));
      return {
        title: normalizeString(record.title, ""),
        description: normalizeString(record.description, risk || reason),
        example: normalizeString(record.example, rewritten),
        original,
        risk,
        rewritten,
        reason,
        severity: normalizeLevel(record.severity, "medium")
      };
    })
    .filter((item) => item.title && item.description && item.example);

  return items.length ? items.slice(0, 5) : fallback;
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function clampInteger(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function normalizeLevel(value: unknown, fallback: RiskLevel): RiskLevel {
  return value === "low" || value === "medium" || value === "high" ? value : fallback;
}

function normalizeSource(value: unknown): AnalysisFinding["source"] {
  return value === "jd" || value === "resume" || value === "system" ? value : "system";
}

function normalizeDimensionKey(value: unknown): DimensionKey | undefined {
  return value === "keywordCoverage" || value === "structureClarity" || value === "evidenceStrength" || value === "atsReadability"
    ? value
    : undefined;
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function compactText(value: string, maxLength: number) {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) return compacted;
  const head = compacted.slice(0, Math.floor(maxLength * 0.72));
  const tail = compacted.slice(-Math.floor(maxLength * 0.28));
  return `${head}\n...[中间内容已压缩，保留首尾关键信息]...\n${tail}`;
}

function compactJobTitle(jobTitle: string, jdText: string) {
  const raw = (jobTitle || jdText.split(/\n|。/)[0] || "目标岗位").replace(/\s+/g, " ").trim();
  const withoutLabel = raw.replace(/岗位描述[\s\S]*/, "").replace(/【关于[\s\S]*/, "").trim();
  return withoutLabel.slice(0, 36) || "目标岗位";
}
