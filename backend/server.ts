import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomUUID } from "node:crypto";
import { analyzeResumeInput, type AnalysisRequest, type AnalysisResponse } from "../lib/analysis";
import { analyzeResumeWithLLM } from "../lib/llm-analysis";
import { createEmbeddingProvider, createLLMProvider } from "../lib/model-provider";
import { createSemanticSignals } from "../lib/semantic-analysis";

type JobStatus = "queued" | "running" | "completed" | "failed";
type JobStage = "queued" | "embedding" | "llm" | "completed" | "failed";

type AnalysisJob = {
  id: string;
  status: JobStatus;
  stage: JobStage;
  createdAt: number;
  updatedAt: number;
  payload: AnalysisRequest;
  result?: AnalysisResponse;
  error?: string;
};

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };
type ChatRequest = {
  jobTitle?: string;
  jdText?: string;
  resumeText?: string;
  resumeFileName?: string;
  analysisResult?: AnalysisResponse;
  messages?: ChatMessage[];
};

const app = Fastify({
  logger: true,
  bodyLimit: 1024 * 1024,
  requestTimeout: 180_000,
  connectionTimeout: 15_000,
  keepAliveTimeout: 72_000
});

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "https://biasbreaker-career.netlify.app,http://localhost:3000")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

await app.register(cors, {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
});

const jobs = new Map<string, AnalysisJob>();
const queue: string[] = [];
const maxConcurrentJobs = Math.max(1, Number(process.env.MAX_CONCURRENT_JOBS || 2));
let activeJobs = 0;

setInterval(() => {
  const expireBefore = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.updatedAt < expireBefore) jobs.delete(id);
  }
}, 10 * 60 * 1000).unref();

app.get("/health", async () => ({
  ok: true,
  service: "biasbreaker-career-backend",
  activeJobs,
  queuedJobs: queue.length,
  now: new Date().toISOString()
}));

app.post<{ Body: AnalysisRequest }>("/api/analyze", async (request, reply) => {
  const payload = validateAndNormalizeAnalysisPayload(request.body);
  try {
    const result = await runAnalysis(payload);
    return reply.send(result);
  } catch (error) {
    request.log.error(error, "analysis failed, falling back to rules");
    return reply.send(analyzeResumeInput(payload));
  }
});

app.post<{ Body: AnalysisRequest }>("/api/analysis-jobs", async (request, reply) => {
  const payload = validateAndNormalizeAnalysisPayload(request.body);
  const id = randomUUID();
  const now = Date.now();

  jobs.set(id, {
    id,
    status: "queued",
    stage: "queued",
    createdAt: now,
    updatedAt: now,
    payload
  });
  queue.push(id);
  void processQueue();

  return reply.code(202).send({ jobId: id, status: "queued" });
});

app.get<{ Params: { jobId: string } }>("/api/analysis-jobs/:jobId", async (request, reply) => {
  const job = jobs.get(request.params.jobId);
  if (!job) return reply.code(404).send({ message: "分析任务不存在或已过期。" });

  return reply.send({
    jobId: job.id,
    status: job.status,
    stage: job.stage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    result: job.result,
    message: job.error
  });
});

app.post<{ Body: ChatRequest }>("/api/chat", async (request, reply) => {
  const payload = request.body || {};
  const messages = normalizeMessages(payload.messages);
  const latestQuestion = messages.at(-1)?.content.trim();
  if (!latestQuestion) return reply.code(400).send({ message: "请输入想追问的问题。" });

  try {
    const provider = createLLMProvider();
    const result = await provider.generate({
      task: "resume-report-contextual-chat",
      responseFormat: "json",
      messages: [
        {
          role: "system",
          content: [
            "你是 BiasBreaker Career 的简历分析追问助手，只围绕当前这份 JD、简历和分析报告回答。",
            "你必须遵守：1. 不编造经历、公司、学校、证书、数据或结果；2. 缺少证据时明确说‘当前简历中未体现’；3. 建议要具体到可修改的表达、优先级或面试解释；4. 不承诺通过筛选；5. 不输出歧视性判断。",
            "回答要简洁、专业、适合大学生求职场景。优先用 2-4 个要点回答。严格输出 JSON：{\"answer\":\"...\"}。"
          ].join("\n")
        },
        { role: "user", content: buildChatPrompt(payload, messages) }
      ]
    });
    return reply.send({ answer: normalizeAnswer(result.text) });
  } catch (error) {
    request.log.error(error, "chat assistant failed");
    return reply.send({ answer: buildFallbackAnswer(payload, latestQuestion) });
  }
});

async function processQueue() {
  while (activeJobs < maxConcurrentJobs && queue.length > 0) {
    const id = queue.shift();
    if (!id) return;
    const job = jobs.get(id);
    if (!job) continue;

    activeJobs += 1;
    job.status = "running";
    job.stage = "embedding";
    job.updatedAt = Date.now();

    void runAnalysis(job.payload, (stage) => {
      job.stage = stage;
      job.updatedAt = Date.now();
    })
      .then((result) => {
        job.status = "completed";
        job.stage = "completed";
        job.result = result;
        job.updatedAt = Date.now();
      })
      .catch((error) => {
        job.status = "failed";
        job.stage = "failed";
        job.error = error instanceof Error ? error.message : "分析失败。";
        job.updatedAt = Date.now();
      })
      .finally(() => {
        activeJobs -= 1;
        void processQueue();
      });
  }
}

async function runAnalysis(payload: AnalysisRequest, onStage?: (stage: JobStage) => void) {
  let semanticSignals;
  try {
    onStage?.("embedding");
    semanticSignals = await createSemanticSignals(payload, createEmbeddingProvider());
  } catch (error) {
    app.log.warn({ error }, "embedding failed, continuing without semantic signals");
  }

  onStage?.("llm");
  try {
    return await analyzeResumeWithLLM(payload, createLLMProvider(), semanticSignals);
  } catch (error) {
    app.log.error({ error }, "LLM analysis failed, using rule fallback");
    return {
      ...analyzeResumeInput(payload),
      semanticMatch: semanticSignals
    };
  }
}

function validateAndNormalizeAnalysisPayload(payload: AnalysisRequest) {
  if (!payload?.jdText?.trim()) throw app.httpErrors.badRequest("请先填写岗位 JD。");
  if (!payload?.resumeText?.trim()) throw app.httpErrors.badRequest("请上传或粘贴可解析的简历文本。");
  if (payload.jdText.length > 8_000) throw app.httpErrors.badRequest("岗位 JD 内容过长。");
  if (payload.resumeText.length > 40_000) throw app.httpErrors.badRequest("简历文本内容过长。");

  return {
    ...payload,
    jobTitle: normalizeJobTitle(payload.jobTitle, payload.jdText),
    jdText: payload.jdText.trim(),
    resumeText: payload.resumeText.trim()
  };
}

function normalizeJobTitle(jobTitle: string, jdText: string) {
  const raw = (jobTitle || jdText.split(/\n|。/)[0] || "目标岗位").replace(/\s+/g, " ").trim();
  const cleaned = raw.replace(/岗位描述[\s\S]*/, "").replace(/【关于[\s\S]*/, "").trim();
  return cleaned.slice(0, 36) || "目标岗位";
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = item as Partial<ChatMessage>;
      const role = record.role === "assistant" ? "assistant" : record.role === "user" ? "user" : undefined;
      const content = typeof record.content === "string" ? record.content.trim().slice(0, 800) : "";
      return role && content ? { role, content } : undefined;
    })
    .filter((item): item is ChatMessage => Boolean(item))
    .slice(-8);
}

function buildChatPrompt(payload: ChatRequest, messages: ChatMessage[]) {
  return JSON.stringify({
    instruction: "基于当前 JD、简历和分析报告回答用户追问。不要泛泛聊天，不要编造。",
    jobTitle: compact(payload.jobTitle || payload.analysisResult?.summary || "目标岗位", 80),
    resumeFileName: payload.resumeFileName,
    jdText: compact(payload.jdText || "", 2200),
    resumeText: compact(payload.resumeText || "", 3800),
    analysisResult: payload.analysisResult
      ? {
          score: payload.analysisResult.score,
          level: payload.analysisResult.level,
          summary: payload.analysisResult.summary,
          dimensions: payload.analysisResult.dimensions,
          semanticMatch: payload.analysisResult.semanticMatch,
          findings: payload.analysisResult.findings.slice(0, 5),
          suggestions: payload.analysisResult.suggestions.slice(0, 5),
          reviewScripts: payload.analysisResult.reviewScripts
        }
      : undefined,
    conversation: messages
  });
}

function normalizeAnswer(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { answer?: unknown };
    if (typeof parsed.answer === "string" && parsed.answer.trim()) return parsed.answer.trim();
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { answer?: unknown };
        if (typeof parsed.answer === "string" && parsed.answer.trim()) return parsed.answer.trim();
      } catch {}
    }
  }
  return cleaned || "我已经收到问题，但当前模型返回为空，请换一种问法再试。";
}

function buildFallbackAnswer(payload: ChatRequest, question: string) {
  const result = payload.analysisResult;
  if (!result) return "当前缺少分析报告上下文。请先完成一次简历分析，再继续追问具体优化建议。";
  if (/哪里|哪三|先改|优先|改哪/.test(question)) {
    return [
      "建议优先改这几处：",
      ...result.findings.slice(0, 3).map((item, index) => `${index + 1}. ${item.type}：${item.suggestion}`)
    ].join("\n");
  }
  if (/面试|自我介绍|解释/.test(question)) return `可以这样准备面试解释：${result.reviewScripts.interviewExplanation}`;
  return `${result.summary}\n建议先围绕报告中的高风险项逐条修改，并确保所有数据都能被真实经历支撑。`;
}

function compact(value: string, maxLength: number) {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, Math.floor(maxLength * 0.7))}\n...[中间内容已压缩]...\n${compacted.slice(-Math.floor(maxLength * 0.3))}`;
}

const port = Math.max(1, Number(process.env.PORT || 3001));
const host = process.env.HOST || "127.0.0.1";

await app.listen({ port, host });
