import { NextResponse } from "next/server";
import { analyzeResumeInput, type AnalysisRequest } from "../../../lib/analysis";
import { analyzeResumeWithLLM } from "../../../lib/llm-analysis";
import { createEmbeddingProvider, createLLMProvider } from "../../../lib/model-provider";
import { createSemanticSignals } from "../../../lib/semantic-analysis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: AnalysisRequest;

  try {
    payload = (await request.json()) as AnalysisRequest;
  } catch {
    return NextResponse.json({ message: "请求体不是有效 JSON。" }, { status: 400 });
  }

  if (!payload.jdText?.trim()) {
    return NextResponse.json({ message: "请先填写岗位 JD。" }, { status: 400 });
  }

  if (!payload.resumeText?.trim()) {
    return NextResponse.json({ message: "请粘贴简历文本，或上传可解析文本文件。" }, { status: 400 });
  }

  const normalizedPayload = normalizePayload(payload);
  const semanticSignals = await tryCreateSemanticSignals(normalizedPayload);

  try {
    const provider = createLLMProvider();
    const result = await analyzeResumeWithLLM(normalizedPayload, provider, semanticSignals);
    return NextResponse.json(result);
  } catch (error) {
    console.error("llm analysis failed, falling back to rules", error);
    const fallback = analyzeResumeInput(normalizedPayload);
    return NextResponse.json({
      ...fallback,
      semanticMatch: semanticSignals
    });
  }
}

async function tryCreateSemanticSignals(payload: AnalysisRequest) {
  try {
    return await createSemanticSignals(payload, createEmbeddingProvider());
  } catch (error) {
    console.error("embedding analysis failed, continuing without semantic signals", error);
    return undefined;
  }
}

function normalizePayload(payload: AnalysisRequest): AnalysisRequest {
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
