import {
  analyzeResumeInput,
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
          "你是 BiasBreaker Career 的核心分析引擎，目标是帮助非典型求职者避免被 ATS/招聘算法误读。",
          "你的工作不是判断候选人强弱，而是判断“真实能力是否被机器和 HR 正确看见”。",
          "必须遵守：1. 只基于输入 JD、简历和 Embedding 语义证据；2. 不编造经历、项目、数据、公司、职位、奖项或结果；3. 不承诺录用；4. 不输出年龄、性别、地域、学校出身等歧视性结论；5. 对岗位隐性门槛只做风险提示，不把它归咎于候选人。",
          "分析标准：关键词覆盖看 JD 核心能力是否在简历中有字面或同义表达；结构清晰度看教育/项目/实习/技能是否可被解析；经历证据看动作-对象-方法-结果是否闭环；系统可读性（ATS）看格式、片段完整度、可复制文本、术语稳定性。ATS 指招聘系统自动读取和筛选简历的能力，输出时需要用用户能理解的解释。",
          "改写建议必须是证据约束改写：只能把已有经历转译成岗位语言。若缺少证据，必须提示“待补充/待确认”，不能替用户凭空生成。",
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
      task: "生成一份算法可读性完整报告，先识别会被机器误读的点，再给出可执行、可申诉、可复核的材料优化建议。",
      outputContract: {
        score: "0-100 整数，综合字面匹配、语义匹配、结构、证据、ATS 可读性；不要只看关键词。",
        level: "low | medium | high。注意最终系统会按 score 重新校准：score < 75 为 high，75-90 为 medium，>90 为 low。",
        summary: "不超过 80 字，先说核心结论，再说最需要修正的一点。",
        dimensions:
          "必须返回 4 项：keywordCoverage/关键词覆盖、structureClarity/结构清晰度、evidenceStrength/经历证据、atsReadability/系统可读性（ATS）。每项 score 0-100，summary 不超过 40 字。",
        findings:
          "返回 2-4 项。每项包含 type,severity,source,evidence,suggestion。evidence 必须引用或概括原文具体证据；suggestion 必须指出如何修，不要泛泛而谈。",
        suggestions:
          "返回 3 项。每项包含 title,description,example。example 是可直接替换到简历/补充说明中的示例，必须忠实于原文。缺证据时使用 [待确认：...] 占位。",
        reviewScripts:
          "manualReview 是给 HR/招聘方的复核话术，120-180 字；interviewExplanation 是面试解释，100-160 字；岗位名必须简短，不要复制完整 JD。"
      },
      scoringGuidance: {
        keywordCoverage: "JD 核心词、同义词、能力表达是否被简历覆盖；Embedding 相关但字面缺失时，不能直接判 0，要指出转译缺口。",
        structureClarity: "栏目标题、分段、项目层级、技能列表是否便于 ATS 定位。",
        evidenceStrength: "是否有对象、动作、方法、产出、量化指标；没有数字时可建议补充但不能编造。",
        atsReadability: "PDF/DOCX 已解析为文本，但仍需关注术语稳定、缩写解释、项目职责是否分散。"
      },
      ruleScores: fallback.dimensions.map((item) => ({
        key: item.key,
        score: item.score
      })),
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
  const dimensions = normalizeDimensions(parsed.dimensions, fallback.dimensions);
  const score = clampInteger(parsed.score, fallback.score);
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

function parseJsonObject(text: string): JsonObject {
  try {
    return asObject(JSON.parse(text));
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("模型未返回有效 JSON。");
    return asObject(JSON.parse(match[0]));
  }
}

function normalizeDimensions(value: unknown, fallback: AnalysisDimension[]) {
  if (!Array.isArray(value)) return fallback;
  const allowed = new Set(fallback.map((item) => item.key));
  const items = value
    .map((item) => {
      const record = asObject(item);
      const key = typeof record.key === "string" && allowed.has(record.key as AnalysisDimension["key"]) ? record.key : undefined;
      return {
        key,
        label: normalizeString(record.label, ""),
        score: clampInteger(record.score, 0),
        summary: normalizeString(record.summary, "")
      };
    })
    .filter((item): item is AnalysisDimension => Boolean(item.key && item.label && item.summary));

  return fallback.map((dimension) => items.find((item) => item.key === dimension.key) || dimension);
}

function normalizeFindings(value: unknown, fallback: AnalysisFinding[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => {
      const record = asObject(item);
      return {
        type: normalizeString(record.type, ""),
        severity: normalizeLevel(record.severity, "medium"),
        source: normalizeSource(record.source),
        evidence: normalizeString(record.evidence, ""),
        suggestion: normalizeString(record.suggestion, "")
      };
    })
    .filter((item) => item.type && item.evidence && item.suggestion);

  return items.length ? items.slice(0, 6) : fallback;
}

function normalizeSuggestions(value: unknown, fallback: AnalysisSuggestion[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => {
      const record = asObject(item);
      return {
        title: normalizeString(record.title, ""),
        description: normalizeString(record.description, ""),
        example: normalizeString(record.example, "")
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
