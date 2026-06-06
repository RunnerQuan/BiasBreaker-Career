from datetime import datetime, timezone
import re

from .schemas import (
    AnalysisDimension,
    AnalysisFinding,
    AnalysisRequest,
    AnalysisResponse,
    AnalysisSuggestion,
    ReviewScripts,
)


KEYWORDS = [
    "数据分析",
    "用户增长",
    "内容运营",
    "小红书",
    "投放复盘",
    "用户调研",
    "竞品分析",
    "SQL",
    "Excel",
    "Python",
    "A/B",
    "社群运营",
    "活动策划",
    "产品",
    "运营",
    "反馈",
    "复盘",
]

STRUCTURE_MARKERS = ["教育", "实习", "项目", "经历", "技能", "获奖", "校园", "工作", "证书"]
EVIDENCE_MARKERS = ["负责", "参与", "完成", "输出", "提升", "降低", "增长", "优化", "分析", "整理", "%", "人", "份", "次", "篇"]


def clamp(value: float, minimum: int = 0, maximum: int = 100) -> int:
    return min(maximum, max(minimum, round(value)))


def contains(text: str, keyword: str) -> bool:
    return keyword.lower() in text.lower()


def level(score: int) -> str:
    if score >= 82:
        return "low"
    if score >= 62:
        return "medium"
    return "high"


def evidence_line(text: str, terms: list[str]) -> str:
    lines = [line.strip() for line in re.split(r"\n|。|；|;", text) if line.strip()]
    for line in lines:
        if any(contains(line, term) for term in terms):
            return line
    return lines[0] if lines else "暂未找到明确证据句。"


class AnalysisService:
    async def analyze(self, request: AnalysisRequest) -> AnalysisResponse:
        jd = request.jd_text.strip()
        resume = request.resume_text.strip()
        jd_keywords = list(dict.fromkeys(keyword for keyword in KEYWORDS if contains(jd, keyword)))
        matched = [keyword for keyword in jd_keywords if contains(resume, keyword)]
        missing = [keyword for keyword in jd_keywords if not contains(resume, keyword)]

        keyword_score = 58 if not jd_keywords else clamp(len(matched) / len(jd_keywords) * 100)
        structure_score = clamp(42 + len([m for m in STRUCTURE_MARKERS if contains(resume, m)]) * 8 + min(len([line for line in resume.splitlines() if line.strip()]), 10) * 2)
        evidence_score = clamp(38 + len([m for m in EVIDENCE_MARKERS if contains(resume, m)]) * 4 + (14 if re.search(r"\d", resume) else 0))
        ats_score = clamp(82 - (8 if request.resume_file_name and not re.search(r"\.(txt|md)$", request.resume_file_name, re.I) else 0) - (18 if len(resume) < 160 else 0))
        score = clamp(keyword_score * 0.36 + structure_score * 0.22 + evidence_score * 0.28 + ats_score * 0.14)
        risk_level = level(score)

        findings: list[AnalysisFinding] = []
        if missing:
            findings.append(
                AnalysisFinding(
                    type="关键词缺失风险",
                    severity="high" if len(missing) >= 3 else "medium",
                    source="resume",
                    evidence=f"JD 提到 {'、'.join(missing[:5])}，简历中未形成明确表达。",
                    suggestion="把真实经历转译为岗位关键词，但不要新增未发生过的项目或数据。",
                )
            )

        if evidence_score < 70:
            findings.append(
                AnalysisFinding(
                    type="经历证据不足",
                    severity="high" if evidence_score < 55 else "medium",
                    source="resume",
                    evidence=evidence_line(resume, matched or EVIDENCE_MARKERS),
                    suggestion="为关键经历补充对象、动作、方法和结果，例如数据规模、分析方法、输出物或协作结果。",
                )
            )

        if structure_score < 70:
            findings.append(
                AnalysisFinding(
                    type="结构可读性风险",
                    severity="medium",
                    source="resume",
                    evidence="简历结构标题或分段信号不足，自动解析时可能难以定位教育、项目、技能等信息。",
                    suggestion="使用清晰栏目标题，并将项目经历按职责、行动、结果拆分。",
                )
            )

        if re.search(r"形象气质佳|抗压|吃苦耐劳|年轻|不限经验", jd):
            findings.append(
                AnalysisFinding(
                    type="岗位隐性门槛风险",
                    severity="medium",
                    source="jd",
                    evidence=evidence_line(jd, ["形象气质佳", "抗压", "吃苦耐劳", "年轻", "不限经验"]),
                    suggestion="该风险不计入个人分数，建议在投递或面试中围绕能力要求进一步澄清。",
                )
            )

        if not findings:
            findings.append(
                AnalysisFinding(
                    type="低风险",
                    severity="low",
                    source="system",
                    evidence="JD 关键词、简历结构和经历证据整体匹配度较好。",
                    suggestion="可继续补充量化结果，让表达更适合自动化系统和 HR 快速阅读。",
                )
            )

        title = request.job_title.strip() or "目标岗位"
        main_missing = "、".join(missing[:3]) or "岗位核心能力"

        return AnalysisResponse(
            analysisId=request.analysis_id or f"analysis_{int(datetime.now(tz=timezone.utc).timestamp() * 1000)}",
            createdAt=datetime.now(tz=timezone.utc).isoformat(),
            providerMode="rules",
            score=score,
            level=risk_level,  # type: ignore[arg-type]
            summary="当前材料具备较好的算法可读性，可继续优化量化证据。"
            if risk_level == "low"
            else "主要风险不是能力不足，而是部分经历尚未被转译成岗位系统容易识别的表达。",
            dimensions=[
                AnalysisDimension(key="keywordCoverage", label="关键词覆盖", score=keyword_score, summary=f"已覆盖 {'、'.join(matched)}" if matched else "暂未覆盖明显岗位关键词"),
                AnalysisDimension(key="structureClarity", label="结构清晰度", score=structure_score, summary="检测教育、项目、经历与技能等结构信号"),
                AnalysisDimension(key="evidenceStrength", label="经历证据", score=evidence_score, summary="衡量行动、方法、对象和结果是否清楚"),
                AnalysisDimension(key="atsReadability", label="ATS 可读性", score=ats_score, summary=f"已接收 {request.resume_file_name}" if request.resume_file_name else "基于粘贴文本进行解析"),
            ],
            findings=findings,
            suggestions=[
                AnalysisSuggestion(title="补齐岗位关键词", description=f"优先处理 {main_missing} 等表达缺口。", example=f"将真实经历改写为“围绕{main_missing}整理反馈、分析表现并输出复盘建议”。"),
                AnalysisSuggestion(title="把经历写成证据链", description="避免只写“熟悉、参与、负责”，补充对象、动作和产出。", example="参与内容运营数据整理，按渠道归纳用户反馈，输出选题优化建议。"),
                AnalysisSuggestion(title="准备人工复核说明", description="对于校园项目、跨专业或非典型经历，用能力语言解释相关性。", example=f"我的经历与{title}的要求相关，主要体现在信息整理、用户反馈分析和阶段复盘能力。"),
            ],
            reviewScripts=ReviewScripts(
                manualReview=f"您好，我刚刚投递贵司【{title}】岗位。由于我的部分经历属于校园项目或跨领域实践，可能无法完全通过自动化筛选呈现其相关性。为便于贵团队更全面评估，我补充说明：我曾围绕用户反馈、内容表现或项目复盘进行整理分析，具备与岗位相关的信息处理、协作和优化能力。若方便，烦请进行人工复核。感谢您的时间。",
                interviewExplanation=f"这段经历虽然不是传统实习，但我承担了信息整理、问题分析和结果复盘工作。它对应到{title}岗位中，主要体现为快速理解业务目标、拆解任务并沉淀可执行建议的能力。",
            ),
        )

