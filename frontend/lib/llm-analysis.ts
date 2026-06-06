import {
  analyzeResumeInput,
  type AnalysisDimension,
  type AnalysisFinding,
  type AnalysisRequest,
  type AnalysisResponse,
  type AnalysisSuggestion,
  type RiskLevel
} from "./analysis";
import type { LLMProvider } from "./model-provider";

type JsonObject = Record<string, unknown>;

export async function analyzeResumeWithLLM(input: AnalysisRequest, provider: LLMProvider): Promise<AnalysisResponse> {
  const fallback = analyzeResumeInput(input);
  const result = await provider.generate({
    task: "resume-algorithm-readability-analysis",
    responseFormat: "json",
    messages: [
      {
        role: "system",
        content:
          "你是 BiasBreaker Career 的简历算法可读性分析引擎。你只基于用户提供的岗位 JD 与简历文本分析，不编造经历、不承诺录用、不输出歧视性判断。输出必须是严格 JSON，不能包含 Markdown。"
      },
      {
        role: "user",
        content: buildPrompt(input, fallback)
      }
    ]
  });

  return normalizeLLMResponse(result.text, fallback);
}

function buildPrompt(input: AnalysisRequest, fallback: AnalysisResponse) {
  return JSON.stringify(
    {
      instruction:
        "输出严格 JSON。字段：score number; level low|medium|high; summary string; dimensions[4] key=keywordCoverage|structureClarity|evidenceStrength|atsReadability,label,score,summary; findings<=4 type,severity,source,evidence,suggestion; suggestions<=3 title,description,example; reviewScripts.manualReview,interviewExplanation。必须基于原文证据，不编造经历/数据/录用承诺。",
      ruleScores: fallback.dimensions.map((item) => ({
        key: item.key,
        score: item.score
      })),
      jobTitle: compactJobTitle(input.jobTitle, input.jdText),
      jdText: compactText(input.jdText, 3800),
      resumeFileName: input.resumeFileName,
      resumeText: compactText(input.resumeText, 6500)
    },
    null,
    0
  );
}

function normalizeLLMResponse(text: string, fallback: AnalysisResponse): AnalysisResponse {
  const parsed = parseJsonObject(text);
  const reviewScripts = asObject(parsed.reviewScripts);
  const dimensions = normalizeDimensions(parsed.dimensions, fallback.dimensions);
  const score = clampInteger(parsed.score, fallback.score);
  const level = normalizeLevel(parsed.level, fallback.level);

  return {
    ...fallback,
    providerMode: "llm",
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
