# BiasBreaker Career 破偏求职
## 面向算法弱势求职者的 AI 求职反霸凌助手设计文档

> 参赛赛道：AI + 求职  
> 产品类型：AI 求职辅助 Web Demo / 产品原型  
> 核心定位：面向大学生与算法弱势求职者的 AI 求职反误读助手  
> 核心技术：JD 解析 + ATS-like 简历误读检测 + mimo-v2.5-pro 反误读优化生成 + 人工复核话术生成  
> Demo 目标：完成“岗位 JD 输入 → 简历上传/粘贴 → 算法误读风险检测 → 反误读优化建议 → 人工复核话术生成”的完整闭环。

---

# 1. 项目背景

AI 正在深度介入招聘流程。越来越多企业在简历筛选、岗位匹配、在线测评、AI 面试等环节引入自动化工具，以提升招聘效率。但对大学生求职者而言，AI 招聘并不一定天然公平。

许多求职者并不是能力不足，而是没有把真实能力表达成招聘系统能够识别的语言。例如：

- 简历中有校园项目、社团、竞赛、科研、公益经历，但没有转化为岗位关键词；
- 实际具备数据分析、内容运营、用户研究、项目协作能力，却被简历系统识别为“不相关”；
- 跨专业、转型、空窗、非标准经历被算法误读为稳定性不足或岗位匹配度低；
- 特殊群体求职者，例如视障、听障、神经多样性、慢病/精神健康群体，在 AI 招聘中更容易遇到信息不可访问、身份被误读、经历被低估等问题；
- 被系统秒拒后，求职者通常无法知道自己被拒的真正原因，也不知道如何优化或请求人工复核。

因此，本项目提出 **BiasBreaker Career 破偏求职**：一款面向算法弱势求职者的 AI 求职反霸凌助手。它不是普通简历润色工具，而是帮助求职者在投递前看见“算法可能如何误读自己”，并将真实经历转化为机器和 HR 都能理解的能力表达。

---

# 2. 赛道适配说明

## 2.1 参赛赛道

本项目参加 **AI + 求职** 赛道。

赛道关注大学生求职全流程，包括职业规划、简历准备、岗位投递、面试准备等核心痛点，要求作品借助 AI 技术提升求职效率与体验，并兼具落地性与创意性。

## 2.2 本项目与赛道要求的对应关系

| 赛道要求 | 本项目对应设计 |
|---|---|
| 聚焦大学生求职全流程 | 覆盖岗位理解、简历检测、投递优化、面试解释、人工复核 |
| 解决规划无方向 | 通过 JD 解析帮助用户理解岗位能力要求和适配方向 |
| 解决简历无头绪 | 通过 ATS-like 检测发现关键词、证据链、结构问题 |
| 解决投递无回复 | 输出可能被 AI/ATS 误读的风险与人工复核话术 |
| 借助 AI 技术提升体验 | 使用 mimo-v2.5-pro 生成解释性优化建议 |
| 具备落地性 | 初赛阶段可实现轻量 Web Demo，不依赖真实招聘平台接口 |
| 具备创意性 | 将“算法霸凌/算法误读/系统性拒绝”转化为可操作产品功能 |

---

# 3. 产品定位

## 3.1 产品名称

**BiasBreaker Career 破偏求职**

## 3.2 副标题

**面向算法弱势求职者的 AI 求职反霸凌助手**

## 3.3 Slogan

**让每一份真实能力，被算法和 HR 正确看见。**

## 3.4 一句话简介

BiasBreaker Career 通过岗位 JD 解析、ATS-like 简历误读检测、反误读优化建议和人工复核话术生成，帮助大学生与算法弱势求职者在投递前识别简历被 AI/ATS 误读的风险，并生成可解释、可验证、可优化、可申诉的求职材料。

## 3.5 产品不是做什么

本产品不是：

- 简单的 AI 简历润色工具；
- 帮用户夸大或编造经历的包装工具；
- 招聘企业风控工具；
- 真实 ATS 系统逆向工程工具；
- 自动海投工具；
- 求职骗局识别工具。

本产品真正做的是：

> 帮助求职者理解岗位要求、识别算法误读风险、修正表达偏差，并为必要时的人工复核提供专业话术。

---

# 4. 核心概念定义

## 4.1 算法弱势求职者

“算法弱势求职者”指在 AI 招聘或自动化简历筛选中，由于经历、表达方式、身份背景、技术条件或数字素养等原因，更容易被算法误读、低估或过滤的求职者。

典型包括：

1. 普通大学生中简历表达能力弱、投递长期无反馈的人；
2. 跨专业、职业转型、非线性成长路径的求职者；
3. 实习少但有竞赛、科研、社团、公益、校园项目经历的人；
4. 视障、听障、神经多样性、慢病/精神健康等特殊群体；
5. 低数字素养、不了解 ATS/AI 招聘逻辑的求职者；
6. 长期失业、空窗期较长或照护责任较重的人。

## 4.2 算法霸凌

在本项目中，“算法霸凌”不是指某个算法有主观恶意，而是指自动化招聘系统在不透明、不可解释、难申诉的情况下，对特定求职者形成持续性、结构性不利影响。

表现包括：

- 系统秒拒但不给原因；
- 简历被关键词筛选低估；
- 非标准经历被判定为不相关；
- 身份、空窗、残障相关经历被错误解读；
- 多个企业使用相似筛选逻辑，导致求职者被连续性拒绝；
- 求职者无法知道如何修正，也无法触达人工复核。

## 4.3 反误读

“反误读”不是欺骗算法，而是帮助用户将真实经历转化为更清晰、更结构化、更能被岗位和招聘系统理解的能力表达。

---

# 5. 目标用户

## 5.1 核心用户

### 用户 A：普通大学生求职者

特征：

- 投递实习或校招岗位；
- 有校园项目、课程项目、比赛、社团经历；
- 简历写法偏流水账；
- 不懂 ATS、关键词、岗位能力转译；
- 经常投递无回复。

需求：

- 看懂岗位 JD；
- 知道简历缺什么；
- 把校园经历转化为岗位能力；
- 提升投递成功率。

### 用户 B：跨专业或转型求职者

特征：

- 专业背景与目标岗位不完全一致；
- 具备可迁移能力，但表达不清；
- 容易被算法判定为“不匹配”。

需求：

- 提取可迁移能力；
- 建立岗位能力证据链；
- 降低“专业不相关”的算法误读。

### 用户 C：特殊群体求职者

特征：

- 包括视障、听障、神经多样性、慢病/精神健康等群体；
- 可能拥有非标准经历；
- 对招聘系统可访问性和人工复核需求更强。

需求：

- 降低身份或经历被误读的风险；
- 获得更友好的表达建议；
- 生成无障碍便利申请或人工复核话术。

---

# 6. 核心用户场景

## 6.1 场景一：投递前简历预检

用户准备投递某岗位，但不确定自己的简历是否符合 JD。系统帮助用户检测：

- 岗位关键词是否覆盖；
- 经历是否有证据支撑；
- 简历格式是否适合 ATS 解析；
- 是否存在非标准经历误读风险。

## 6.2 场景二：投递长期无回复后的复盘

用户投递多个岗位没有反馈。系统帮助用户分析：

- 是岗位方向不匹配，还是表达方式不匹配；
- 哪些经历没有被转译成岗位能力；
- 是否需要补充人工复核话术。

## 6.3 场景三：特殊群体求职表达优化

特殊群体求职者需要在真实、不夸大的前提下表达能力。系统帮助用户：

- 将公益/无障碍/社群经历转化为能力语言；
- 避免身份被标签化；
- 生成尊重、中性、能力导向的说明文本。

## 6.4 场景四：面试前解释非标准经历

用户进入面试后，需要解释跨专业、空窗、非标准项目、特殊经历。系统生成：

- 面试解释话术；
- 经历与岗位能力之间的连接；
- 不卑不亢的表达策略。

---

# 7. 产品主流程

## 7.1 主流程

```text
进入首页
→ 输入岗位 JD
→ 系统解析岗位要求
→ 上传或粘贴简历
→ 系统执行 ATS-like 简历误读检测
→ 输出风险报告
→ 调用 mimo-v2.5-pro 生成反误读优化建议
→ 展示优化前后对比
→ 生成人工复核/补充说明/面试解释话术
→ 用户复制或导出结果
```

## 7.2 Demo 必须闭环

初赛 Demo 只需要完整实现一个闭环，不需要做大而全平台：

```text
岗位 JD 输入
→ 简历输入
→ 风险检测
→ AI 优化
→ 复核话术
```

---

# 8. 功能模块设计

---

## 8.1 模块一：首页与产品引导

### 功能目标

让评委和用户快速理解产品定位、目标用户和使用流程。

### 页面内容

1. 产品名称：BiasBreaker Career 破偏求职；
2. 副标题：面向算法弱势求职者的 AI 求职反霸凌助手；
3. Slogan：让每一份真实能力，被算法和 HR 正确看见；
4. 核心流程展示：
   - JD 解析；
   - 简历误读检测；
   - 反误读优化；
   - 人工复核话术；
5. “开始检测”按钮；

### 首页主文案

```text
AI 招聘时代，很多求职者不是能力不够，而是被算法误读了。
BiasBreaker Career 帮你在投递前看见 ATS/AI 可能如何理解你的简历，并把真实经历转化为岗位和 HR 都能读懂的能力表达。
```

---

## 8.2 模块二：岗位 JD 解析

### 功能目标

从岗位 JD 中提取显性要求、隐性要求、关键词和潜在门槛。

### 用户输入

- 岗位名称；
- 岗位 JD 文本；
- 可选：岗位方向，例如运营、产品、市场、技术、HR、用户研究等。

### 系统输出

```json
{
  "job_title": "用户增长实习生",
  "hard_requirements": ["Excel", "数据分析", "用户调研", "内容运营"],
  "soft_requirements": ["沟通能力", "执行力", "学习能力"],
  "preferred_requirements": ["小红书运营", "AI 产品理解", "校园推广经验"],
  "ats_keywords": [
    {"keyword": "用户增长", "weight": 0.95, "category": "core"},
    {"keyword": "数据分析", "weight": 0.90, "category": "core"},
    {"keyword": "内容运营", "weight": 0.85, "category": "core"},
    {"keyword": "小红书", "weight": 0.70, "category": "bonus"}
  ],
  "hidden_barriers": [
    {
      "phrase": "快节奏",
      "risk": "可能暗含高强度工作要求",
      "level": "medium"
    },
    {
      "phrase": "强沟通",
      "risk": "可能对言语障碍、社交差异或神经多样性群体形成隐性门槛",
      "level": "medium"
    }
  ]
}
```

### 技术实现

#### 规则词典

维护岗位关键词词典：

```json
{
  "运营": ["用户增长", "内容运营", "社群运营", "投放复盘", "小红书", "数据分析"],
  "产品": ["需求分析", "竞品分析", "PRD", "用户调研", "原型设计"],
  "市场": ["品牌传播", "营销策划", "渠道投放", "活动执行"],
  "用户研究": ["问卷调研", "访谈", "样本分析", "洞察提炼", "研究报告"]
}
```

维护隐性风险词典：

```json
{
  "快节奏": "可能暗含高强度工作要求",
  "高强度": "可能暗含加班或压力要求",
  "抗压能力强": "可能暗含高压环境",
  "形象气质佳": "可能存在非能力相关筛选风险",
  "能接受出差": "可能对部分身体条件或照护责任者形成限制"
}
```

#### LLM 结构化抽取

使用 mimo-v2.5-pro 对 JD 做结构化解析。建议规则优先，LLM 补充解释。

---

## 8.3 模块三：简历解析

### 功能目标

将用户简历转为结构化数据，便于后续评分与检测。

### 用户输入

初赛建议支持两种输入：

1. 粘贴简历文本；
2. 上传 PDF/DOCX 文件。

### 系统输出

```json
{
  "basic_info": {
    "name": "张三",
    "email": "example@email.com",
    "phone": "13800000000"
  },
  "education": [
    {
      "school": "中山大学",
      "major": "管理科学与工程",
      "degree": "硕士",
      "period": "2024-2027"
    }
  ],
  "experiences": [
    {
      "type": "project",
      "title": "校园 AI 产品传播项目",
      "description": "负责小红书内容选题、用户反馈整理和投放复盘",
      "period": "2025.03-2025.06"
    }
  ],
  "skills": ["Excel", "Python", "问卷调研", "内容运营"]
}
```

### 技术实现

- PDF 解析：`pdfplumber` 或 `PyMuPDF`
- DOCX 解析：`python-docx`
- 文本清洗：正则表达式；
- 字段抽取：规则 + mimo-v2.5-pro；
- 初赛优先保证“粘贴文本”稳定可用，文件上传作为增强功能。

---

## 8.4 模块四：ATS-like 简历误读检测

### 功能目标

模拟自动化简历筛选的常见逻辑，输出简历可能被系统误读、低估或过滤的风险。

注意：

> 本模块不是复刻真实 ATS，也不是承诺预测真实企业筛选结果，而是构建一个可解释的 ATS-like 风险模拟器。

### 总分公式

```text
ATS-like 匹配分 =
关键词覆盖分 35%
+ 语义匹配分 25%
+ 经历证据分 20%
+ 结构可读性分 10%
- 风险扣分 10%
```

最终输出 0-100 分。

---

### 8.4.1 关键词覆盖分

判断 JD 核心关键词是否出现在简历中。

#### 示例

JD 核心关键词：

```text
用户增长、数据分析、内容运营、小红书、投放复盘、用户调研
```

简历命中：

```text
数据分析、小红书、用户调研
```

输出：

```json
{
  "keyword_coverage": 0.50,
  "matched_keywords": ["数据分析", "小红书", "用户调研"],
  "missing_keywords": ["用户增长", "内容运营", "投放复盘"]
}
```

#### 计算逻辑

```python
keyword_score = matched_keyword_weight_sum / total_keyword_weight_sum
```

---

### 8.4.2 语义匹配分

有些用户没有直接写岗位关键词，但经历语义相关。例如没写“用户增长”，但写了“分析小红书笔记表现并优化选题”。这类情况需要语义匹配。

#### 技术路线

```text
JD 要求句子 → Embedding
简历经历句子 → Embedding
计算 cosine similarity
```

#### 推荐模型

- `bge-small-zh`
- `m3e-base`
- `text2vec-base-chinese`

如果开发时间紧，可先用 mimo-v2.5-pro 做语义匹配解释，后续再接 Embedding。

#### 输出示例

```json
{
  "semantic_matches": [
    {
      "requirement": "具备用户增长或内容运营经验",
      "resume_evidence": "负责小红书内容选题和数据整理",
      "similarity": 0.81,
      "match_level": "强相关"
    }
  ]
}
```

---

### 8.4.3 经历证据分

判断简历是否只是空泛表述，还是有明确证据链。

#### 证据等级

| 等级 | 判断标准 | 示例 |
|---|---|---|
| 0 | 未提及相关能力 | 没有数据分析经历 |
| 1 | 只有空泛词 | 熟悉数据分析 |
| 2 | 有任务描述 | 使用 Excel 整理问卷数据 |
| 3 | 有方法 + 对象 + 结果 | 分析 500 份问卷，输出用户画像并支持运营策略 |

#### 输出示例

```json
{
  "evidence_strength": "中",
  "weak_evidence_items": [
    {
      "skill": "数据分析",
      "current_expression": "熟悉数据分析",
      "problem": "缺少具体任务、方法、对象或结果"
    }
  ]
}
```

---

### 8.4.4 结构可读性分

检测简历是否适合 ATS 读取。

#### 风险项

- 文本抽取为空或过少；
- 文件大量依赖图片；
- 表格或双栏过多；
- 联系方式缺失；
- 教育经历缺失；
- 技能区缺失；
- 时间线混乱；
- 经历标题不清楚。

#### 输出示例

```json
{
  "parse_risk": "中",
  "structure_issues": [
    "简历缺少明确技能区",
    "项目经历标题不清晰",
    "部分经历缺少时间信息"
  ]
}
```

---

### 8.4.5 算法误读风险标签

系统生成以下风险标签：

| 风险标签 | 说明 |
|---|---|
| 关键词缺失风险 | 真实能力存在，但没有使用岗位关键词 |
| 非标准经历误读风险 | 社团、公益、科研、比赛、照护、残障相关经历没有转译为能力语言 |
| 空窗期误读风险 | 时间线断裂，没有说明原因或补充学习经历 |
| 身份/障碍误读风险 | 特殊经历被负面理解，未突出可迁移能力 |
| AI 模板化风险 | 文本过度空泛，缺少真实证据 |
| ATS 解析风险 | 文件或排版不利于机器读取 |
| 岗位隐性门槛风险 | JD 存在可能排斥特殊群体的模糊要求 |

#### 总输出示例

```json
{
  "ats_like_score": 68,
  "keyword_coverage": "56%",
  "semantic_match": "72%",
  "evidence_strength": "中",
  "parse_risk": "高",
  "risk_tags": [
    {
      "type": "非标准经历误读风险",
      "severity": "高",
      "reason": "你的公益/社群经历没有转译为岗位能力语言。",
      "suggestion": "建议补充用户沟通、活动协调、数据反馈等能力证据。"
    },
    {
      "type": "关键词缺失风险",
      "severity": "中",
      "reason": "你具备内容运营经历，但没有出现 JD 中的“用户增长”和“投放复盘”。",
      "suggestion": "建议在真实经历基础上补充相关岗位关键词。"
    }
  ]
}
```

---

## 8.5 模块五：mimo-v2.5-pro 反误读优化建议

### 功能目标

调用 mimo-v2.5-pro，根据 JD、原始简历和 ATS-like 风险分析，生成可解释的反误读优化建议。

### 模型定位

mimo-v2.5-pro 在本项目中不是“简历润色器”，而是：

> 反误读解释与改写引擎。

它需要完成：

1. 解释简历可能被误读的原因；
2. 给出真实、不夸大的改写建议；
3. 输出保守真实版、ATS 友好版、HR 可读版；
4. 生成人工复核话术；
5. 生成面试解释建议；
6. 提醒用户哪些事情不要做。

### 系统 Prompt

```text
你是 BiasBreaker Career 的 AI 求职反误读助手。
你的任务不是夸大、编造或美化经历，而是帮助用户将真实经历转写为招聘系统和 HR 都能理解的能力表达。

你必须遵守：
1. 不得虚构学校、公司、岗位、证书、数据、项目结果或工作经历。
2. 不得建议用户隐藏、伪造或歧视性使用身份信息。
3. 对残障、慢病、空窗、转型、非典型经历保持中性、尊重和能力导向。
4. 所有建议必须基于用户原始经历和岗位 JD。
5. 输出必须解释“为什么可能被误读”和“如何降低误读”。
6. 输出内容要适合大学生求职场景，语言专业、真诚、不过度包装。
7. 请严格输出 JSON，不要输出 Markdown。
```

### 用户 Prompt 模板

```text
请基于以下岗位 JD、用户简历和 ATS-like 风险分析，生成反误读优化建议。

【岗位 JD】
{job_description}

【用户简历】
{resume_text}

【系统检测结果】
ATS-like 匹配分：{ats_score}
关键词缺失：{missing_keywords}
语义匹配较弱项：{weak_semantic_matches}
经历证据不足项：{weak_evidence}
格式/解析风险：{parse_risks}
潜在算法误读风险：{misread_risks}

请严格输出 JSON，字段如下：
{
  "summary": "总体判断",
  "top_misread_points": [
    {
      "risk": "风险名称",
      "explanation": "为什么可能被误读",
      "priority": "high / medium / low"
    }
  ],
  "rewrite_suggestions": [
    {
      "original": "原句",
      "problem": "问题",
      "conservative_version": "保守真实版",
      "ats_friendly_version": "ATS友好版",
      "hr_readable_version": "HR可读版",
      "reason": "改写理由"
    }
  ],
  "appeal_text": "人工复核或补充说明话术",
  "interview_explanation": "面试解释建议",
  "do_not_do": ["不建议做的事情"]
}
```

### 输出示例

```json
{
  "summary": "该简历具备内容运营和用户研究基础，但岗位关键词覆盖不足，部分校园项目经历未被转写为业务能力。",
  "top_misread_points": [
    {
      "risk": "关键词缺失风险",
      "explanation": "用户做过内容分析，但未使用 JD 中的“用户增长”“投放复盘”等关键词。",
      "priority": "high"
    }
  ],
  "rewrite_suggestions": [
    {
      "original": "负责小红书内容整理。",
      "problem": "表达过于笼统，缺少任务、方法和结果。",
      "conservative_version": "负责小红书平台内容整理与选题归纳，辅助团队进行账号运营。",
      "ats_friendly_version": "参与小红书内容运营与用户增长分析，整理平台内容数据，支持选题优化与投放复盘。",
      "hr_readable_version": "围绕小红书用户反馈和内容表现进行整理分析，将分散内容转化为可执行的选题建议，支持后续运营决策。",
      "reason": "补充岗位关键词，并将任务表达为可识别的运营能力。"
    }
  ],
  "appeal_text": "您好，我注意到我的申请可能未进入后续流程。由于我的部分经历属于非标准项目经验，可能未能被自动化筛选系统充分识别。如方便，烦请贵团队进行人工复核。",
  "interview_explanation": "如果面试官问到相关经历，可以重点说明你如何从内容数据中发现问题、形成建议并支持运营动作。",
  "do_not_do": [
    "不要虚构数据结果。",
    "不要为了匹配岗位而加入没有做过的技能。",
    "不要把所有经历都改成空泛的 AI 套话。"
  ]
}
```

---

## 8.6 模块六：风险报告可视化

### 功能目标

将复杂的 ATS-like 分析转化为用户能理解的投递前报告。

### 页面内容

1. ATS-like 总分；
2. 关键词覆盖率；
3. 语义匹配度；
4. 经历证据强度；
5. 结构可读性；
6. 风险标签；
7. 缺失关键词；
8. 优化优先级；
9. 投递建议。

### 示例文案

```text
你的当前简历 ATS-like 匹配分为 68/100。
主要风险不是能力不足，而是表达方式可能被算法误读：

1. 岗位关键词覆盖不足；
2. 校园项目未转译为业务能力；
3. 经历证据缺少量化说明；
4. 简历部分结构不利于 ATS 解析。
```

---

## 8.7 模块七：人工复核/补充说明话术生成

### 功能目标

当用户担心被系统秒拒、投递无反馈或需要解释非标准经历时，生成专业、礼貌、不过度对抗的沟通文本。

### 输出类型

1. 人工复核请求邮件；
2. 补充材料说明；
3. 无障碍便利申请；
4. 面试解释话术；
5. 内推私信模板。

### 示例输出

```text
您好，我是刚刚投递贵司【用户增长实习生】岗位的候选人。由于我的部分经历属于校园项目和跨领域实践，可能无法完全通过自动化筛选系统呈现其相关性。为便于贵团队更全面地评估，我补充说明：我曾围绕小红书内容表现进行数据整理与选题复盘，具备内容运营、用户反馈分析和项目协同经验。若方便，烦请进行人工复核。感谢您的时间。
```

---

# 9. 页面结构设计

## 9.1 页面一：首页

路径：

```text
/
```

内容：

- 产品名称；
- 核心定位；
- 使用流程；
- 目标用户；
- 开始检测按钮；
- 示例体验按钮。

## 9.2 页面二：JD 输入页

路径：

```text
/jd
```

组件：

- 岗位名称输入框；
- JD 文本输入框；
- 岗位方向选择；
- 示例 JD 填充按钮；
- 开始解析按钮。

## 9.3 页面三：简历输入页

路径：

```text
/resume
```

组件：

- 简历文本输入框；
- PDF/DOCX 上传按钮；
- 示例简历填充按钮；
- 隐私提示；
- 开始检测按钮。

## 9.4 页面四：风险报告页

路径：

```text
/report
```

组件：

- 总分卡片；
- 雷达图/进度条；
- 关键词覆盖面板；
- 缺失关键词；
- 风险标签列表；
- 结构问题；
- 生成优化建议按钮。

## 9.5 页面五：优化建议页

路径：

```text
/advice
```

组件：

- 总体判断；
- 三大误读风险；
- 改写建议表格；
- 三种版本对比；
- 人工复核话术；
- 面试解释建议；
- 一键复制按钮。

---

# 10. 技术架构

## 10.1 推荐技术栈

### 前端

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts 或 ECharts

### 后端

- FastAPI
- Python 3.10+
- Pydantic
- Uvicorn

### 文档解析

- `pdfplumber`
- `PyMuPDF`
- `python-docx`

### NLP / 匹配

- 关键词词典；
- 正则表达式；
- 可选 Embedding：
  - `bge-small-zh`
  - `m3e-base`
  - `text2vec-base-chinese`

### 大模型

- mimo-v2.5-pro

### 数据存储

初赛阶段可不做数据库。

可选：

- LocalStorage 保存前端状态；
- 后端 JSON 文件保存示例；
- SQLite 保存历史记录。

---

## 10.2 系统架构图

```text
┌──────────────────────────┐
│        Frontend Web       │
│ Next.js + TS + Tailwind   │
└────────────┬─────────────┘
             │ HTTP API
             ▼
┌──────────────────────────┐
│        Backend API        │
│     FastAPI + Pydantic    │
└────────────┬─────────────┘
             │
             ├── JD Analyzer
             │   ├── Keyword Dict
             │   └── mimo-v2.5-pro Structured Extraction
             │
             ├── Resume Parser
             │   ├── Text / PDF / DOCX
             │   └── Resume Structuring
             │
             ├── ATS-like Simulator
             │   ├── Keyword Coverage
             │   ├── Semantic Match
             │   ├── Evidence Strength
             │   ├── Structure Readability
             │   └── Misread Risk Tags
             │
             ├── Mimo Advice Generator
             │   ├── Anti-misread Rewrite
             │   ├── Appeal Text
             │   └── Interview Explanation
             │
             ▼
┌──────────────────────────┐
│      Report & Advice      │
│ Score / Risk / Rewrite    │
└──────────────────────────┘
```

---

# 11. API 设计

## 11.1 JD 解析接口

```http
POST /api/analyze-jd
```

请求：

```json
{
  "job_title": "用户增长实习生",
  "job_description": "岗位 JD 文本...",
  "job_category": "运营"
}
```

响应：

```json
{
  "job_title": "用户增长实习生",
  "hard_requirements": [],
  "soft_requirements": [],
  "preferred_requirements": [],
  "ats_keywords": [],
  "hidden_barriers": []
}
```

---

## 11.2 简历解析接口

```http
POST /api/parse-resume
```

文本请求：

```json
{
  "resume_text": "简历文本..."
}
```

响应：

```json
{
  "basic_info": {},
  "education": [],
  "experiences": [],
  "skills": [],
  "raw_text": "..."
}
```

文件上传可选接口：

```http
POST /api/upload-resume
Content-Type: multipart/form-data
```

---

## 11.3 ATS-like 风险检测接口

```http
POST /api/analyze-risk
```

请求：

```json
{
  "jd_analysis": {},
  "resume_analysis": {},
  "resume_text": "原始简历文本"
}
```

响应：

```json
{
  "ats_like_score": 68,
  "keyword_coverage": "56%",
  "semantic_match": "72%",
  "evidence_strength": "中",
  "parse_risk": "高",
  "matched_keywords": [],
  "missing_keywords": [],
  "risk_tags": [],
  "structure_issues": [],
  "weak_evidence_items": []
}
```

---

## 11.4 反误读优化接口

```http
POST /api/generate-advice
```

请求：

```json
{
  "job_description": "岗位 JD",
  "resume_text": "简历文本",
  "risk_analysis": {}
}
```

响应：

```json
{
  "summary": "",
  "top_misread_points": [],
  "rewrite_suggestions": [],
  "appeal_text": "",
  "interview_explanation": "",
  "do_not_do": []
}
```

---

# 12. 推荐项目目录结构

```text
biasbreaker-career/
├── README.md
├── .env.example
├── package.json
├── next.config.js
├── app/
│   ├── page.tsx
│   ├── jd/
│   │   └── page.tsx
│   ├── resume/
│   │   └── page.tsx
│   ├── report/
│   │   └── page.tsx
│   └── advice/
│       └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── Stepper.tsx
│   ├── ScoreCard.tsx
│   ├── RiskTag.tsx
│   ├── KeywordPanel.tsx
│   ├── RewriteTable.tsx
│   ├── AppealCard.tsx
│   └── CopyButton.tsx
├── lib/
│   ├── api.ts
│   ├── types.ts
│   └── mockData.ts
├── backend/
│   ├── main.py
│   ├── schemas.py
│   ├── services/
│   │   ├── jd_analyzer.py
│   │   ├── resume_parser.py
│   │   ├── ats_simulator.py
│   │   ├── mimo_client.py
│   │   └── prompt_templates.py
│   ├── data/
│   │   ├── keyword_dict.json
│   │   ├── risk_word_dict.json
│   │   └── demo_samples.json
│   └── requirements.txt
└── docs/
    ├── product_design.md
    ├── demo_script.md
    └── submission_outline.md
```

---

# 13. 核心算法伪代码

## 13.1 ATS-like 总分计算

```python
def calculate_ats_score(jd_analysis, resume_analysis, resume_text):
    keyword_score = calculate_keyword_coverage(
        jd_analysis["ats_keywords"],
        resume_text
    )

    semantic_score = calculate_semantic_match(
        jd_analysis["hard_requirements"],
        resume_analysis["experiences"]
    )

    evidence_score = calculate_evidence_strength(
        resume_analysis["experiences"]
    )

    structure_score = calculate_structure_readability(
        resume_text,
        resume_analysis
    )

    risk_penalty = calculate_risk_penalty(
        jd_analysis,
        resume_analysis,
        resume_text
    )

    total_score = (
        keyword_score * 35 +
        semantic_score * 25 +
        evidence_score * 20 +
        structure_score * 10 -
        risk_penalty * 10
    )

    return max(0, min(100, round(total_score)))
```

## 13.2 关键词覆盖计算

```python
def calculate_keyword_coverage(ats_keywords, resume_text):
    total_weight = sum(item["weight"] for item in ats_keywords)
    matched_weight = 0
    matched_keywords = []
    missing_keywords = []

    for item in ats_keywords:
        keyword = item["keyword"]
        if keyword.lower() in resume_text.lower():
            matched_weight += item["weight"]
            matched_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)

    score = matched_weight / total_weight if total_weight > 0 else 0

    return {
        "score": score,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords
    }
```

## 13.3 风险标签生成

```python
def generate_risk_tags(jd_analysis, resume_analysis, resume_text):
    risks = []

    missing_keywords = find_missing_keywords(jd_analysis, resume_text)
    if len(missing_keywords) >= 3:
        risks.append({
            "type": "关键词缺失风险",
            "severity": "高",
            "reason": "简历缺少多个岗位核心关键词，可能被 ATS 低估匹配度。",
            "suggestion": "在真实经历基础上补充岗位关键词和能力证据。"
        })

    if has_non_standard_experience(resume_analysis):
        risks.append({
            "type": "非标准经历误读风险",
            "severity": "中",
            "reason": "部分校园/公益/比赛经历没有转译为岗位能力语言。",
            "suggestion": "将经历改写为任务、方法、结果和能力。"
        })

    if has_timeline_gap(resume_analysis):
        risks.append({
            "type": "空窗期误读风险",
            "severity": "中",
            "reason": "简历时间线存在断裂，可能被误判为稳定性不足。",
            "suggestion": "补充学习、项目、求职准备或照护责任等真实说明。"
        })

    return risks
```

---

# 14. mimo-v2.5-pro 接入设计

## 14.1 环境变量

```env
MIMO_API_KEY=your_mimo_api_key
MIMO_BASE_URL=https://api.example.com/v1
MIMO_MODEL=mimo-v2.5-pro
USE_MOCK_LLM=true
```

## 14.2 模型客户端封装

```python
class MimoClient:
    def __init__(self, api_key, base_url, model="mimo-v2.5-pro"):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model

    def generate(self, system_prompt: str, user_prompt: str) -> dict:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3
        }

        # requests.post(...)
        # return response.json()
```

## 14.3 Mock 模式

为了保证比赛 Demo 稳定，必须支持 Mock 模式：

```text
USE_MOCK_LLM=true
```

当无法调用真实 mimo-v2.5-pro API 时，系统返回内置示例优化建议，保证演示流程不断。

---

# 15. Demo 样例数据

## 15.1 示例 JD：用户增长实习生

```text
岗位职责：
1. 参与 AI 产品用户增长项目，负责内容选题、渠道数据整理和用户反馈分析；
2. 协助完成小红书、短视频、社群等平台内容洞察；
3. 参与增长数据复盘，输出阶段性报告；
4. 配合团队推进校园推广和用户调研。

岗位要求：
1. 对 AI 产品、社交媒体、用户增长感兴趣；
2. 熟悉 Excel、腾讯文档等基础数据工具；
3. 具备内容运营、校园推广、账号运营或用户调研经验优先；
4. 具备较强沟通能力、执行力和抗压能力。
```

## 15.2 示例简历片段

```text
校园 AI 产品传播项目
负责小红书内容整理，参与活动策划，协助收集同学反馈。
参与校园推广活动，完成社群通知和用户沟通。
曾参与一次问卷调研，整理部分数据。
```

## 15.3 预期检测结果

```text
ATS-like 匹配分：62/100

主要风险：
1. 关键词缺失：缺少“用户增长”“投放复盘”“内容运营”等岗位词；
2. 经历证据不足：没有说明数据规模、分析方法和输出结果；
3. 非标准经历误读：校园活动经历没有转译为增长/运营能力；
4. JD 隐性门槛：强沟通、抗压能力等表述可能对部分群体形成隐性压力。
```

## 15.4 预期优化输出

```text
原句：
负责小红书内容整理，参与活动策划，协助收集同学反馈。

ATS 友好版：
参与小红书内容运营与用户增长分析，整理平台内容选题和用户反馈，支持活动传播策略优化与阶段性复盘。

HR 可读版：
围绕校园 AI 产品传播场景，负责小红书内容整理、用户反馈收集和活动协同，将分散反馈转化为后续选题和推广优化建议。
```

---

# 16. UI 风格建议

## 16.1 视觉关键词

- 专业；
- 可信赖；
- 温和；
- 科技感；
- 公平就业；
- 不要过度娱乐化；
- 不要过度医疗化或公益化。

## 16.2 推荐配色

- 主色：深蓝 / 靛蓝；
- 辅色：青绿色；
- 风险色：橙色；
- 安全色：绿色；
- 背景：浅灰白；
- 卡片：白色圆角。

## 16.3 页面风格

类似 AI SaaS 产品控制台：

- 顶部导航；
- 左右分栏；
- 卡片式报告；
- 标签化风险展示；
- 分数仪表盘；
- 优化前后对比表格；
- 一键复制按钮。

---

# 17. 无障碍与隐私设计

## 17.1 无障碍设计

初赛阶段建议实现：

1. 清晰的标题层级；
2. 表单 label 完整；
3. 按钮可键盘操作；
4. 颜色对比度足够；
5. 风险信息不只依赖颜色表达；
6. 支持较大字号；
7. 输出结果可复制为纯文本。

## 17.2 隐私设计

1. 默认不保存用户简历；
2. 页面提示用户不要上传身份证号、家庭住址等敏感信息；
3. Mock 模式下所有数据在本地示例中运行；
4. 如果调用大模型 API，需要提示用户文本会被发送至模型服务；
5. 后续正式产品需加入数据脱敏与用户授权机制。

---

# 18. 伦理边界

系统必须坚持以下原则：

1. 不编造经历；
2. 不伪造数据；
3. 不建议用户隐藏或歧视性包装身份；
4. 不承诺一定通过筛选；
5. 不声称能破解真实企业 ATS；
6. 不把特殊群体经历污名化；
7. 不鼓励对抗企业，而是提供专业、合理的人工复核路径。

推荐产品提示语：

```text
本工具提供的是投递前表达优化与风险提示，不代表真实企业筛选结果。所有优化建议应基于你的真实经历，请勿虚构项目、数据或证书。
```

---

# 19. 初赛开发范围

## 19.1 P0 必做

1. 首页；
2. JD 输入页；
3. 简历输入页；
4. JD 关键词解析；
5. ATS-like 风险检测；
6. 风险报告展示；
7. mimo-v2.5-pro 或 Mock LLM 生成优化建议；
8. 人工复核话术；
9. 一键复制。

## 19.2 P1 建议完成

1. PDF/DOCX 上传；
2. 图表可视化；
3. 示例数据一键填充；
4. 优化前后对比表；
5. 隐私提示；
6. 无障碍基础优化。

## 19.3 P2 加分项

1. PDF 报告导出；
2. 历史记录；
3. 多岗位批量比较；
4. 面试解释训练；
5. 无障碍模式；
6. 多类型用户模板。

---

# 20. README 运行说明草案

## 20.1 后端启动

```bash
cd backend
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 20.2 前端启动

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

---

# 21. 作品说明文档结构建议

比赛提交 PDF 可按以下结构写：

1. 作品简介；
2. 市场调研；
3. 用户痛点；
4. 方案介绍；
5. 核心功能及创新点；
6. 技术架构 / AI 能力及技术方案；
7. 应用场景；
8. 使用的模型；
9. 落地规划；
10. 商业化思考；
11. 隐私与伦理；
12. 总结。

---

# 22. 演示视频脚本建议

## 22.1 开头 20 秒

```text
在 AI 招聘时代，很多求职者不是能力不够，而是简历被算法误读了。
BiasBreaker Career 破偏求职，是一款面向算法弱势求职者的 AI 求职反霸凌助手。
```

## 22.2 产品演示 2-3 分钟

1. 进入首页；
2. 输入用户增长实习生 JD；
3. 系统解析岗位关键词和隐性门槛；
4. 粘贴一份普通大学生简历；
5. 系统输出 ATS-like 匹配分；
6. 展示关键词缺失和非标准经历误读风险；
7. 生成反误读优化建议；
8. 展示原句、问题、三种改写版本；
9. 生成人工复核话术。

## 22.3 结尾 20 秒

```text
BiasBreaker Career 不替用户编造经历，而是帮助他们把真实能力表达得更清楚。
它让求职者在被算法筛选前，先看见算法可能如何误读自己。
```

---

# 23. 商业化与落地思考

## 23.1 C 端

- 面向大学生提供免费基础检测；
- 高级报告、批量岗位匹配、面试解释训练可作为增值功能；
- 与简历模板、求职课程结合。

## 23.2 B 端

- 与高校就业中心合作；
- 与公益组织、残障就业机构合作；
- 与招聘平台合作，作为“投递前简历友好度检测”工具；
- 为企业提供候选人友好型招聘体验插件。

## 23.3 平台价值

对招聘平台而言，本项目可以：

1. 提升求职者简历质量；
2. 降低无效投递；
3. 增强公平就业形象；
4. 帮助识别不友好的 JD 表述；
5. 改善特殊群体和非标准求职者体验；
6. 形成“技术向善 + 求职效率”的双重价值。

---

# 24. 给 Codex Agent 的实现指令

请根据本文档实现一个轻量化 Web Demo。具体要求：

1. 使用 Next.js + TypeScript + Tailwind CSS 实现前端；
2. 使用 FastAPI 实现后端接口；
3. 页面至少包含：首页、JD 输入页、简历输入页、报告页、优化建议页；
4. 后端至少包含：JD 解析、简历解析、ATS-like 检测、mimo-v2.5-pro 调用四类服务；
5. 支持 Mock LLM 模式，保证没有 API key 时 Demo 仍可运行；
6. 所有模型输出必须返回结构化 JSON；
7. UI 风格要专业、可信赖、温和、有科技感；
8. 默认不需要登录注册；
9. 默认不保存用户简历；
10. 代码需要清晰注释；
11. README 中写明运行方式、环境变量、API key 配置方式和 Mock 模式切换方式；
12. 优先完成 P0 闭环，不要先做复杂功能；
13. 所有生成内容必须基于用户原始经历，不得虚构事实。

---

# 25. 最终交付物

初赛建议交付：

1. 可运行 Web Demo；
2. GitHub 仓库或代码压缩包；
3. 作品说明文档 PDF；
4. 3-5 分钟演示视频；
5. 技术架构图；
6. 产品流程图；
7. 示例 JD 与示例简历；
8. 原创声明及授权书。

---

# 26. 核心卖点总结

BiasBreaker Career 的关键创新不是“再做一个 AI 简历修改工具”，而是：

1. 从“简历润色”升级为“算法误读检测”；
2. 从“帮用户写得更好看”升级为“帮用户被正确理解”；
3. 从“个体求职效率”升级为“AI 招聘时代的求职公平”；
4. 从“一键生成”升级为“可解释、可验证、可优化、可申诉”；
5. 从普通大学生求职痛点出发，可扩展到特殊群体和非标准经历求职者。

最终表达：

> BiasBreaker Career 让求职者在被算法筛选前，先看见算法可能如何误读自己，并把真实能力转化为机器和 HR 都能理解的表达。
