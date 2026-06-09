import type { AnalysisResponse, RiskLevel } from "./analysis";

export const HISTORY_STORAGE_KEY = "biasbreaker-career-history";

export type HistoryRecord = {
  id: string;
  candidateName: string;
  targetJob: string;
  jdText?: string;
  resumeText?: string;
  resumeFileName?: string;
  createdAt: string;
  result: AnalysisResponse;
};

export function readHistoryRecords(): HistoryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryRecord).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

export function saveHistoryRecord(record: HistoryRecord) {
  if (typeof window === "undefined") return;

  const records = readHistoryRecords();
  const next = [record, ...records.filter((item) => item.id !== record.id)];
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
}

export function deleteHistoryRecords(ids: string[]) {
  if (typeof window === "undefined") return;

  const idSet = new Set(ids);
  const next = readHistoryRecords().filter((record) => !idSet.has(record.id));
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
}

export function createHistoryRecord(input: {
  jobTitle: string;
  jdText?: string;
  resumeText?: string;
  resumeFileName?: string;
  result: AnalysisResponse;
}): HistoryRecord {
  const candidateName = inferCandidateName(input.resumeFileName);
  const targetJob = normalizeTargetJob(input.jobTitle);

  return {
    id: input.result.analysisId,
    candidateName,
    targetJob,
    jdText: input.jdText?.trim(),
    resumeText: input.resumeText?.trim(),
    resumeFileName: input.resumeFileName,
    createdAt: input.result.createdAt,
    result: input.result
  };
}

export function levelText(level: RiskLevel) {
  if (level === "low") return "低风险";
  if (level === "high") return "高风险";
  return "中等风险";
}

export function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildReportMarkdown(record: HistoryRecord) {
  const result = record.result;
  return [
    `# BiasBreaker Career 分析报告`,
    ``,
    `- 候选人：${record.candidateName}`,
    `- 目标岗位：${record.targetJob}`,
    `- 综合评分：${result.score}/100`,
    `- 风险等级：${levelText(result.level)}`,
    `- 分析时间：${formatHistoryTime(record.createdAt)}`,
    `- 分析模式：${result.providerMode === "llm" ? "模型分析" : "规则分析"}`,
    ``,
    `## 总结`,
    result.summary,
    ``,
    `## 维度评分`,
    ...result.dimensions.map((item) => `- ${item.label}：${item.score}/100。${item.summary}`),
    ``,
    `## 风险报告与证据`,
    ...result.findings.flatMap((item) => [
      `### ${item.type}（${levelText(item.severity)}）`,
      `来源：${item.source}`,
      `证据：${item.evidence}`,
      `建议：${item.suggestion}`,
      ``
    ]),
    `## 改写建议`,
    ...result.suggestions.flatMap((item) => [
      `### ${item.title}`,
      item.description,
      `示例：${item.example}`,
      ``
    ]),
    `## 复核话术`,
    result.reviewScripts.manualReview,
    ``,
    `## 面试解释`,
    result.reviewScripts.interviewExplanation,
    ``
  ].join("\n");
}

function inferCandidateName(fileName?: string) {
  if (!fileName) return "我的简历";
  const withoutExt = fileName.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt
    .replace(/简历|resume|cv|中国移动|\(\d+\)|（\d+）/gi, "")
    .replace(/[_\-\s]+/g, " ")
    .trim();
  return cleaned || "我的简历";
}

function normalizeTargetJob(jobTitle: string) {
  const cleaned = jobTitle.replace(/\s+/g, " ").replace(/岗位描述[\s\S]*/, "").replace(/【关于[\s\S]*/, "").trim();
  return cleaned.slice(0, 36) || "目标岗位";
}

function isHistoryRecord(value: unknown): value is HistoryRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<HistoryRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.candidateName === "string" &&
    typeof record.targetJob === "string" &&
    typeof record.createdAt === "string" &&
    Boolean(record.result)
  );
}
