# BiasBreaker Career Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a working BiasBreaker Career Web Demo that analyzes JD and resume readability risks, produces evidence-constrained rewrites, verifies fidelity, supports recheck/history/export, and keeps model providers replaceable.

**Architecture:** Use a modular monolith deployed as one EdgeOne Pages project. The Next.js frontend calls a same-origin FastAPI Python Cloud Function. Domain code owns deterministic scoring and evidence rules; configurable provider adapters own Mimo and Hunyuan API differences.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, Dexie.js, Vitest, Playwright, FastAPI, Pydantic, httpx, PyMuPDF, python-docx, pytest, EdgeOne Pages.

---

## 1. Delivery Strategy

Implement in vertical slices. Do not begin visual polish, file upload, history, or export before the text-input analysis path works end to end.

Required execution order:

1. Project skeleton and health check.
2. Provider-neutral contracts and configuration.
3. Mimo and Hunyuan adapters.
4. Evidence, redaction, JD analysis, and deterministic risk engine.
5. Text-input analysis API.
6. Evidence-constrained rewrite, fidelity check, and recheck.
7. Frontend analysis, report, and rewrite flows.
8. File parsing, history, export, graceful degradation, and deployment.

## 2. Target File Map

```text
biasbreaker-career/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── analyze/page.tsx
│   ├── report/[id]/page.tsx
│   ├── rewrite/[id]/page.tsx
│   └── history/page.tsx
├── components/
│   ├── app-header.tsx
│   ├── evidence-quote.tsx
│   ├── score-card.tsx
│   ├── source-badge.tsx
│   └── status-alert.tsx
├── features/
│   ├── analyze/
│   ├── report/
│   ├── rewrite/
│   └── history/
├── lib/
│   ├── api-client.ts
│   ├── db.ts
│   ├── schemas.ts
│   └── store.ts
├── cloud-functions/
│   ├── api/index.py
│   ├── app/
│   │   ├── config.py
│   │   ├── errors.py
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── domain/
│   │   ├── providers/
│   │   ├── parsers/
│   │   └── data/
│   └── requirements.txt
├── tests/
│   ├── backend/
│   ├── frontend/
│   ├── e2e/
│   └── fixtures/
├── .env.example
├── edgeone.json
├── package.json
└── README.md
```

Each backend module must have one responsibility:

- `schemas/`: transport and domain data contracts.
- `domain/`: deterministic, side-effect-free business rules.
- `providers/`: vendor-specific API translation only.
- `services/`: use-case orchestration.
- `routers/`: HTTP validation and response mapping.
- `parsers/`: source document to normalized text/evidence.

## 3. Definition Of Done

The implementation is complete only when:

- Text JD and resume complete the full real-API analysis path.
- The same input and rule version produce the same readability score.
- Every high-severity risk references evidence.
- Switching the configured LLM adapter does not change domain service code or API schemas.
- Unsupported rewrite claims cannot be copied.
- Recheck displays before/after dimension changes.
- IndexedDB history survives refresh and can be deleted.
- PDF/DOCX parse failures preserve user input and offer text fallback.
- EdgeOne online and local environments both pass the smoke test.

---

### Task 1: Scaffold The Full-Stack Project And Health Check

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `cloud-functions/api/index.py`
- Create: `cloud-functions/requirements.txt`
- Create: `tests/backend/conftest.py`
- Create: `tests/backend/test_health.py`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Git and scaffold Next.js**

Run:

```powershell
git init
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
npm install @tanstack/react-query zustand dexie zod echarts
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom playwright
python -m pip install fastapi pydantic pydantic-settings httpx PyMuPDF python-docx python-multipart pytest
```

Expected: Next.js application files exist and `npm run dev` can start.

- [ ] **Step 2: Write the failing backend health test**

Create `tests/backend/conftest.py` so Python can import code under EdgeOne's required hyphenated `cloud-functions` directory:

```python
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "cloud-functions"))
```

Create `tests/backend/test_health.py`:

```python
from fastapi.testclient import TestClient

from api.index import app


def test_health_returns_ok():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 3: Run the health test and verify it fails**

Run:

```powershell
python -m pytest tests/backend/test_health.py -v
```

Expected: FAIL because `api.index` does not exist.

- [ ] **Step 4: Add the minimal FastAPI entry**

Create `cloud-functions/api/index.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="BiasBreaker Career API")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

Create `cloud-functions/requirements.txt`:

```text
fastapi>=0.115,<1
pydantic>=2.10,<3
pydantic-settings>=2.7,<3
httpx>=0.28,<1
PyMuPDF>=1.25,<2
python-docx>=1.1,<2
python-multipart>=0.0.20,<1
pytest>=8.3,<9
```

- [ ] **Step 5: Add environment and ignore templates**

Create `.env.example`:

```env
DEFAULT_LLM_PROVIDER=mimo
DEFAULT_LLM_MODEL=mimo-v2.5-pro
DEFAULT_EMBEDDING_PROVIDER=hunyuan
DEFAULT_EMBEDDING_MODEL=
MIMO_API_KEY=
MIMO_BASE_URL=
HUNYUAN_API_KEY=
HUNYUAN_BASE_URL=
MODEL_TIMEOUT_SECONDS=45
```

Ensure `.gitignore` contains:

```text
.env
.env.local
.edgeone/.token
node_modules/
.next/
__pycache__/
.pytest_cache/
playwright-report/
test-results/
```

- [ ] **Step 6: Verify frontend and backend skeletons**

Run:

```powershell
python -m pytest tests/backend/test_health.py -v
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "chore: scaffold BiasBreaker full-stack app"
```

---

### Task 2: Define Provider-Neutral Contracts, Configuration, And Errors

**Files:**
- Create: `cloud-functions/app/config.py`
- Create: `cloud-functions/app/errors.py`
- Create: `cloud-functions/app/schemas/providers.py`
- Create: `cloud-functions/app/providers/base.py`
- Create: `cloud-functions/app/providers/registry.py`
- Create: `tests/backend/providers/test_registry.py`

- [ ] **Step 1: Write the failing Provider Registry test**

Create `tests/backend/providers/test_registry.py`:

```python
import pytest

from app.errors import ProviderNotConfiguredError
from app.providers.registry import ProviderRegistry


def test_registry_creates_registered_provider():
    registry = ProviderRegistry()
    registry.register_llm("fake", lambda: object())
    assert registry.create_llm("fake") is not None


def test_registry_rejects_unknown_provider():
    registry = ProviderRegistry()
    with pytest.raises(ProviderNotConfiguredError):
        registry.create_llm("missing")
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
python -m pytest tests/backend/providers/test_registry.py -v
```

Expected: FAIL because the registry and error types do not exist.

- [ ] **Step 3: Implement common request and result contracts**

Create `cloud-functions/app/schemas/providers.py`:

```python
from typing import Any

from pydantic import BaseModel, Field


class StructuredGenerationRequest(BaseModel):
    task: str
    system_prompt: str
    user_payload: dict[str, Any]
    temperature: float = 0.2
    max_output_tokens: int | None = None
    metadata: dict[str, str] = Field(default_factory=dict)


class EmbeddingRequest(BaseModel):
    texts: list[str]
    purpose: str
    metadata: dict[str, str] = Field(default_factory=dict)


class EmbeddingResult(BaseModel):
    vectors: list[list[float]]
    provider: str
    model: str
```

Create `cloud-functions/app/providers/base.py`:

```python
from typing import Protocol, TypeVar

from pydantic import BaseModel

from app.schemas.providers import (
    EmbeddingRequest,
    EmbeddingResult,
    StructuredGenerationRequest,
)

T = TypeVar("T", bound=BaseModel)


class LLMProvider(Protocol):
    async def generate_structured(
        self, request: StructuredGenerationRequest, response_model: type[T]
    ) -> T: ...


class EmbeddingProvider(Protocol):
    async def embed(self, request: EmbeddingRequest) -> EmbeddingResult: ...
```

- [ ] **Step 4: Implement unified errors and registry**

Create `cloud-functions/app/errors.py`:

```python
class BiasBreakerError(Exception):
    code = "INTERNAL_ERROR"
    retryable = False


class ProviderNotConfiguredError(BiasBreakerError):
    code = "PROVIDER_NOT_CONFIGURED"


class ProviderTimeoutError(BiasBreakerError):
    code = "PROVIDER_TIMEOUT"
    retryable = True


class ProviderResponseError(BiasBreakerError):
    code = "PROVIDER_RESPONSE_INVALID"
    retryable = True
```

Create `cloud-functions/app/providers/registry.py`:

```python
from collections.abc import Callable
from typing import Any

from app.errors import ProviderNotConfiguredError


class ProviderRegistry:
    def __init__(self) -> None:
        self._llm: dict[str, Callable[[], Any]] = {}
        self._embedding: dict[str, Callable[[], Any]] = {}

    def register_llm(self, name: str, factory: Callable[[], Any]) -> None:
        self._llm[name] = factory

    def register_embedding(self, name: str, factory: Callable[[], Any]) -> None:
        self._embedding[name] = factory

    def create_llm(self, name: str) -> Any:
        if name not in self._llm:
            raise ProviderNotConfiguredError(name)
        return self._llm[name]()

    def create_embedding(self, name: str) -> Any:
        if name not in self._embedding:
            raise ProviderNotConfiguredError(name)
        return self._embedding[name]()
```

- [ ] **Step 5: Add typed settings**

Create `cloud-functions/app/config.py`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    default_llm_provider: str = "mimo"
    default_llm_model: str = "mimo-v2.5-pro"
    default_embedding_provider: str = "hunyuan"
    default_embedding_model: str
    mimo_api_key: str = ""
    mimo_base_url: str = ""
    hunyuan_api_key: str = ""
    hunyuan_base_url: str = ""
    model_timeout_seconds: float = 45

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
```

- [ ] **Step 6: Run tests**

Run:

```powershell
python -m pytest tests/backend/providers/test_registry.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add cloud-functions/app tests/backend/providers
git commit -m "feat: add model-neutral provider contracts"
```

---

### Task 3: Implement Mimo And Hunyuan Provider Adapters

**Files:**
- Create: `cloud-functions/app/providers/mimo.py`
- Create: `cloud-functions/app/providers/hunyuan.py`
- Create: `cloud-functions/app/providers/factory.py`
- Create: `tests/backend/providers/test_mimo.py`
- Create: `tests/backend/providers/test_hunyuan.py`
- Create: `tests/backend/providers/test_provider_swap.py`

- [ ] **Step 1: Write failing contract tests**

Create `tests/backend/providers/test_provider_swap.py`:

```python
from typing import TypeVar

from pydantic import BaseModel

from app.schemas.providers import StructuredGenerationRequest

T = TypeVar("T", bound=BaseModel)


class Output(BaseModel):
    value: str


class FakeProviderA:
    async def generate_structured(
        self, request: StructuredGenerationRequest, response_model: type[T]
    ) -> T:
        return response_model(value="same")


class FakeProviderB:
    async def generate_structured(
        self, request: StructuredGenerationRequest, response_model: type[T]
    ) -> T:
        return response_model(value="same")


async def test_provider_outputs_share_domain_shape():
    request = StructuredGenerationRequest(
        task="test", system_prompt="system", user_payload={"x": 1}
    )
    first = await FakeProviderA().generate_structured(request, Output)
    second = await FakeProviderB().generate_structured(request, Output)
    assert first == second == Output(value="same")
```

Add adapter-specific tests using `httpx.MockTransport` to assert:

- Mimo adapter translates the generic request to its API payload.
- Hunyuan adapter returns `EmbeddingResult`.
- Timeout errors become `ProviderTimeoutError`.
- Invalid JSON becomes `ProviderResponseError`.

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
python -m pytest tests/backend/providers -v
```

Expected: FAIL because adapters do not exist.

- [ ] **Step 3: Implement Mimo adapter**

Create `cloud-functions/app/providers/mimo.py`:

```python
import json
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.errors import ProviderResponseError, ProviderTimeoutError
from app.schemas.providers import StructuredGenerationRequest

T = TypeVar("T", bound=BaseModel)


class MimoLLMProvider:
    def __init__(self, api_key: str, base_url: str, model: str, timeout: float):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    async def generate_structured(
        self, request: StructuredGenerationRequest, response_model: type[T]
    ) -> T:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": json.dumps(request.user_payload, ensure_ascii=False)},
            ],
            "temperature": request.temperature,
            "response_format": {"type": "json_object"},
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload,
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ProviderTimeoutError() from exc
        except httpx.HTTPError as exc:
            raise ProviderResponseError() from exc

        try:
            content = response.json()["choices"][0]["message"]["content"]
            return response_model.model_validate_json(content)
        except (KeyError, ValidationError, ValueError) as exc:
            raise ProviderResponseError() from exc
```

- [ ] **Step 4: Implement Hunyuan adapter and Provider Factory**

Implement `cloud-functions/app/providers/hunyuan.py` with the same error mapping. It must accept only `EmbeddingRequest` and return only `EmbeddingResult`.

Implement `cloud-functions/app/providers/factory.py`:

```python
from app.config import Settings
from app.providers.hunyuan import HunyuanEmbeddingProvider
from app.providers.mimo import MimoLLMProvider
from app.providers.registry import ProviderRegistry


def build_registry(settings: Settings) -> ProviderRegistry:
    registry = ProviderRegistry()
    registry.register_llm(
        "mimo",
        lambda: MimoLLMProvider(
            settings.mimo_api_key,
            settings.mimo_base_url,
            settings.default_llm_model,
            settings.model_timeout_seconds,
        ),
    )
    registry.register_embedding(
        "hunyuan",
        lambda: HunyuanEmbeddingProvider(
            settings.hunyuan_api_key,
            settings.hunyuan_base_url,
            settings.default_embedding_model,
            settings.model_timeout_seconds,
        ),
    )
    return registry
```

- [ ] **Step 5: Verify provider contracts**

Run:

```powershell
python -m pytest tests/backend/providers -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add cloud-functions/app/providers tests/backend/providers
git commit -m "feat: add Mimo and Hunyuan provider adapters"
```

---

### Task 4: Build Evidence Extraction And Sensitive-Data Redaction

**Files:**
- Create: `cloud-functions/app/schemas/evidence.py`
- Create: `cloud-functions/app/domain/evidence.py`
- Create: `cloud-functions/app/domain/redaction.py`
- Create: `tests/backend/domain/test_evidence.py`
- Create: `tests/backend/domain/test_redaction.py`

- [ ] **Step 1: Write failing evidence and redaction tests**

Create `tests/backend/domain/test_redaction.py`:

```python
from app.domain.redaction import redact_sensitive_text


def test_redacts_contact_data_without_removing_experience():
    text = "张三 13800138000 test@example.com 负责小红书内容整理"
    result = redact_sensitive_text(text)
    assert "13800138000" not in result.text
    assert "test@example.com" not in result.text
    assert "负责小红书内容整理" in result.text
    assert len(result.items) == 3
```

Create `tests/backend/domain/test_evidence.py`:

```python
from app.domain.evidence import extract_evidence


def test_extracts_stable_offsets():
    text = "校园项目\n负责小红书内容整理。\n协助收集同学反馈。"
    evidence = extract_evidence(text, source="resume")
    assert evidence[0].id == "resume-1"
    assert text[evidence[0].start_offset:evidence[0].end_offset] == evidence[0].text
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
python -m pytest tests/backend/domain/test_evidence.py tests/backend/domain/test_redaction.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement schemas and deterministic functions**

Create `cloud-functions/app/schemas/evidence.py`:

```python
from pydantic import BaseModel, Field


class Evidence(BaseModel):
    id: str
    source: str
    text: str
    section: str | None = None
    start_offset: int
    end_offset: int


class RedactionItem(BaseModel):
    type: str
    replacement: str


class RedactionResult(BaseModel):
    text: str
    items: list[RedactionItem] = Field(default_factory=list)
```

Implement:

- `extract_evidence(text, source)` by splitting non-empty lines and preserving offsets.
- `redact_sensitive_text(text)` for names at the beginning, Chinese phone numbers, email, ID card patterns, and explicit address labels.

- [ ] **Step 4: Run tests**

Run:

```powershell
python -m pytest tests/backend/domain/test_evidence.py tests/backend/domain/test_redaction.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add cloud-functions/app/domain cloud-functions/app/schemas/evidence.py tests/backend/domain
git commit -m "feat: add evidence extraction and redaction"
```

---

### Task 5: Implement JD Analysis With User-Confirmable Evidence

**Files:**
- Create: `cloud-functions/app/schemas/job.py`
- Create: `cloud-functions/app/data/risk_phrases.json`
- Create: `cloud-functions/app/domain/inclusivity.py`
- Create: `cloud-functions/app/services/job_analyzer.py`
- Create: `cloud-functions/app/routers/jobs.py`
- Modify: `cloud-functions/api/index.py`
- Create: `tests/backend/services/test_job_analyzer.py`
- Create: `tests/backend/api/test_jobs.py`

- [ ] **Step 1: Write failing job analysis test**

Create `tests/backend/services/test_job_analyzer.py`:

```python
async def test_job_analysis_combines_llm_requirements_and_rule_risks(fake_llm):
    service = JobAnalyzer(fake_llm)
    result = await service.analyze(
        "用户增长实习生",
        "负责用户增长与数据复盘，要求抗压能力强。",
    )
    assert "用户增长" in [item.keyword for item in result.keywords]
    assert result.inclusivity_risks[0].phrase == "抗压能力强"
    assert result.inclusivity_risks[0].evidence_ids
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```powershell
python -m pytest tests/backend/services/test_job_analyzer.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement JD schemas and rule detector**

Define:

```python
class JobKeyword(BaseModel):
    keyword: str
    weight: float
    category: Literal["core", "preferred", "soft"]
    evidence_ids: list[str]


class InclusivityRisk(BaseModel):
    phrase: str
    explanation: str
    clarification_question: str
    confidence: float
    evidence_ids: list[str]


class JobAnalysis(BaseModel):
    job_title: str
    requirements: list[str]
    keywords: list[JobKeyword]
    inclusivity_risks: list[InclusivityRisk]
    evidence: list[Evidence]
```

Populate `risk_phrases.json` with initial controlled phrases such as `抗压能力强`, `快节奏`, `形象气质佳`, and neutral clarification guidance.

- [ ] **Step 4: Implement service and API**

`JobAnalyzer` must:

1. Extract JD evidence.
2. Run deterministic inclusivity phrase detection.
3. Ask `LLMProvider` for structured requirements and keywords.
4. Validate that returned evidence IDs exist.
5. Return user-editable `JobAnalysis`.

Expose:

```python
@router.post("/jobs/analyze", response_model=JobAnalysis)
async def analyze_job(request: AnalyzeJobRequest) -> JobAnalysis:
    return await service.analyze(request.job_title, request.job_description)
```

- [ ] **Step 5: Run service and API tests**

Run:

```powershell
python -m pytest tests/backend/services/test_job_analyzer.py tests/backend/api/test_jobs.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add cloud-functions tests/backend/services/test_job_analyzer.py tests/backend/api/test_jobs.py
git commit -m "feat: add evidence-backed JD analysis"
```

---

### Task 6: Implement Deterministic Resume Evidence And Risk Scoring

**Files:**
- Create: `cloud-functions/app/schemas/resume.py`
- Create: `cloud-functions/app/schemas/analysis.py`
- Create: `cloud-functions/app/domain/keyword_score.py`
- Create: `cloud-functions/app/domain/evidence_score.py`
- Create: `cloud-functions/app/domain/structure_score.py`
- Create: `cloud-functions/app/domain/semantic_score.py`
- Create: `cloud-functions/app/domain/readability.py`
- Create: `tests/backend/domain/test_readability.py`

- [ ] **Step 1: Write the failing scoring test**

Create `tests/backend/domain/test_readability.py`:

```python
def test_readability_score_is_weighted_and_reproducible():
    dimensions = ReadabilityDimensions(
        keyword_coverage=60,
        semantic_evidence=80,
        evidence_completeness=50,
        structure_readability=100,
    )
    first = calculate_readability(dimensions)
    second = calculate_readability(dimensions)
    assert first == 68
    assert first == second
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
python -m pytest tests/backend/domain/test_readability.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement scoring schemas**

Define:

```python
class ReadabilityDimensions(BaseModel):
    keyword_coverage: int
    semantic_evidence: int
    evidence_completeness: int
    structure_readability: int


class RiskItem(BaseModel):
    type: str
    severity: Literal["high", "medium", "low"]
    title: str
    explanation: str
    source: Literal["rule", "embedding", "llm"]
    confidence: float
    jd_evidence_ids: list[str]
    resume_evidence_ids: list[str]
    suggested_action: str
```

- [ ] **Step 4: Implement pure scoring functions**

Implement:

```python
def calculate_readability(dimensions: ReadabilityDimensions) -> int:
    return round(
        dimensions.keyword_coverage * 0.30
        + dimensions.semantic_evidence * 0.25
        + dimensions.evidence_completeness * 0.30
        + dimensions.structure_readability * 0.15
    )
```

Also implement:

- Weighted exact and synonym keyword coverage.
- Evidence completeness based on action, object/context, method/tool, output/result.
- Structure score from reliable text-level checks.
- Cosine similarity and threshold mapping for Embedding vectors.

- [ ] **Step 5: Add risk generation tests**

Tests must assert:

- Missing core keywords generate evidence-backed risk.
- Semantic match can recover a missing exact keyword.
- Strong evidence does not generate an evidence weakness risk.
- Inclusivity risk does not change readability score.

- [ ] **Step 6: Run domain tests**

Run:

```powershell
python -m pytest tests/backend/domain -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add cloud-functions/app/domain cloud-functions/app/schemas tests/backend/domain
git commit -m "feat: add deterministic readability risk engine"
```

---

### Task 7: Build The Text-Input Analysis Orchestration API

**Files:**
- Create: `cloud-functions/app/services/analysis_service.py`
- Create: `cloud-functions/app/routers/analyses.py`
- Modify: `cloud-functions/api/index.py`
- Create: `tests/backend/services/test_analysis_service.py`
- Create: `tests/backend/api/test_analyses.py`

- [ ] **Step 1: Write a failing full-analysis service test**

Create `tests/backend/services/test_analysis_service.py`:

```python
async def test_analysis_returns_score_risks_and_evidence(
    confirmed_job_analysis, fake_embedding
):
    service = AnalysisService(embedding_provider=fake_embedding)
    result = await service.run(
        analysis_id="analysis-1",
        job=confirmed_job_analysis,
        resume_text="校园项目\n负责小红书内容整理，协助收集同学反馈。",
    )
    assert result.analysis_id == "analysis-1"
    assert 0 <= result.readability_score <= 100
    assert result.evidence
    assert all(r.resume_evidence_ids or r.jd_evidence_ids for r in result.risks)
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
python -m pytest tests/backend/services/test_analysis_service.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement orchestration**

`AnalysisService.run` must:

1. Extract resume evidence.
2. Redact sensitive content before Embedding calls.
3. Build JD requirement and resume evidence embedding requests.
4. Calculate deterministic dimensions.
5. Generate evidence-backed risks.
6. Return provider/model/rule metadata.

The service must not call an LLM to calculate the score.

- [ ] **Step 4: Expose `/api/analyses/run`**

Define the request:

```python
class RunAnalysisRequest(BaseModel):
    analysis_id: str
    job_analysis: JobAnalysis
    resume_text: str = Field(min_length=20)
```

Add the router to `cloud-functions/api/index.py`.

- [ ] **Step 5: Add unified error mapping**

Add a FastAPI exception handler that maps `BiasBreakerError` to:

```json
{
  "error": {
    "code": "PROVIDER_TIMEOUT",
    "message": "AI 服务响应超时，请稍后重试。",
    "retryable": true,
    "request_id": "req_xxx"
  }
}
```

- [ ] **Step 6: Run integration tests**

Run:

```powershell
python -m pytest tests/backend/services/test_analysis_service.py tests/backend/api/test_analyses.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add cloud-functions tests/backend/services/test_analysis_service.py tests/backend/api/test_analyses.py
git commit -m "feat: add text-input readability analysis API"
```

---

### Task 8: Implement Evidence-Constrained Rewrite And Fidelity Checking

**Files:**
- Create: `cloud-functions/app/schemas/rewrite.py`
- Create: `cloud-functions/app/domain/fidelity.py`
- Create: `cloud-functions/app/services/rewrite_service.py`
- Create: `cloud-functions/app/routers/rewrites.py`
- Modify: `cloud-functions/api/index.py`
- Create: `tests/backend/domain/test_fidelity.py`
- Create: `tests/backend/services/test_rewrite_service.py`
- Create: `tests/backend/api/test_rewrites.py`

- [ ] **Step 1: Write failing fidelity tests**

Create `tests/backend/domain/test_fidelity.py`:

```python
def test_pending_placeholder_requires_confirmation():
    result = check_fidelity(
        original_text="协助收集同学反馈",
        rewritten_text="收集并整理 [feedback_count] 名用户反馈",
        placeholders={"feedback_count": None},
    )
    assert result.status == "needs_confirmation"


def test_unsupported_claim_is_risky():
    result = check_fidelity(
        original_text="协助收集同学反馈",
        rewritten_text="推动阅读量增长 50%",
        placeholders={},
    )
    assert result.status == "risky"
    assert result.unsupported_claims
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
python -m pytest tests/backend/domain/test_fidelity.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement rewrite schemas and fidelity rules**

Define:

```python
class RewritePlaceholder(BaseModel):
    key: str
    label: str
    required: bool = False
    confirmed_value: str | None = None


class FidelityResult(BaseModel):
    status: Literal["passed", "needs_confirmation", "risky"]
    unsupported_claims: list[str]
    pending_placeholders: list[str]


class RewriteSuggestion(BaseModel):
    rewrite_id: str
    original_evidence_ids: list[str]
    conservative_version: str
    ats_friendly_version: str
    hr_readable_version: str
    reason: str
    placeholders: list[RewritePlaceholder]
    fidelity: FidelityResult
```

Fidelity checking must combine:

- Deterministic placeholder checks.
- Numeric claim checks.
- LLM-supported claim comparison through `LLMProvider`.
- A final domain rule that `risky` overrides all other statuses.

- [ ] **Step 4: Implement rewrite service**

`RewriteService.generate` must:

1. Send only redacted evidence, confirmed JD requirements, and risks.
2. Require evidence IDs for each suggestion.
3. Validate evidence IDs exist.
4. Run fidelity checking before returning.
5. Generate appeal, supplementary explanation, and interview language.

- [ ] **Step 5: Expose rewrite and fidelity endpoints**

Implement:

```text
POST /api/rewrites/generate
POST /api/rewrites/check-fidelity
```

- [ ] **Step 6: Run rewrite tests**

Run:

```powershell
python -m pytest tests/backend/domain/test_fidelity.py tests/backend/services/test_rewrite_service.py tests/backend/api/test_rewrites.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add cloud-functions tests/backend/domain/test_fidelity.py tests/backend/services/test_rewrite_service.py tests/backend/api/test_rewrites.py
git commit -m "feat: add evidence-constrained rewrites and fidelity checks"
```

---

### Task 9: Implement Recheck And Before/After Comparison

**Files:**
- Modify: `cloud-functions/app/services/analysis_service.py`
- Modify: `cloud-functions/app/routers/analyses.py`
- Create: `tests/backend/api/test_recheck.py`

- [ ] **Step 1: Write failing recheck test**

Create `tests/backend/api/test_recheck.py`:

```python
def test_recheck_returns_dimension_deltas(client, analysis_fixture):
    response = client.post(
        "/analyses/recheck",
        json={
            "previous_analysis": analysis_fixture,
            "revised_resume_text": "参与小红书内容运营，整理用户反馈并输出选题建议。",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert "previous" in body
    assert "current" in body
    assert "deltas" in body
```

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
python -m pytest tests/backend/api/test_recheck.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement recheck**

Reuse `AnalysisService.run`; do not create a second scoring implementation.

Return:

```python
class AnalysisComparison(BaseModel):
    previous: AnalysisResult
    current: AnalysisResult
    deltas: ReadabilityDimensions
```

- [ ] **Step 4: Run test**

Run:

```powershell
python -m pytest tests/backend/api/test_recheck.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add cloud-functions/app tests/backend/api/test_recheck.py
git commit -m "feat: add revised resume recheck comparison"
```

---

### Task 10: Add PDF And DOCX Parsing With Text Fallback

**Files:**
- Create: `cloud-functions/app/parsers/base.py`
- Create: `cloud-functions/app/parsers/pdf.py`
- Create: `cloud-functions/app/parsers/docx.py`
- Create: `cloud-functions/app/services/resume_parser.py`
- Create: `cloud-functions/app/routers/resumes.py`
- Modify: `cloud-functions/api/index.py`
- Create: `tests/backend/parsers/test_pdf.py`
- Create: `tests/backend/parsers/test_docx.py`
- Create: `tests/backend/api/test_resume_upload.py`

- [ ] **Step 1: Write failing parser tests**

Tests must assert:

- Normal PDF returns extracted text.
- Image-only PDF returns an `image_only_pdf` structure issue.
- DOCX returns paragraphs and table text in document order.
- Unsupported or broken files return a recoverable parse error.

- [ ] **Step 2: Run and verify failure**

Run:

```powershell
python -m pytest tests/backend/parsers tests/backend/api/test_resume_upload.py -v
```

Expected: FAIL.

- [ ] **Step 3: Implement normalized parse result**

Define:

```python
class ResumeParseResult(BaseModel):
    text: str
    evidence: list[Evidence]
    structure_issues: list[str]
    source_type: Literal["text", "pdf", "docx"]
```

Use PyMuPDF for PDF text extraction and `python-docx` for DOCX. Do not attempt full visual layout reconstruction.

- [ ] **Step 4: Expose parse endpoints**

```text
POST /api/resumes/parse-text
POST /api/resumes/parse-file
```

Return a recoverable error that explicitly recommends text paste when parsing fails.

- [ ] **Step 5: Run parser tests**

Run:

```powershell
python -m pytest tests/backend/parsers tests/backend/api/test_resume_upload.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add cloud-functions/app/parsers cloud-functions/app/services/resume_parser.py cloud-functions/app/routers/resumes.py tests/backend/parsers tests/backend/api/test_resume_upload.py
git commit -m "feat: add PDF and DOCX resume parsing"
```

---

### Task 11: Establish Frontend Contracts, API Client, And Workflow Store

**Files:**
- Create: `lib/schemas.ts`
- Create: `lib/api-client.ts`
- Create: `lib/store.ts`
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`
- Create: `tests/frontend/store.test.ts`
- Create: `tests/frontend/api-client.test.ts`

- [ ] **Step 1: Generate or manually mirror API contracts**

Create Zod schemas matching backend response names exactly:

```typescript
export const readabilityDimensionsSchema = z.object({
  keyword_coverage: z.number(),
  semantic_evidence: z.number(),
  evidence_completeness: z.number(),
  structure_readability: z.number(),
});

export const fidelityStatusSchema = z.enum([
  "passed",
  "needs_confirmation",
  "risky",
]);
```

- [ ] **Step 2: Write failing store test**

Create `tests/frontend/store.test.ts`:

```typescript
it("keeps user input after an API failure", () => {
  const store = useWorkflowStore.getState();
  store.setJobInput({ jobTitle: "用户增长实习生", jobDescription: "JD" });
  store.setError({ code: "LLM_TIMEOUT", message: "timeout", retryable: true });
  expect(useWorkflowStore.getState().jobInput.jobTitle).toBe("用户增长实习生");
});
```

- [ ] **Step 3: Implement typed API client and store**

The API client must:

- Use same-origin `/api`.
- Parse success responses with Zod.
- Parse unified error responses.
- Throw a typed `ApiError`.

The Zustand store must hold only the active workflow. Persisted history belongs to Dexie, not Zustand.

- [ ] **Step 4: Run frontend tests**

Run:

```powershell
npx vitest run tests/frontend/store.test.ts tests/frontend/api-client.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib app/providers.tsx app/layout.tsx tests/frontend
git commit -m "feat: add typed frontend workflow foundation"
```

---

### Task 12: Build The Analyze Wizard And Real API Flow

**Files:**
- Modify: `app/page.tsx`
- Create: `app/analyze/page.tsx`
- Create: `features/analyze/home-hero.tsx`
- Create: `features/analyze/analyze-wizard.tsx`
- Create: `features/analyze/job-step.tsx`
- Create: `features/analyze/job-confirmation-step.tsx`
- Create: `features/analyze/resume-step.tsx`
- Create: `features/analyze/privacy-preview.tsx`
- Create: `tests/frontend/analyze-wizard.test.tsx`

- [ ] **Step 1: Write failing wizard test**

```typescript
it("requires JD confirmation before resume analysis", async () => {
  render(<AnalyzeWizard />);
  await userEvent.type(screen.getByLabelText("岗位名称"), "用户增长实习生");
  await userEvent.type(screen.getByLabelText("岗位描述"), "负责用户增长");
  await userEvent.click(screen.getByRole("button", { name: "解析岗位" }));
  expect(await screen.findByText("确认岗位要求")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "开始完整分析" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Implement the wizard**

Required behavior:

- Replace the scaffold homepage with product positioning, privacy summary, workflow overview, “开始分析”, and “填充示例内容” actions.
- Fill example content without generating a preset report.
- Confirm or edit JD requirements.
- Support text paste first.
- Preview redacted text.
- Preserve all inputs on error.
- Prevent duplicate submissions.
- Navigate to `/report/[id]` only after successful real analysis.

- [ ] **Step 3: Run frontend tests**

Run:

```powershell
npx vitest run tests/frontend/analyze-wizard.test.tsx
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add app/analyze features/analyze tests/frontend/analyze-wizard.test.tsx
git commit -m "feat: add guided real-API analysis flow"
```

---

### Task 13: Build Evidence-First Risk Report

**Files:**
- Create: `app/report/[id]/page.tsx`
- Create: `features/report/report-view.tsx`
- Create: `features/report/dimension-chart.tsx`
- Create: `features/report/risk-list.tsx`
- Create: `components/evidence-quote.tsx`
- Create: `components/source-badge.tsx`
- Create: `components/score-card.tsx`
- Create: `tests/frontend/report-view.test.tsx`

- [ ] **Step 1: Write failing report test**

```typescript
it("shows evidence and separates inclusivity risks from candidate score", () => {
  render(<ReportView result={analysisFixture} />);
  expect(screen.getByText("算法可读性")).toBeInTheDocument();
  expect(screen.getByText("岗位包容性提示")).toBeInTheDocument();
  expect(screen.getByText("负责小红书内容整理")).toBeInTheDocument();
  expect(screen.getByText("风险模拟结果，不代表企业真实筛选结果")).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement report components**

Required display:

- Total score and four dimensions.
- Risk severity and source badge.
- JD and resume evidence quotations.
- Inclusivity risks in a separate non-scoring section.
- Model/provider metadata in a collapsible details panel.
- CTA to generate rewrite advice.

- [ ] **Step 3: Run tests**

Run:

```powershell
npx vitest run tests/frontend/report-view.test.tsx
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add app/report features/report components tests/frontend/report-view.test.tsx
git commit -m "feat: add evidence-first readability report"
```

---

### Task 14: Build Rewrite, Fidelity, And Recheck UI

**Files:**
- Create: `app/rewrite/[id]/page.tsx`
- Create: `features/rewrite/rewrite-workspace.tsx`
- Create: `features/rewrite/rewrite-card.tsx`
- Create: `features/rewrite/fidelity-status.tsx`
- Create: `features/rewrite/comparison-view.tsx`
- Create: `tests/frontend/rewrite-workspace.test.tsx`

- [ ] **Step 1: Write failing copy-safety test**

```typescript
it("disables copy for risky rewrites", () => {
  render(<RewriteCard suggestion={riskySuggestionFixture} />);
  expect(screen.getByRole("button", { name: "复制" })).toBeDisabled();
  expect(screen.getByText("存在无法由原始经历支持的新事实")).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement rewrite workspace**

Required behavior:

- Show original evidence and three rewrite variants.
- Render editable placeholder fields.
- Recheck fidelity after placeholder confirmation or manual edits.
- Disable copy while `risky`.
- Mark unresolved placeholders while `needs_confirmation`.
- Run recheck and show previous/current scores plus dimension deltas.
- Preserve draft when recheck fails.

- [ ] **Step 3: Run tests**

Run:

```powershell
npx vitest run tests/frontend/rewrite-workspace.test.tsx
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add app/rewrite features/rewrite tests/frontend/rewrite-workspace.test.tsx
git commit -m "feat: add fidelity-safe rewrite and recheck UI"
```

---

### Task 15: Add Local History And Print-To-PDF Export

**Files:**
- Create: `lib/db.ts`
- Create: `features/history/history-service.ts`
- Create: `app/history/page.tsx`
- Create: `features/history/history-list.tsx`
- Create: `features/report/print-report.tsx`
- Modify: `app/globals.css`
- Create: `tests/frontend/history-service.test.ts`
- Create: `tests/frontend/print-report.test.tsx`

- [ ] **Step 1: Write failing history tests**

```typescript
it("stores multiple versions under one history record", async () => {
  await historyService.saveVersion("analysis-1", firstVersion);
  await historyService.saveVersion("analysis-1", secondVersion);
  const record = await historyService.get("analysis-1");
  expect(record?.versions).toHaveLength(2);
});
```

- [ ] **Step 2: Implement Dexie schema**

Use:

```typescript
export interface HistoryRecord {
  id: string;
  jobTitle: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
  versions: HistoryVersion[];
  optionalOriginalInputs?: {
    jobDescription?: string;
    resumeText?: string;
  };
}
```

Do not add automatic expiry. Add single delete and clear-all methods.

- [ ] **Step 3: Implement print export**

Add an “导出报告” button that calls `window.print()`. Add `@media print` styles that:

- Hide navigation, buttons, editable fields, and private raw resume content.
- Include score, dimensions, risks, evidence, safe rewrites, and appeal language.
- Exclude unconfirmed placeholders.

- [ ] **Step 4: Run tests**

Run:

```powershell
npx vitest run tests/frontend/history-service.test.ts tests/frontend/print-report.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/db.ts features/history app/history features/report/print-report.tsx app/globals.css tests/frontend
git commit -m "feat: add local history and print report export"
```

---

### Task 16: Add Explicit Degradation, Accessibility, And Demo Reliability

**Files:**
- Create: `components/status-alert.tsx`
- Create: `features/analyze/demo-result-loader.tsx`
- Modify: analysis/report/rewrite feature files
- Create: `tests/frontend/degradation.test.tsx`
- Create: `tests/e2e/core-flow.spec.ts`
- Create: `tests/fixtures/demo-analysis.json`

- [ ] **Step 1: Write failing degradation test**

```typescript
it("never loads demo output without explicit user action", async () => {
  render(<AnalysisFailure error={retryableProviderError} />);
  expect(screen.getByText("AI 服务暂时不可用")).toBeInTheDocument();
  expect(screen.queryByText("演示数据")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "查看演示结果" }));
  expect(screen.getByText("演示数据")).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement explicit degradation**

Rules:

- Never silently replace real results.
- Keep retry as the primary action.
- Load fixture data only after explicit click.
- Show a persistent “演示数据” banner.
- Do not allow demo results to be mistaken for saved real analysis.

- [ ] **Step 3: Apply baseline accessibility**

Verify:

- Every form control has a visible label.
- Keyboard navigation reaches every action.
- Status is expressed with text, not color alone.
- Focus moves to the error summary after failures.
- Charts have textual equivalents.
- Buttons expose loading and disabled states.

- [ ] **Step 4: Add Playwright core-flow test**

The e2e test must cover:

```text
fill example input
→ confirm JD
→ run analysis through mocked providers
→ inspect evidence
→ generate rewrite
→ confirm placeholder
→ recheck
→ save history
→ delete history
```

- [ ] **Step 5: Run frontend and e2e tests**

Run:

```powershell
npx vitest run
npx playwright test tests/e2e/core-flow.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add components features tests
git commit -m "feat: add explicit degradation and demo reliability"
```

---

### Task 17: Add Fixed Evaluation Fixtures And Regression Suite

**Files:**
- Create: `tests/fixtures/cases/campus-project.json`
- Create: `tests/fixtures/cases/career-switch.json`
- Create: `tests/fixtures/cases/semantic-match.json`
- Create: `tests/fixtures/cases/strong-evidence.json`
- Create: `tests/fixtures/cases/image-pdf.json`
- Create: `tests/fixtures/cases/inclusivity-risk.json`
- Create: `tests/backend/test_regression_cases.py`

- [ ] **Step 1: Create six manually labeled fixtures**

Each fixture must contain:

```json
{
  "name": "campus-project",
  "job_title": "用户增长实习生",
  "job_description": "...",
  "resume_text": "...",
  "expected_risk_types": ["missing_keyword", "weak_evidence"],
  "expected_score_range": [40, 75],
  "expected_inclusivity_phrases": []
}
```

- [ ] **Step 2: Write regression test**

```python
@pytest.mark.parametrize("case_path", CASE_PATHS)
async def test_fixed_case_stays_in_expected_range(case_path, deterministic_service):
    case = json.loads(case_path.read_text(encoding="utf-8"))
    result = await deterministic_service.run_case(case)
    low, high = case["expected_score_range"]
    assert low <= result.readability_score <= high
    assert set(case["expected_risk_types"]) <= {risk.type for risk in result.risks}
```

- [ ] **Step 3: Run regression suite**

Run:

```powershell
python -m pytest tests/backend/test_regression_cases.py -v
```

Expected: PASS for all six fixtures.

- [ ] **Step 4: Commit**

```powershell
git add tests/fixtures/cases tests/backend/test_regression_cases.py
git commit -m "test: add fixed readability regression cases"
```

---

### Task 18: Configure EdgeOne, Documentation, And Final Verification

**Files:**
- Create: `edgeone.json`
- Modify: `package.json`
- Create: `README.md`
- Create: `docs/demo-script.md`
- Create: `docs/api-provider-extension.md`

- [ ] **Step 1: Add scripts and EdgeOne configuration**

Ensure `package.json` includes:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "edgeone:dev": "edgeone pages dev"
  }
}
```

Do not configure `edgeone pages dev` as EdgeOne's own dev command.

- [ ] **Step 2: Document setup and provider extension**

`README.md` must include:

- Prerequisites.
- Environment variables.
- Local EdgeOne start command.
- Test commands.
- Real API setup.
- Explicit demo degradation behavior.
- Privacy behavior.
- EdgeOne platform constraints.

`docs/api-provider-extension.md` must state:

1. Implement `LLMProvider` or `EmbeddingProvider`.
2. Map vendor errors to common errors.
3. Register adapter in Provider Registry.
4. Add settings.
5. Pass shared contract tests.
6. Do not modify domain services or API schemas.

- [ ] **Step 3: Add demo script**

`docs/demo-script.md` must follow:

```text
real example input
→ evidence-backed risk
→ evidence-constrained rewrite
→ placeholder confirmation
→ fidelity pass
→ recheck improvement
→ save or export
```

- [ ] **Step 4: Run complete local verification**

Run:

```powershell
python -m pytest tests/backend -v
npx vitest run
npx playwright test
npm run lint
npm run build
$env:PAGES_SOURCE='skills'; edgeone pages dev
```

Expected:

- All automated checks PASS.
- Local EdgeOne application opens at the CLI-provided URL.
- One real Mimo + Hunyuan analysis completes.
- One provider-failure path preserves input and offers explicit demo loading.

- [ ] **Step 5: Deploy preview and smoke test**

Before deploying, choose the correct EdgeOne site and authenticate according to the EdgeOne deployment workflow.

Run:

```powershell
$env:PAGES_SOURCE='skills'; edgeone pages deploy -e preview
```

Expected:

- Deployment succeeds.
- Preserve the full `EDGEONE_DEPLOY_URL`, including query parameters.
- Online health endpoint returns `{"status":"ok"}`.
- Online real analysis and rewrite flow complete.

- [ ] **Step 6: Final commit**

```powershell
git add edgeone.json package.json README.md docs
git commit -m "docs: add deployment and provider extension guide"
```

## 4. Final Verification Checklist

- [ ] `python -m pytest tests/backend -v`
- [ ] `npx vitest run`
- [ ] `npx playwright test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Real Mimo analysis succeeds.
- [ ] Real Hunyuan Embedding request succeeds.
- [ ] Unknown provider configuration fails with a unified error.
- [ ] Provider swap contract test passes.
- [ ] Same fixture returns the same score twice.
- [ ] Every high-risk item references evidence.
- [ ] Inclusivity risks do not affect candidate score.
- [ ] Risky rewrites cannot be copied.
- [ ] Recheck preserves the previous report.
- [ ] History survives refresh and can be deleted.
- [ ] Print output excludes private raw resume and unconfirmed placeholders.
- [ ] Explicit demo data is visibly labeled.
- [ ] EdgeOne local and online smoke tests pass.


