from __future__ import annotations

from dataclasses import dataclass
from typing import Any


STRUCTURE_MARKERS = [
    "教育", "教育背景", "实习", "实习经历", "项目", "项目经历", "校园经历", "工作经历", "实践经历", "科研经历",
    "技能", "专业技能", "获奖", "荣誉", "证书", "自我评价", "个人优势", "作品集", "论文", "竞赛",
]

RISK_MARKERS = [
    "形象气质佳", "抗压", "吃苦耐劳", "年轻", "不限经验", "能接受加班", "女生优先", "男生优先", "本地户籍",
    "985", "211", "双一流", "第一学历", "性格外向", "酒量", "已婚已育", "未婚",
]

EVIDENCE_LEXICON = {
    "action": ["负责", "参与", "主导", "协助", "独立完成", "搭建", "设计", "开发", "运营", "策划", "执行", "分析", "整理", "撰写", "输出", "复盘", "优化", "推进", "跟进", "维护", "沉淀", "构建", "调研", "访谈", "测试", "迭代"],
    "object": ["用户", "客户", "候选人", "岗位", "简历", "内容", "账号", "社群", "活动", "数据", "系统", "接口", "页面", "模型", "报告", "问卷", "需求", "产品", "品牌", "渠道", "项目", "业务", "流程"],
    "method": ["问卷", "访谈", "SQL", "Excel", "Python", "A/B测试", "A/B", "竞品分析", "数据清洗", "用户分层", "原型设计", "埋点分析", "可视化", "桌面研究", "案例研究", "用户画像", "漏斗分析", "回归分析", "聚类", "看板", "Prompt", "RAG", "Embedding"],
    "output": ["报告", "方案", "SOP", "看板", "原型", "文档", "脚本", "模型", "组件", "接口", "复盘", "清单", "流程图", "需求文档", "PRD", "调研报告", "分析报告", "作品集", "Demo", "代码", "数据表"],
    "metric": ["%", "人", "次", "份", "篇", "小时", "天", "周", "月", "增长", "提升", "降低", "减少", "新增", "转化率", "留存率", "点击率", "互动率", "完播率", "阅读量", "曝光", "准确率", "召回率", "GMV", "DAU", "MAU", "ROI"],
}

DOMAINS: list[dict[str, Any]] = [
    {
        "id": "operation",
        "name": "运营类",
        "jobAliases": ["运营", "运营实习生", "内容运营", "用户运营", "社群运营", "活动运营", "新媒体运营", "用户增长", "增长运营", "私域运营", "渠道运营", "账号运营"],
        "coreSkills": ["内容运营", "用户运营", "社群运营", "活动运营", "新媒体运营", "用户增长", "私域运营", "渠道运营", "账号运营", "内容策划", "内容选题", "内容排期", "用户反馈", "用户分层", "用户留存", "拉新", "促活", "裂变", "转化", "投放复盘", "运营复盘", "数据复盘", "活动策划", "社群维护", "增长策略"],
        "tools": ["Excel", "飞书", "腾讯文档", "小红书", "抖音", "公众号", "视频号", "B站", "企微", "企业微信", "问卷星", "金数据", "数据看板"],
        "actionVerbs": ["策划", "运营", "发布", "维护", "跟进", "复盘", "分析", "整理", "拉新", "促活", "转化", "沉淀"],
        "evidenceMarkers": ["阅读量", "互动率", "转化率", "留存率", "新增用户", "完播率", "曝光量", "点击率", "社群人数", "活动参与", "内容发布", "线索", "留资"],
        "synonyms": {"用户调研": ["用户访谈", "问卷调研", "访谈整理", "需求调研", "用户反馈收集"], "内容运营": ["新媒体运营", "账号运营", "社媒运营", "内容策划", "内容编辑"], "数据复盘": ["投放复盘", "运营复盘", "效果分析", "数据分析复盘"], "用户增长": ["拉新", "促活", "裂变", "增长运营", "增长策略"]},
    },
    {
        "id": "product",
        "name": "产品类",
        "jobAliases": ["产品", "产品经理", "产品助理", "产品实习生", "产品运营", "AI产品", "B端产品", "C端产品"],
        "coreSkills": ["需求分析", "用户需求", "竞品分析", "原型设计", "PRD", "MRD", "BRD", "用户画像", "用户旅程", "流程图", "功能设计", "交互设计", "需求评审", "需求优先级", "版本迭代", "用户体验", "可用性测试", "数据埋点", "指标设计", "产品规划", "产品路线图"],
        "tools": ["Axure", "Figma", "墨刀", "Sketch", "Visio", "飞书文档", "腾讯文档", "Tapd", "Jira", "禅道", "XMind", "ProcessOn"],
        "actionVerbs": ["调研", "拆解", "设计", "绘制", "撰写", "评审", "推进", "验收", "迭代", "复盘"],
        "evidenceMarkers": ["PRD", "原型", "需求池", "版本", "迭代", "埋点", "转化率", "留存率", "点击率", "用户反馈", "可用性"],
        "synonyms": {"需求分析": ["需求调研", "需求拆解", "业务需求", "用户需求分析"], "原型设计": ["低保真原型", "高保真原型", "交互原型", "页面原型"], "竞品分析": ["竞品调研", "产品对标", "功能对比", "市场对标"]},
    },
    {
        "id": "engineering",
        "name": "技术研发类",
        "jobAliases": ["开发", "研发", "软件工程师", "后端", "前端", "全栈", "算法", "测试开发", "Java开发", "Python开发", "AI工程师"],
        "coreSkills": ["Java", "Python", "C++", "Go", "JavaScript", "TypeScript", "React", "Vue", "Next.js", "Spring Boot", "FastAPI", "MySQL", "Redis", "Elasticsearch", "Docker", "Linux", "Git", "HTTP", "RESTful API", "微服务", "消息队列", "缓存", "数据库设计", "接口开发", "单元测试", "性能优化", "并发", "数据结构", "算法", "机器学习", "LLM", "RAG", "Embedding", "Prompt Engineering"],
        "tools": ["IDEA", "VS Code", "GitHub", "GitLab", "Postman", "Docker", "Navicat", "RedisInsight", "Jenkins", "Maven", "npm", "pnpm"],
        "actionVerbs": ["开发", "实现", "封装", "重构", "接入", "部署", "调试", "测试", "优化", "排查", "设计", "维护"],
        "evidenceMarkers": ["接口", "QPS", "响应时间", "并发", "延迟", "吞吐", "准确率", "召回率", "单元测试", "覆盖率", "部署", "上线", "Bug", "性能"],
        "synonyms": {"接口开发": ["API开发", "后端接口", "服务端接口", "REST接口"], "性能优化": ["响应时间优化", "缓存优化", "SQL优化", "并发优化"], "机器学习": ["AI", "人工智能", "模型训练", "模型应用", "算法模型"]},
    },
    {
        "id": "data",
        "name": "数据分析类",
        "jobAliases": ["数据分析", "商业分析", "数据运营", "数据产品", "BI", "数据实习生", "策略分析"],
        "coreSkills": ["数据分析", "数据清洗", "数据建模", "SQL", "Python", "Pandas", "NumPy", "Excel", "Power BI", "Tableau", "可视化", "指标体系", "漏斗分析", "留存分析", "用户分层", "聚类分析", "回归分析", "A/B测试", "统计分析", "数据看板", "数据报表", "业务分析", "转化率", "GMV", "DAU", "MAU", "ARPU"],
        "tools": ["SQL", "Excel", "Python", "Pandas", "Power BI", "Tableau", "FineBI", "帆软", "SPSS", "Stata", "R", "Jupyter"],
        "actionVerbs": ["清洗", "建模", "分析", "统计", "可视化", "搭建", "监控", "归因", "拆解", "预测"],
        "evidenceMarkers": ["指标", "报表", "看板", "转化率", "留存率", "GMV", "DAU", "MAU", "样本", "显著", "相关", "回归", "聚类"],
        "synonyms": {"数据看板": ["BI看板", "可视化看板", "指标看板", "数据大屏"], "业务分析": ["商业分析", "经营分析", "策略分析", "问题诊断"], "A/B测试": ["AB测试", "实验分析", "对照实验"]},
    },
    {
        "id": "marketing",
        "name": "市场品牌类",
        "jobAliases": ["市场", "品牌", "营销", "市场营销", "品牌传播", "公关", "媒介", "增长", "投放", "用户研究"],
        "coreSkills": ["市场调研", "品牌传播", "整合营销", "用户洞察", "竞品调研", "传播策划", "营销活动", "KOL", "KOC", "小红书投放", "信息流投放", "社媒传播", "内容种草", "品牌定位", "传播矩阵", "舆情监测", "口碑分析", "转化链路", "增长策略", "渠道分析", "投放ROI", "转化成本", "曝光", "点击", "留资"],
        "tools": ["小红书", "抖音", "巨量引擎", "腾讯广告", "百度指数", "新榜", "蝉妈妈", "飞瓜", "清博", "Excel", "PPT"],
        "actionVerbs": ["调研", "策划", "投放", "传播", "监测", "分析", "复盘", "对接", "撰写", "执行"],
        "evidenceMarkers": ["曝光", "点击", "互动", "转化", "ROI", "CPC", "CPM", "CPA", "声量", "口碑", "留资", "线索", "覆盖人数"],
        "synonyms": {"品牌传播": ["品牌宣传", "品牌推广", "传播策划", "公关传播"], "用户洞察": ["消费者洞察", "人群洞察", "需求洞察", "舆情洞察"], "内容种草": ["社媒种草", "达人种草", "KOL投放", "KOC投放"]},
    },
    {
        "id": "hr",
        "name": "人力资源类",
        "jobAliases": ["人力资源", "HR", "招聘", "组织发展", "员工关系", "培训", "薪酬绩效", "HRBP", "校招"],
        "coreSkills": ["招聘", "校招", "社招", "简历筛选", "人才画像", "岗位画像", "人才盘点", "胜任力模型", "面试安排", "候选人沟通", "面试评估", "招聘漏斗", "招聘转化率", "员工关系", "培训", "绩效", "组织发展", "薪酬福利", "人力资源数据分析", "雇主品牌", "人才测评", "入离职", "背调", "Offer沟通"],
        "tools": ["Excel", "飞书", "北森", "Moka", "BOSS直聘", "智联招聘", "前程无忧", "脉脉", "问卷星", "PPT"],
        "actionVerbs": ["筛选", "邀约", "沟通", "安排", "评估", "盘点", "访谈", "维护", "分析", "跟进"],
        "evidenceMarkers": ["候选人", "简历", "面试", "Offer", "到面率", "通过率", "转化率", "招聘周期", "入职", "离职", "培训满意度"],
        "synonyms": {"简历筛选": ["简历初筛", "候选人筛选", "人才筛选"], "候选人沟通": ["候选人邀约", "面试邀约", "Offer沟通"], "雇主品牌": ["校招宣传", "招聘宣传", "雇主形象"]},
    },
    {
        "id": "design",
        "name": "设计类",
        "jobAliases": ["设计", "UI", "UX", "视觉设计", "交互设计", "平面设计", "品牌设计", "产品设计"],
        "coreSkills": ["UI设计", "UX设计", "视觉设计", "交互设计", "用户体验", "设计规范", "组件库", "设计系统", "Figma", "Sketch", "Photoshop", "Illustrator", "动效设计", "信息架构", "原型设计", "可用性测试", "视觉层级", "色彩规范", "版式设计", "品牌视觉", "用户研究", "作品集"],
        "tools": ["Figma", "Sketch", "Photoshop", "Illustrator", "After Effects", "Principle", "墨刀", "Axure", "Blender", "Midjourney"],
        "actionVerbs": ["设计", "绘制", "搭建", "规范", "优化", "迭代", "走查", "交付", "还原", "测试"],
        "evidenceMarkers": ["作品集", "组件", "规范", "页面", "动效", "转化率", "点击率", "可用性", "一致性", "还原度", "设计稿"],
        "synonyms": {"用户体验": ["UX", "体验设计", "可用性", "易用性"], "视觉设计": ["UI设计", "界面设计", "平面设计", "品牌视觉"], "设计系统": ["组件库", "设计规范", "Design System"]},
    },
    {
        "id": "research_consulting",
        "name": "研究咨询类",
        "jobAliases": ["研究", "咨询", "行业研究", "商业分析", "战略", "管培生", "用户研究", "市场研究"],
        "coreSkills": ["行业研究", "桌面研究", "专家访谈", "用户访谈", "问卷设计", "数据整理", "报告撰写", "竞品分析", "案例研究", "商业分析", "战略分析", "市场规模", "商业模式", "PEST", "SWOT", "波特五力", "访谈纪要", "洞察提炼", "研究框架", "结论输出", "PPT汇报", "资料搜集"],
        "tools": ["Excel", "PPT", "Wind", "Choice", "企查查", "天眼查", "Statista", "艾瑞", "QuestMobile", "问卷星", "飞书"],
        "actionVerbs": ["研究", "访谈", "搜集", "整理", "分析", "建模", "撰写", "提炼", "汇报", "拆解"],
        "evidenceMarkers": ["报告", "访谈", "问卷", "样本", "行业规模", "市场规模", "框架", "结论", "建议", "汇报", "PPT"],
        "synonyms": {"桌面研究": ["二手资料研究", "公开资料搜集", "资料检索", "desk research"], "报告撰写": ["研究报告", "分析报告", "咨询报告", "汇报材料"], "洞察提炼": ["结论提炼", "问题归纳", "观点沉淀", "研究发现"]},
    },
]


@dataclass
class SelectedLexicon:
    domain: dict[str, Any]
    domains: list[dict[str, Any]]
    keywords: list[str]
    structure_markers: list[str]
    risk_markers: list[str]
    evidence_lexicon: dict[str, list[str]]
    synonyms: dict[str, list[str]]


def contains(text: str, keyword: str) -> bool:
    return keyword.lower() in text.lower()


def unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            output.append(item)
    return output


def select_career_lexicon(jd_text: str, job_title: str = "") -> SelectedLexicon:
    signal = f"{job_title}\n{jd_text}"
    scored = sorted(((domain, score_domain(signal, domain)) for domain in DOMAINS), key=lambda item: item[1], reverse=True)
    domains = [domain for domain, score in scored if score > 0][:2] or DOMAINS[:3]
    synonyms = merge_synonyms(domains)
    keywords = unique([term for domain in domains for term in [*domain["jobAliases"], *domain["coreSkills"], *domain["tools"]]])
    return SelectedLexicon(
        domain=domains[0],
        domains=domains,
        keywords=keywords,
        structure_markers=STRUCTURE_MARKERS,
        risk_markers=RISK_MARKERS,
        evidence_lexicon=merge_evidence_lexicon(domains),
        synonyms=synonyms,
    )


def extract_jd_keywords(jd_text: str, selected: SelectedLexicon) -> list[str]:
    terms = [keyword for keyword in selected.keywords if contains(jd_text, keyword) or synonym_matches(jd_text, keyword, selected.synonyms)]
    expanded = [item for term in terms for item in [term, *selected.synonyms.get(term, [])]]
    return unique(expanded)[:36]


def matched_keywords(text: str, keywords: list[str], synonyms: dict[str, list[str]]) -> list[str]:
    return [keyword for keyword in keywords if contains(text, keyword) or synonym_matches(text, keyword, synonyms)]


def missing_keywords(text: str, keywords: list[str], synonyms: dict[str, list[str]]) -> list[str]:
    return [keyword for keyword in keywords if not contains(text, keyword) and not synonym_matches(text, keyword, synonyms)]


def score_evidence_chain(text: str, selected: SelectedLexicon) -> tuple[int, dict[str, list[str]], bool]:
    matched_by_category = {
        category: unique([term for term in terms if contains(text, term)])
        for category, terms in selected.evidence_lexicon.items()
    }
    coverage = len([items for items in matched_by_category.values() if items])
    has_chain = bool(matched_by_category.get("action")) and bool(matched_by_category.get("object")) and bool(
        matched_by_category.get("method") or matched_by_category.get("output") or matched_by_category.get("metric")
    )
    rich_bonus = 18 if has_chain else 0
    numeric_bonus = 12 if any(ch.isdigit() for ch in text) or "%" in text else 0
    density = min(22, sum(min(len(items), 5) for items in matched_by_category.values()) * 2)
    score = clamp(34 + coverage * 7 + density + rich_bonus + numeric_bonus)
    return score, matched_by_category, has_chain


def find_risk_markers(text: str, selected: SelectedLexicon) -> list[str]:
    return [term for term in selected.risk_markers if contains(text, term)]


def score_domain(text: str, domain: dict[str, Any]) -> int:
    return (
        len([term for term in domain["jobAliases"] if contains(text, term)]) * 5
        + len([term for term in domain["coreSkills"] if contains(text, term)]) * 3
        + len([term for term in domain["tools"] if contains(text, term)]) * 2
        + len([term for values in domain["synonyms"].values() for term in values if contains(text, term)]) * 2
    )


def merge_evidence_lexicon(domains: list[dict[str, Any]]) -> dict[str, list[str]]:
    return {
        "action": unique([*EVIDENCE_LEXICON["action"], *[term for domain in domains for term in domain["actionVerbs"]]]),
        "object": EVIDENCE_LEXICON["object"],
        "method": EVIDENCE_LEXICON["method"],
        "output": EVIDENCE_LEXICON["output"],
        "metric": unique([*EVIDENCE_LEXICON["metric"], *[term for domain in domains for term in domain["evidenceMarkers"]]]),
    }


def merge_synonyms(domains: list[dict[str, Any]]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for domain in domains:
        for key, values in domain["synonyms"].items():
            result[key] = unique([*result.get(key, []), *values])
            for value in values:
                result[value] = unique([*result.get(value, []), key, *[item for item in values if item != value]])
    return result


def synonym_matches(text: str, keyword: str, synonyms: dict[str, list[str]]) -> bool:
    return any(contains(text, term) for term in synonyms.get(keyword, []))


def clamp(value: float, minimum: int = 0, maximum: int = 100) -> int:
    return min(maximum, max(minimum, round(value)))
