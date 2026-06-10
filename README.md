<p align="center">
  <img src="public/logo.png" alt="BiasBreaker Career logo" width="96" />
</p>

<h1 align="center">BiasBreaker Career</h1>

<p align="center"><em>AI 求职反霸凌助手</em></p>

<p align="center">
  <a href="README.md">中文</a>
  ·
  <a href="README.en.md">English</a>
</p>

BiasBreaker Career 是一个**面向算法弱势求职者的 AI 求职反霸凌助手**。它关注的不是“把简历包装得更好看”，而是帮助大学生、转专业求职者、非名校背景求职者、经历表达不规范者等更容易被算法筛选误伤的人，看见招聘系统可能如何读取自己，并把真实经历转译成 ATS 与 HR 更容易理解的岗位语言。

在求职流程越来越依赖关键词检索、自动筛选和模型排序的背景下，很多候选人并不是能力不足，而是不知道算法在“看什么”。本项目希望把这种不透明的筛选压力拆解成可理解、可验证、可修改的证据链：用户输入目标岗位 JD，并上传或粘贴简历后，系统会从岗位能力匹配、ATS 可读性、经历证据强度和表达结构等维度生成分析报告，同时提供可追问的右侧上下文助手，帮助用户继续询问“先改哪里”“项目经历怎么写”“面试怎么解释”等问题。

项目定位不是替代 HR、承诺通过筛选，也不是制造迎合算法的虚假包装，而是帮助求职者识别潜在的算法误读、表达歧视和信息不对称风险，把已有经历更公平地呈现出来。

## 核心能力

- **面向算法弱势群体的求职风险解释**：把“为什么投递没回应”“为什么经历明明相关却不被识别”转化为可检查的关键词、结构和证据问题。
- **JD 驱动的岗位方向识别**：根据岗位标题、JD 关键词和能力描述，识别更接近的职业方向，减少候选人因岗位语言不熟悉而被动失分。
- **轻量中文校招职业能力词库**：内置运营、产品、技术、数据、市场、HR、设计、研究咨询等大学生高频方向能力词库，词库设计参考 O*NET、ESCO 与《中华人民共和国职业分类大典》的职业技能分类思路。
- **同义词展开与关键词覆盖分析**：把 JD 中的能力要求映射到词库和同义表达，降低只按字面匹配造成的误判。
- **证据链评分**：关注简历是否用项目、动作、方法、数据和结果支撑能力，而不只是堆关键词。
- **LLM 校准 + 规则兜底**：优先使用大模型对规则分析结果做有限幅度校准；模型不可用时仍可返回规则分析报告。
- **语义匹配信号**：可调用 embedding 模型计算 JD 与简历片段的语义相似度，辅助发现强证据和弱证据。
- **报告追问助手**：在分析报告弹窗右侧提供上下文聊天框，基于当前 JD、简历文本和分析报告回答用户追问。
- **历史报告管理**：分析结果会保存在浏览器本地，可查看、筛选、删除和导出 Markdown 报告。

## 快速开始

项目是一个单体 Next.js 应用，后端能力通过 Next.js API Routes 提供。

```powershell
cd C:\Files\Study\Codes\Contest\Zhilian-Zhaopin-AI-Contest\BiasBreaker-Career
npm install
Copy-Item .env.example .env.local
npm run dev
```

启动后访问：

```text
http://localhost:3000
```

如果暂时没有配置模型 API Key，项目仍然可以运行。系统会跳过 LLM 或 embedding 调用，使用内置规则分析逻辑生成报告。

## 环境变量

复制 `.env.example` 为 `.env.local` 后按需填写：

| 变量 | 作用 |
| --- | --- |
| `DEFAULT_LLM_PROVIDER` | LLM 提供方标识，默认示例为 `mimo` |
| `DEFAULT_LLM_MODEL` | 简历分析和追问助手使用的对话模型 |
| `MIMO_API_KEY` | LLM API Key |
| `MIMO_BASE_URL` | OpenAI-compatible LLM 接口地址 |
| `DEFAULT_EMBEDDING_PROVIDER` | Embedding 提供方标识，默认示例为 `hunyuan` |
| `DEFAULT_EMBEDDING_MODEL` | 语义匹配使用的 embedding 模型 |
| `HUNYUAN_API_KEY` | Embedding API Key |
| `HUNYUAN_BASE_URL` | OpenAI-compatible embedding 接口地址 |
| `MODEL_TIMEOUT_SECONDS` | LLM 请求超时时间 |
| `EMBEDDING_TIMEOUT_SECONDS` | Embedding 请求超时时间 |
| `PDFTOTEXT_PATH` | 可选。外部 `pdftotext` 可执行文件路径，用于提升 PDF 文本解析质量 |

## 使用流程

1. 进入首页，点击开始分析。
2. 输入目标岗位名称和 JD 文本。
3. 上传 PDF、DOCX、TXT、MD 简历，或直接粘贴简历文本。
4. 点击分析，系统生成评分、风险说明、维度雷达图、优先处理问题、原句风险与改写建议，帮助用户理解哪些地方可能被算法或人工筛选误读。
5. 在报告右侧使用“分析追问助手”继续提问。
6. 在历史记录页查看过往报告，或导出 Markdown 报告。

## 分析流程

```mermaid
flowchart LR
  A["用户输入 JD"] --> B["岗位方向识别"]
  C["上传/粘贴简历"] --> D["简历文本解析"]
  B --> E["加载职业能力词库"]
  E --> F["同义词展开"]
  D --> G["简历匹配"]
  F --> G
  G --> H["规则评分与证据链分析"]
  H --> I["Embedding 语义匹配（可选）"]
  H --> J["LLM 有界校准"]
  I -.-> J
  J --> K["分析报告"]
  K --> L["上下文追问助手"]
  K --> M["本地历史记录"]
```

说明：`规则评分与证据链分析 -> LLM 有界校准` 是主路径，因为规则分析会先产出稳定的基准报告；`Embedding 语义匹配` 是增强信号，用于辅助 LLM 判断 JD 与简历片段的语义接近度。这样设计的原因是 embedding 服务可能因为未配置 API Key、网络超时或模型不可用而失败，此时系统仍能基于规则分析和 LLM 校准继续返回报告；如果 embedding 可用，语义匹配结果会一并传入 LLM。

## 反霸凌分析维度

系统当前主要从四个维度拆解候选人可能面临的算法筛选风险：

| 维度 | 关注点 |
| --- | --- |
| 关键词覆盖 | 简历是否覆盖 JD 中的关键技能、工具、业务词和岗位能力要求，避免真实能力因表达不同而被漏检 |
| 结构清晰度 | 简历段落、项目描述、时间线和信息层级是否便于 ATS 与 HR 阅读，减少格式和层级带来的误伤 |
| 经历证据 | 是否有动作、方法、对象、结果和量化指标支撑能力表达，让非标准背景也能用证据证明能力 |
| 系统可读性 | 是否存在过度装饰、格式混乱、关键信息缺失等 ATS 读取风险 |

综合分并不是简单关键词命中率，而是结合岗位词库、同义词、风险标记、证据链和语义匹配信号形成的结果。

## 项目结构

```text
BiasBreaker-Career/
├── app/
│   ├── api/
│   │   ├── analyze/          # 简历分析 API
│   │   ├── chat/             # 报告追问助手 API
│   │   └── parse-resume/     # PDF/DOCX/TXT/MD 简历解析 API
│   ├── analyze/              # 简历分析页面
│   ├── history/              # 历史记录页面
│   ├── page.tsx              # 首页
│   └── globals.css           # 全局样式
├── components/
│   ├── AnalysisResultModal.tsx   # 分析报告弹窗
│   ├── ResumeChatAssistant.tsx   # 右侧上下文追问助手
│   ├── DimensionRadar.tsx        # 维度雷达图
│   └── AppNav.tsx                # 应用导航
├── data/
│   ├── career-lexicon.json       # 基础职业能力词库
│   ├── career-lexicon-extra.json # 扩展词库
│   └── career-lexicon-extra-2.json
├── lib/
│   ├── analysis.ts           # 规则评分、风险识别、建议生成
│   ├── lexicon.ts            # 词库加载、方向识别、同义词展开
│   ├── llm-analysis.ts       # LLM 分析校准
│   ├── semantic-analysis.ts  # Embedding 语义匹配
│   ├── model-provider.ts     # OpenAI-compatible 模型适配层
│   └── history.ts            # 浏览器本地历史记录
├── docs/                     # 产品设计文档与比赛资料
├── package.json
└── README.md
```

## 主要 API

### `POST /api/parse-resume`

解析用户上传的简历文件。

支持格式：

- PDF
- DOCX
- TXT
- MD

返回内容包括文件名、文件大小和提取出的文本。PDF 会优先尝试外部 `pdftotext`，失败后回退到 `pdfjs-dist`。

### `POST /api/analyze`

生成简历分析报告。

请求核心字段：

```json
{
  "jobTitle": "软件开发-后端开发方向",
  "jdText": "岗位 JD 文本",
  "resumeText": "简历文本"
}
```

处理逻辑：

1. 校验 JD 和简历文本。
2. 规范化岗位名称和输入文本。
3. 尝试生成语义匹配信号。
4. 尝试调用 LLM 做有界校准。
5. 如果模型调用失败，返回规则分析结果。

### `POST /api/chat`

用于分析报告右侧的追问助手。

请求核心字段：

```json
{
  "jobTitle": "目标岗位",
  "jdText": "JD 文本",
  "resumeText": "简历文本",
  "resumeFileName": "resume.pdf",
  "analysisResult": {},
  "messages": [
    { "role": "user", "content": "我最该先改哪三处？" }
  ]
}
```

助手只围绕当前 JD、简历和分析报告回答，不会编造经历、证书、学校、公司或项目成果。模型不可用时，会基于报告中的 findings、suggestions 和 reviewScripts 生成兜底回答。

## 本地历史与隐私说明

历史记录保存在浏览器 `localStorage` 中，键名为：

```text
biasbreaker-career-history
```

每条历史记录包含：

- 分析报告
- 候选人名称推断结果
- 目标岗位
- 分析时间
- 原始 JD 文本
- 原始简历文本
- 简历文件名

JD 和简历文本用于历史报告中的追问助手上下文，不会直接展示在报告弹窗里。当前项目没有数据库，也没有独立后端服务；若部署到公开环境，需要进一步补充用户授权、数据加密、清除机制和服务端存储策略。

## 技术栈

- **框架**：Next.js 15 App Router
- **语言**：TypeScript
- **UI**：React 19、Tailwind CSS v4、Framer Motion
- **文件解析**：`mammoth`、`pdfjs-dist`、可选外部 `pdftotext`
- **模型接口**：OpenAI-compatible Chat Completions 与 Embeddings
- **数据存储**：浏览器 localStorage

## 开发命令

```powershell
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run lint     # ESLint 检查
```

## 常见问题

### 1. 没有模型 Key 可以体验吗？

可以。缺少模型配置时，LLM 分析和 embedding 语义匹配会失败并进入兜底逻辑，系统仍会用 `lib/analysis.ts` 中的规则机制生成报告。

### 2. PDF 解析效果不好怎么办？

如果 PDF 是扫描件或加密文件，系统可能无法提取文本。建议上传可复制文本的 PDF，或改用 DOCX/TXT/MD。也可以安装 Poppler，并通过 `PDFTOTEXT_PATH` 指定 `pdftotext` 路径，以提升 PDF 解析质量。

### 3. `npm run dev` 或 `npm run build` 很久不结束怎么办？

Next.js 开发服务器本来会持续运行，不会自动退出。若 Windows 上出现 `.next/trace` 文件占用、构建卡住或端口被占用，可先停止当前项目相关的 Node 进程，再清理缓存：

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match '^node(\.exe)?$' -and $_.CommandLine -like '*BiasBreaker-Career*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

Remove-Item -LiteralPath .next -Recurse -Force -ErrorAction SilentlyContinue
npm run dev
```

### 4. 为什么报告追问助手有时回答比较保守？

这是有意设计。助手的系统提示要求它不能编造经历、数据、证书或项目成果。当简历中没有证据时，它会提示“当前简历中未体现”，并建议用户补充真实经历或用 `[待确认]` 标注。

## 适合的使用场景

- 大学生第一次面对 ATS、关键词筛选和岗位语言，不知道简历为什么“石沉大海”。
- 转专业、跨方向或非典型背景候选人，希望把已有经历翻译成目标岗位能识别的能力证据。
- 非名校、低资源或缺少职业辅导支持的求职者，需要一个能解释筛选逻辑的求职辅助工具。
- 投递前检查简历是否存在关键词漏检、证据不足、结构不清和系统读取风险。
- 准备面试时，把报告中的风险点转化为解释话术，避免被简历表述先入为主地误判。
- 比较不同岗位方向下，同一份简历的匹配差异，选择更合理的投递和修改策略。

## 设计边界

- 本项目不会承诺通过 ATS、笔试、面试或人工筛选。
- 本项目反对通过伪造经历、堆砌关键词或夸大成果来“欺骗算法”。
- 评分仅代表当前 JD 与当前简历文本之间的匹配、表达和系统读取风险。
- 建议应基于用户真实经历修改，不鼓励伪造项目、指标或证书。
- 当前历史记录为浏览器本地存储，不适合作为正式多用户生产环境的数据方案。

## 相关文档

- `docs/BiasBreaker_Career_产品设计文档.md`：产品设计与功能说明。
- `docs/智联招聘AI创新大赛参赛资料.docx`：比赛资料。
- `docs/superpowers/`：开发过程中的实现计划与设计记录。
