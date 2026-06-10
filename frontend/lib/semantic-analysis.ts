import type { AnalysisRequest } from "./analysis";
import type { EmbeddingProvider } from "./model-provider";

export type SemanticSignals = {
  score: number;
  summary: string;
  topEvidence: string[];
  weakEvidence: string[];
};

export async function createSemanticSignals(input: AnalysisRequest, provider: EmbeddingProvider): Promise<SemanticSignals> {
  const jdFocus = compactText(input.jdText, 1600);
  const resumeChunks = chunkResume(input.resumeText).slice(0, 8);
  const { vectors } = await provider.embed({
    texts: [jdFocus, ...resumeChunks]
  });

  const jdVector = vectors[0];
  const scoredChunks = resumeChunks
    .map((chunk, index) => ({
      text: chunk,
      score: cosineSimilarity(jdVector, vectors[index + 1])
    }))
    .sort((a, b) => b.score - a.score);

  const topScore = scoredChunks[0]?.score ?? 0;
  const avgTopScore =
    scoredChunks.slice(0, Math.min(3, scoredChunks.length)).reduce((sum, item) => sum + item.score, 0) /
    Math.max(1, Math.min(3, scoredChunks.length));
  const score = clamp(Math.round((topScore * 0.62 + avgTopScore * 0.38) * 100));

  return {
    score,
    summary: `Embedding 语义匹配度 ${score}/100；用于识别“表达不同但能力相关”的经历，避免只按字面关键词误判。`,
    topEvidence: scoredChunks.slice(0, 3).map((item) => item.text),
    weakEvidence: scoredChunks.slice(-2).map((item) => item.text)
  };
}

function chunkResume(text: string) {
  const normalized = text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const sections = normalized
    .split(/\n{2,}|(?=教育经历|实习经历|项目经历|校园经历|工作经历|技能|获奖|证书)/)
    .map((item) => compactText(item, 900))
    .filter((item) => item.length > 30);

  if (sections.length) return sections;

  const chunks: string[] = [];
  for (let index = 0; index < normalized.length; index += 700) {
    const chunk = normalized.slice(index, index + 900).trim();
    if (chunk.length > 30) chunks.push(chunk);
  }
  return chunks.length ? chunks : [compactText(normalized, 900)];
}

function compactText(value: string, maxLength: number) {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, Math.floor(maxLength * 0.72))} ... ${compacted.slice(-Math.floor(maxLength * 0.28))}`;
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}
