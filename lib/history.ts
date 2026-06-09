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

    const records = parsed
      .filter(isHistoryRecord)
      .map((record) => ({
        ...record,
        candidateName: inferCandidateName(record.resumeText, record.resumeFileName)
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return records;
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
  const candidateName = inferCandidateName(input.resumeText, input.resumeFileName);
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

function inferCandidateName(resumeText?: string, fileName?: string) {
  const textName = extractNameFromResumeText(resumeText);
  if (textName) return textName;
  return inferCandidateNameFromFileName(fileName);
}

function extractNameFromResumeText(resumeText?: string) {
  if (!resumeText?.trim()) return "";

  const lines = resumeText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 30);

  for (const line of lines) {
    const explicitMatch = line.match(/^(?:姓名|名字|name)\s*[:：]\s*([\u4e00-\u9fff·]{2,8}|[A-Za-z][A-Za-z .'-]{1,40})$/i);
    if (explicitMatch) {
      const name = sanitizeCandidateName(explicitMatch[1]);
      if (isLikelyCandidateName(name)) return name;
    }
  }

  const headerLines = lines.slice(0, 12);
  for (const line of headerLines) {
    const compact = sanitizeCandidateName(line);
    if (isLikelyCandidateName(compact)) return compact;

    const leadingChineseName = line.match(/^([\u4e00-\u9fff·]{2,4})(?=\s|[|｜·•]|$)/);
    if (leadingChineseName) {
      const name = sanitizeCandidateName(leadingChineseName[1]);
      if (isLikelyCandidateName(name)) return name;
    }
  }

  return "";
}

function sanitizeCandidateName(value: string) {
  return value
    .replace(/[|｜•]+.*$/, "")
    .replace(/\s*(?:电话|手机|邮箱|email|tel|求职意向|应聘岗位).*$/i, "")
    .replace(/^[^\u4e00-\u9fffA-Za-z]+|[^\u4e00-\u9fffA-Za-z· .'-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyCandidateName(value: string) {
  if (!value) return false;

  const blocked = new Set([
    "个人简历",
    "求职简历",
    "教育背景",
    "教育经历",
    "实习经历",
    "项目经历",
    "工作经历",
    "校园经历",
    "个人信息",
    "基本信息",
    "专业技能",
    "技能证书",
    "自我评价",
    "求职意向",
    "联系方式"
  ]);

  if (blocked.has(value)) return false;
  if (/\d|@|https?:|www\./i.test(value)) return false;
  if (/^(?:男|女|本科|硕士|博士|党员|群众)$/.test(value)) return false;

  if (/^[\u4e00-\u9fff]{2,4}$/.test(value)) return true;
  if (/^[\u4e00-\u9fff]{1,4}·[\u4e00-\u9fff]{1,6}$/.test(value)) return true;
  if (/^[A-Za-z][A-Za-z .'-]{1,40}$/.test(value) && value.split(/\s+/).length <= 5) return true;

  return false;
}

function inferCandidateNameFromFileName(fileName?: string) {
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
