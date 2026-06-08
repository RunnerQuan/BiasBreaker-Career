from datetime import datetime, timezone
import re

from .career_lexicon import (
    clamp,
    contains,
    extract_jd_keywords,
    find_risk_markers,
    matched_keywords,
    missing_keywords,
    score_evidence_chain,
    select_career_lexicon,
    unique,
)
from .schemas import (
    AnalysisDimension,
    AnalysisFinding,
    AnalysisRequest,
    AnalysisResponse,
    AnalysisSuggestion,
    ReviewScripts,
)


def level(score: int) -> str:
    if score > 90:
        return "low"
    if score >= 75:
        return "medium"
    return "high"


def evidence_line(text: str, terms: list[str]) -> str:
    lines = [line.strip() for line in re.split(r"\n|。|；|;", text) if line.strip()]
    for line in lines:
        if any(contains(line, term) for term in terms):
            return line
    return lines[0] if lines else "暂未找到明确证据句。"


def readable_text_ratio(text: str) -> float:
    compact = re.sub(r"\s", "", text)
    if not compact:
        return 0
    readable = re.findall(r"[\u4e00-\u9fa5A-Za-z0-9%.,，。:：;；/()（）+\-#]", compact)
    return len(readable) / len(compact)


def score_ats_readability(resume_text: str, resume_file_name: str | None, structure_score: int) -> tuple[int, str]:
    file_name = resume_file_name or ""
    has_file = bool(file_name)
    is_plain_text_file = bool(re.search(r"\.(txt|md)$", file_name, re.I))
    is_parsed_document = bool(re.search(r"\.(pdf|docx)$", file_name, re.I))
    text_length = len(resume_text.strip())
    readable_ratio = readable_text_ratio(resume_text)
    has_enough_text = text_length >= 300
    has_rich_text = text_length >= 800
    has_rich_structure = structure_score >= 80
    has_excellent_structure = structure_score >= 92
    has_readable_chars = readable_ratio >= 0.65
    has_very_readable_chars = readable_ratio >= 0.78
    has_likely_garbled_text = text_length > 0 and readable_ratio < 0.45

    score = 68
    reasons: list[str] = []

    if not has_file:
        score += 8
        reasons.append("基于粘贴文本分析")
    elif is_plain_text_file:
        score += 14
        reasons.append(f"已接收 {file_name}，纯文本格式便于系统读取")
    elif is_parsed_document:
        score += 12 if has_enough_text else 4
        reasons.append(f"已成功解析 {file_name}")
    else:
        score += 2
        reasons.append(f"已接收 {file_name}，该格式存在一定解析不确定性")

    if has_rich_structure:
        score += 10 if has_excellent_structure else 7
        reasons.append("栏目结构清晰")
    elif structure_score < 60:
        score -= 10
        reasons.append("栏目结构信号不足")

    if has_rich_text:
        score += 8
        reasons.append("可提取文本较充分")
    elif has_enough_text:
        score += 5
        reasons.append("可提取文本长度正常")
    elif text_length < 160:
        score -= 18
        reasons.append("可提取文本过短，可能存在扫描件或解析缺失")
    else:
        score -= 6
        reasons.append("可提取文本偏短")

    if has_very_readable_chars:
        score += 6
        reasons.append("文本字符可读性高")
    elif has_readable_chars:
        score += 3
        reasons.append("文本字符可读性正常")
    elif has_likely_garbled_text:
        score -= 16
        reasons.append("疑似存在乱码或不可读字符")

    summary = "；".join(reasons[:4]) or "基于文件格式、文本提取质量、栏目结构和字符可读性进行评估"
    return clamp(score), summary


class AnalysisService:
    async def analyze(self, request: AnalysisRequest) -> AnalysisResponse:
        jd = request.jd_text.strip()
        resume = request.resume_text.strip()
        selected = select_career_lexicon(jd, request.job_title)
        jd_keywords = extract_jd_keywords(jd, selected)
        target_keywords = jd_keywords or selected.keywords[:24]
        matched = matched_keywords(resume, target_keywords, selected.synonyms)
        missing = missing_keywords(resume, target_keywords, selected.synonyms)
        evidence_score, evidence_by_category, has_evidence_chain = score_evidence_chain(resume, selected)
        risk_markers = find_risk_markers(jd, selected)

        keyword_score = 58 if not target_keywords else clamp(len(matched) / len(target_keywords) * 100)
        structure_score = clamp(
            42
            + len([marker for marker in selected.structure_markers if contains(resume, marker)]) * 5
            + min(len([line for line in resume.splitlines() if line.strip()]), 10) * 2
        )
        ats_score, ats_summary = score_ats_readability(resume, request.resume_file_name, structure_score)
        score = clamp(keyword_score * 0.34 + structure_score * 0.20 + evidence_score * 0.32 + ats_score * 0.14)
        risk_level = level(score)

        findings: list[AnalysisFinding] = []
        if missing:
            findings.append(
                AnalysisFinding(
                    type="岗位关键词转译不足",
                    severity="high" if len(missing) >= 5 else "medium",
                    source="resume",
                    evidence=f"系统识别该 JD 更接近【{selected.domain['name']}】，但 {'、'.join(missing[:6])} 等表达在简历中不明显。",
                    suggestion="优先把真实经历转译为岗位语言；如果确实没有相关经历，使用“待补充/待确认”而不是编造。",
                )
            )

        evidence_terms = unique([*matched, *[term for terms in evidence_by_category.values() for term in terms]])
        if evidence_score < 72 or not has_evidence_chain:
            findings.append(
                AnalysisFinding(
                    type="经历证据链不足",
                    severity="high" if evidence_score < 58 else "medium",
                    source="resume",
                    evidence=evidence_line(resume, evidence_terms or target_keywords),
                    suggestion="建议补齐“动作—对象—方法/工具—产出/指标”链条，例如说明你分析了什么对象、用什么方法、输出了什么结果。",
                )
            )

        if structure_score < 70:
            findings.append(
                AnalysisFinding(
                    type="结构可读性风险",
                    severity="medium",
                    source="resume",
                    evidence="简历结构标题或分段信号不足，自动解析时可能难以定位教育、项目、实习、技能等信息。",
                    suggestion="使用清晰栏目标题，并将项目经历按背景、职责、行动、结果拆分。",
                )
            )

        if risk_markers:
            findings.append(
                AnalysisFinding(
                    type="岗位隐性门槛风险",
                    severity="medium",
                    source="jd",
                    evidence=evidence_line(jd, risk_markers),
                    suggestion="该风险不计入个人能力分数。建议投递或面试时围绕能力要求进一步澄清，必要时准备人工复核说明。",
                )
            )

        if not findings:
            findings.append(
                AnalysisFinding(
                    type="低风险",
                    severity="low",
                    source="system",
                    evidence=f"JD 与简历在【{selected.domain['name']}】方向上的关键词、结构与经历证据整体匹配度较好。",
                    suggestion="可继续补充量化结果，让表达更适合自动化系统和 HR 快速阅读。",
                )
            )

        title = request.job_title.strip() or selected.domain["name"] or "目标岗位"
        main_missing = "、".join(missing[:3]) or "岗位核心能力"

        return AnalysisResponse(
            analysisId=request.analysis_id or f"analysis_{int(datetime.now(tz=timezone.utc).timestamp() * 1000)}",
            createdAt=datetime.now(tz=timezone.utc).isoformat(),
            providerMode="rules",
            score=score,
            level=risk_level,  # type: ignore[arg-type]
            summary=f"当前材料在【{selected.domain['name']}】方向具备较好的算法可读性，可继续优化量化证据。"
            if risk_level == "low"
            else f"主要风险不是能力不足，而是部分经历尚未被转译成【{selected.domain['name']}】岗位系统容易识别的表达。",
            dimensions=[
                AnalysisDimension(
                    key="keywordCoverage",
                    label="关键词覆盖",
                    score=keyword_score,
                    summary=f"已覆盖 {'、'.join(matched[:8])}" if matched else "暂未覆盖明显岗位关键词",
                ),
                AnalysisDimension(key="structureClarity", label="结构清晰度", score=structure_score, summary="检测教育、项目、经历、技能等结构信号"),
                AnalysisDimension(
                    key="evidenceStrength",
                    label="经历证据",
                    score=evidence_score,
                    summary="已形成基础证据链" if has_evidence_chain else "动作、对象、方法或结果链条仍需补齐",
                ),
                AnalysisDimension(key="atsReadability", label="ATS 可读性", score=ats_score, summary=ats_summary),
            ],
            findings=findings,
            suggestions=[
                AnalysisSuggestion(title="补齐岗位关键词", description=f"优先处理 {main_missing} 等表达缺口。", example=f"将真实经历改写为“围绕{main_missing}进行资料整理、问题分析，并输出可复用的复盘建议”。"),
                AnalysisSuggestion(title="把经历写成证据链", description="避免只写“熟悉、参与、负责”，补充对象、方法、工具、产出和指标。", example="参与用户反馈整理，使用 Excel 按问题类型归类，输出选题优化清单，支持后续内容复盘。"),
                AnalysisSuggestion(title="准备人工复核说明", description="对于校园项目、跨专业或非典型经历，用能力语言解释相关性。", example=f"我的经历与{title}的要求相关，主要体现在信息整理、问题分析、跨团队协作和结果复盘能力。"),
            ],
            reviewScripts=ReviewScripts(
                manualReview=f"您好，我刚刚投递贵司【{title}】岗位。由于我的部分经历属于校园项目或跨领域实践，可能无法完全通过自动化筛选呈现其相关性。为便于贵团队更全面评估，我补充说明：我曾围绕{main_missing}相关任务进行资料整理、问题分析和结果复盘，具备与岗位相关的信息处理、协作和优化能力。若方便，烦请进行人工复核。感谢您的时间。",
                interviewExplanation=f"这段经历虽然不是传统实习，但我承担了信息整理、问题分析和结果复盘工作。它对应到{title}岗位中，主要体现为快速理解业务目标、拆解任务、使用合适工具处理信息并沉淀可执行建议的能力。",
            ),
        )
