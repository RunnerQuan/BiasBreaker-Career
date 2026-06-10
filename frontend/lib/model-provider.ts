export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMRequest = {
  task: string;
  messages: LLMMessage[];
  responseFormat?: "json" | "text";
};

export type LLMResult = {
  text: string;
  provider: string;
  model: string;
};

export type EmbeddingRequest = {
  texts: string[];
};

export type EmbeddingResult = {
  vectors: number[][];
  provider: string;
  model: string;
};

export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResult>;
}

export interface EmbeddingProvider {
  embed(request: EmbeddingRequest): Promise<EmbeddingResult>;
}

type OpenAICompatibleOptions = {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
};

class OpenAICompatibleLLMProvider implements LLMProvider {
  private readonly provider: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly timeoutMs: number;

  constructor(options: OpenAICompatibleOptions) {
    this.provider = options.provider;
    this.model = options.model;
    this.apiKey = options.apiKey;
    this.endpoint = normalizeChatEndpoint(options.baseUrl);
    this.timeoutMs = options.timeoutMs;
  }

  async generate(request: LLMRequest): Promise<LLMResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: request.messages,
          temperature: 0.2,
          max_tokens: request.responseFormat === "json" ? 2200 : 1600,
          response_format: request.responseFormat === "json" ? { type: "json_object" } : undefined
        }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error?.message || data?.message || `${this.provider} 模型调用失败。`;
        throw new Error(message);
      }

      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text.trim()) {
        throw new Error(`${this.provider} 模型返回内容为空。`);
      }

      return {
        text,
        provider: this.provider,
        model: this.model
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`${this.provider} 模型请求超时，已超过 ${Math.round(this.timeoutMs / 1000)} 秒。`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

class OpenAICompatibleEmbeddingProvider implements EmbeddingProvider {
  private readonly provider: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly timeoutMs: number;

  constructor(options: OpenAICompatibleOptions) {
    this.provider = options.provider;
    this.model = options.model;
    this.apiKey = options.apiKey;
    this.endpoint = normalizeEmbeddingEndpoint(options.baseUrl);
    this.timeoutMs = options.timeoutMs;
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: request.texts
        }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error?.message || data?.message || `${this.provider} Embedding 调用失败。`;
        throw new Error(message);
      }

      const vectors = Array.isArray(data?.data)
        ? data.data.map((item: { embedding?: unknown }) => item.embedding).filter(isNumberVector)
        : [];

      if (vectors.length !== request.texts.length) {
        throw new Error(`${this.provider} Embedding 返回向量数量不匹配。`);
      }

      return {
        vectors,
        provider: this.provider,
        model: this.model
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`${this.provider} Embedding 请求超时，已超过 ${Math.round(this.timeoutMs / 1000)} 秒。`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

class DisabledLLMProvider implements LLMProvider {
  async generate(): Promise<LLMResult> {
    throw new Error("LLM provider is not configured");
  }
}

class DisabledEmbeddingProvider implements EmbeddingProvider {
  async embed(): Promise<EmbeddingResult> {
    throw new Error("Embedding provider is not configured");
  }
}

export function createLLMProvider(): LLMProvider {
  const provider = process.env.DEFAULT_LLM_PROVIDER || "mimo";
  const model = process.env.DEFAULT_LLM_MODEL || "mimo-v2.5-pro";
  const upperProvider = provider.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const apiKey = process.env[`${upperProvider}_API_KEY`] || process.env.MIMO_API_KEY || "";
  const baseUrl = process.env[`${upperProvider}_BASE_URL`] || process.env.MIMO_BASE_URL || "";
  const timeoutMs = Number(process.env.MODEL_TIMEOUT_SECONDS || 45) * 1000;

  if (!apiKey || !baseUrl) {
    return new DisabledLLMProvider();
  }

  return new OpenAICompatibleLLMProvider({
    provider,
    model,
    apiKey,
    baseUrl,
    timeoutMs
  });
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.DEFAULT_EMBEDDING_PROVIDER || "hunyuan";
  const model = process.env.DEFAULT_EMBEDDING_MODEL || "hunyuan-embedding";
  const upperProvider = provider.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const apiKey = process.env[`${upperProvider}_API_KEY`] || process.env.HUNYUAN_API_KEY || "";
  const baseUrl = process.env[`${upperProvider}_BASE_URL`] || process.env.HUNYUAN_BASE_URL || "";
  const timeoutMs = Number(process.env.EMBEDDING_TIMEOUT_SECONDS || process.env.MODEL_TIMEOUT_SECONDS || 45) * 1000;

  if (!apiKey || !baseUrl) {
    return new DisabledEmbeddingProvider();
  }

  return new OpenAICompatibleEmbeddingProvider({
    provider,
    model,
    apiKey,
    baseUrl,
    timeoutMs
  });
}

function normalizeChatEndpoint(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

function normalizeEmbeddingEndpoint(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/embeddings")) return trimmed;
  if (trimmed.endsWith("/v1")) return `${trimmed}/embeddings`;
  return `${trimmed}/v1/embeddings`;
}

function isNumberVector(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "number");
}
