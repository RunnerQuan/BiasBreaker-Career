from typing import Literal

from pydantic import BaseModel, Field


RiskLevel = Literal["low", "medium", "high"]


class AnalysisRequest(BaseModel):
    analysis_id: str | None = Field(default=None, alias="analysisId")
    job_title: str = Field(default="", alias="jobTitle")
    jd_text: str = Field(alias="jdText")
    resume_text: str = Field(alias="resumeText")
    resume_file_name: str | None = Field(default=None, alias="resumeFileName")


class AnalysisDimension(BaseModel):
    key: Literal["keywordCoverage", "structureClarity", "evidenceStrength", "atsReadability"]
    label: str
    score: int
    summary: str


class AnalysisFinding(BaseModel):
    type: str
    severity: RiskLevel
    source: Literal["jd", "resume", "system"]
    evidence: str
    suggestion: str


class AnalysisSuggestion(BaseModel):
    title: str
    description: str
    example: str


class ReviewScripts(BaseModel):
    manual_review: str = Field(alias="manualReview")
    interview_explanation: str = Field(alias="interviewExplanation")


class AnalysisResponse(BaseModel):
    analysis_id: str = Field(alias="analysisId")
    created_at: str = Field(alias="createdAt")
    provider_mode: Literal["rules", "llm"] = Field(alias="providerMode")
    score: int
    level: RiskLevel
    summary: str
    dimensions: list[AnalysisDimension]
    findings: list[AnalysisFinding]
    suggestions: list[AnalysisSuggestion]
    review_scripts: ReviewScripts = Field(alias="reviewScripts")

