from typing import Protocol

from pydantic import BaseModel


class LLMMessage(BaseModel):
    role: str
    content: str


class LLMRequest(BaseModel):
    task: str
    messages: list[LLMMessage]
    response_format: str = "json"


class LLMResult(BaseModel):
    text: str
    provider: str
    model: str


class EmbeddingRequest(BaseModel):
    texts: list[str]
    model: str = ""


class EmbeddingResult(BaseModel):
    vectors: list[list[float]]
    provider: str
    model: str


class LLMProvider(Protocol):
    async def generate(self, request: LLMRequest) -> LLMResult:
        """Generate model output without exposing vendor-specific payloads."""


class EmbeddingProvider(Protocol):
    async def embed(self, request: EmbeddingRequest) -> EmbeddingResult:
        """Generate embeddings without exposing vendor-specific payloads."""


class DisabledLLMProvider:
    provider = "disabled"
    model = "rules-fallback"

    async def generate(self, request: LLMRequest) -> LLMResult:
        raise RuntimeError("LLM provider is not configured")


class DisabledEmbeddingProvider:
    provider = "disabled"
    model = "rules-fallback"

    async def embed(self, request: EmbeddingRequest) -> EmbeddingResult:
        raise RuntimeError("Embedding provider is not configured")
