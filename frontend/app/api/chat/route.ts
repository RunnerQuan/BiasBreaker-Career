import { NextResponse } from "next/server";
import type { AnalysisResponse } from "../../../lib/analysis";
import { createLLMProvider } from "../../../lib/model-provider";

export const runtime = "nodejs";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatRequest = {
  jobTitle?: string;
  jdText?: string;
  resumeText?: string;
  resumeFileName?: string;
  analysisResult?: AnalysisResponse;
  messages?: ChatMessage[];
};

export async function POST(request: Request) {
  const backendBaseUrl = process.env.BACKEND_API_BASE_URL?.replace(/\/+$/, "");
  if (backendBaseUrl) {
    return NextResponse.redirect(`${backendBaseUrl}/api/chat`, 307);
  }

  let payload: ChatRequest;

  try {
    payload = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ message: "请求体不是有效 JSON。" }, { status: 400 });
  }

  const messages = normalizeMessages(payload.messages);
  const latestQuestion = messages.at(-1)?.content.trim();
  if (!latestQuestion) {
    return NextResponse.json({ message: "请输入想追问的问题。" }, { status: 400 });
  }

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
            "你必须遵守：1. 不编造经历、公司、学校、证书、数据或结果；2. 缺少证据时明确说“当前简历中未体现”；3. 建议要具体到可修改的表达、优先级或面试解释；4. 不承诺通过筛选；5. 不输出歧视性判断。",
            "回答要简洁、专业、适合大学生求职场景。优先用 2-4 个要点回答。严格输出 JSON：{\"answer\":\"...\"}。"
          ].join("\n")
        },
        {
          role: "user",
          content: buildChatPrompt(payload, messages)
        }
      ]
    });
    return NextResponse.json({ answer: normalizeAnswer(result.text) });
  } catch (error) {
    console.error("chat assistant failed, using report fallback", error);
    return NextResponse.json({ answer: buildFallbackAnswer(payload, latestQuestion) });
  }
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
  return JSON.stringify(
    {
      instruction: "基于当前 JD、简历和分析报告回答用户追问。不要泛泛聊天，不要编造。",
      jobTitle: compact(payload.jobTitle || payload.analysisResult?.summary || "目标岗位", 80),
      resumeFileName: payload.resumeFileName,
      jdText: compact(payload.jdText || "", 2200),
      resumeText: compact(payload.resumeText || "", 3800),
      analysisResult: compactAnalysis(payload.analysisResult),
      conversation: messages
    },
    null,
    0
  );
}

function compactAnalysis(result: AnalysisResponse | undefined) {
  if (!result) return undefined;
  return {
    score: result.score,
    level: result.level,
    summary: result.summary,
    dimensions: result.dimensions,
    semanticMatch: result.semanticMatch,
    findings: result.findings.slice(0, 5),
    suggestions: result.suggestions.slice(0, 5),
    reviewScripts: result.reviewScripts
  };
}

function normalizeAnswer(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as { answer?: unknown };
    const answer = unwrapAnswer(parsed.answer);
    if (answer) return answer;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as { answer?: unknown };
        const answer = unwrapAnswer(parsed.answer);
        if (answer) return answer;
      } catch {
        const manualAnswer = match[0].match(/\{\s*"answer"\s*:\s*"([\s\S]*)"\s*\}/);
        if (manualAnswer) return unwrapAnswer(manualAnswer[1]);
      }
    }
  }
  return unescapeMarkdown(cleaned) || "我已经收到问题，但当前模型返回为空，请换一种问法再试。";
}

function unwrapAnswer(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const nested = JSON.parse(trimmed) as { answer?: unknown };
      return unwrapAnswer(nested.answer);
    } catch {
      const manualAnswer = trimmed.match(/^\{\s*"answer"\s*:\s*"([\s\S]*)"\s*\}\s*$/);
      if (manualAnswer) return unwrapAnswer(manualAnswer[1]);
      return unescapeMarkdown(trimmed);
    }
  }
  return unescapeMarkdown(trimmed);
}

function unescapeMarkdown(value: string) {
  return value
    .replace(/\\([*_`[\]()#>.-])/g, "$1")
    .replace(/\\n/g, "\n")
    .trim();
}

function buildFallbackAnswer(payload: ChatRequest, question: string) {
  const result = payload.analysisResult;
  if (!result) return "当前缺少分析报告上下文。请先完成一次简历分析，再继续追问具体优化建议。";

  const lowerQuestion = question.toLowerCase();
  const topFindings = result.findings.slice(0, 3);
  const topSuggestions = result.suggestions.slice(0, 3);

  if (/哪里|哪三|先改|优先|改哪/.test(question)) {
    return [
      "建议优先改这几处：",
      ...topFindings.map((item, index) => `${index + 1}. ${item.type}：${item.suggestion}`),
      "修改时只补充真实经历中已有的对象、方法、产出和指标；缺少数据时用 [待确认] 标注。"
    ].join("\n");
  }

  if (/面试|自我介绍|解释/.test(question)) {
    return `可以这样准备面试解释：${result.reviewScripts.interviewExplanation}`;
  }

  if (/项目|经历|改写|优化|rewrite/.test(lowerQuestion)) {
    return [
      "可以参考这些改写方向：",
      ...topSuggestions.map((item, index) => {
        const rewritten = item.rewritten || item.example;
        return `${index + 1}. ${item.title}：${rewritten}`;
      })
    ].join("\n");
  }

  return [
    `当前报告评分为 ${result.score}/100，风险等级为${levelText(result.level)}。`,
    result.summary,
    "如果你想继续细化，可以问我：最该先改哪三处、某段经历怎么改写、面试时如何解释、哪些建议不能照抄。"
  ].join("\n");
}

function levelText(level: AnalysisResponse["level"]) {
  if (level === "low") return "低风险";
  if (level === "high") return "高风险";
  return "中等风险";
}

function compact(value: string, maxLength: number) {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, Math.floor(maxLength * 0.7))}\n...[中间内容已压缩]...\n${compacted.slice(-Math.floor(maxLength * 0.3))}`;
}
