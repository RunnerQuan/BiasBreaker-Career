from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .analysis_service import AnalysisService
from .schemas import AnalysisRequest, AnalysisResponse


app = FastAPI(title="BiasBreaker Career API")
service = AnalysisService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalysisResponse, response_model_by_alias=True)
async def analyze(request: AnalysisRequest) -> AnalysisResponse:
    if not request.jd_text.strip():
        raise HTTPException(status_code=400, detail="请先填写岗位 JD。")
    if not request.resume_text.strip():
        raise HTTPException(status_code=400, detail="请粘贴简历文本，或上传可解析文本文件。")
    return await service.analyze(request)

