# 外部优秀 PPT 参考拆解

日期：2026-05-24

这份文档记录第一轮公开参考链接的抓取和设计拆解结果。用途是抽象设计规律，不复制源文件中的页面、照片、图标、Logo 或精确版式。后续只能把观察结果转成页面族规则、网格/留白逻辑、节奏规则、语义色使用和 QA 检查。

## 语料状态

本地生成语料：

- 分析 JSON：`out/reference-corpus/meta/reference-analysis.json`
- 代表页渲染图：`out/reference-corpus/pages/`
- 缩略图总览：`out/reference-corpus/reference-contact-sheet.jpg`
- Slideland 重点分类页：`out/reference-corpus/slideland/`
- Slideland 中英标准化分类：`out/reference-corpus/meta/slideland-taxonomy-normalized.json`
- Slideland 全分类页缓存：`out/reference-corpus/slideland-all/`
- Slideland 全分类参考样本：`out/reference-corpus/meta/slideland-category-reference-samples.json`

成功解析的参考：

- COTEN PDF：42 页，16:9，轻量概念型公司/品牌叙事。
- Sumitomo Forestry 年报 2025：98 页，横版年报/统合报告。
- Amiya 2025 Q1 财报：37 页，16:9 财务结果说明。
- POSTAS SpeakerDeck：32 页，招聘/公司介绍资料。
- Dentsu 统合报告 2025：82 页，横版统合报告。
- Itoki 年报 2025：90 页，横版年报。
- Yahoo disclosure PDF：46 页，16:9 披露/说明资料。
- ELEMENTS culture deck：52 页，文化/招聘资料。
- Nice disclosure deck：21 页，16:9 财务/披露资料。
- Shiseido integrated report 2025：73 页，16:9，美妆/消费品牌统合报告。

暂不可用：

- Patagonia progress report 链接返回的是站点排队/防护 HTML，不是 PDF。除非用户提供可直接下载文件，否则不纳入语料。

Slideland：

- 中文分类总页解析出 173 个有效分类入口。
- 已抓取 173 个分类页，生成 342 个参考样本。
- 覆盖 75 个页面角色、10 个图表类型、27 个图解结构、9 个视觉气质、43 个行业分类、9 个资料类型。
- 行业分类中 39 个分类各有 2 个样本；销售、办公业务、NFT/Web3、宇宙/空间这 4 个分类当前来源页只有 1 个可用样本。

## 设计家族

### 1. 轻量概念型公司叙事

代表参考：COTEN 类资料。

可抽象规律：

- 使用米白、浅灰或极轻中性色画布。
- 标题页留白很大，只放一个小型记忆锚点，例如角色、物件、符号或单一概念图。
- 使用细竖排标签、克制页码和低干扰辅助信息。
- 当图形承载核心概念时，允许一张图主导整页。
- 章节页靠空间和节奏建立高级感，而不是靠装饰背景。

候选模板：

- `airy-concept-opening`
- `quiet-section-number`
- `single-object-concept-map`
- `minimal-process-statement`

QA 要求：

- 走这个风格时，拒绝多卡片堆叠、无意义几何装饰和过多颜色。

### 2. 财报数据看板型

代表参考：Amiya、Nice、Yahoo disclosure 类资料。

可抽象规律：

- 封面或章节页使用强品牌色块或深色品牌场。
- KPI pill、关键指标卡、图表簇需要严格网格。
- 信息密度可以高，但图表、表格和评论区必须有明确分区。
- 连续图表页需要章节标识和密度变化，避免一页接一页都像报表截图。

候选模板：

- `financial-kpi-snapshot`
- `chart-grid-with-commentary`
- `brand-color-financial-cover`
- `quarterly-results-summary`
- `guidance-and-risk-board`

QA 要求：

- 数字密集材料不能进普通卡片页。
- 数据页至少要包含一种业务解释结构：基准、同比/环比、目标差距、驱动因素、桥接关系、风险说明。

### 3. 统合报告编辑型

代表参考：Sumitomo Forestry、Dentsu、Itoki 类年报/统合报告。

可抽象规律：

- 白底编辑型画布，接近杂志跨页逻辑。
- 允许文字密集，但要依靠边距、caption、来源注记、表格层级和图表层级维持可读性。
- 价值创造、可持续、治理页面常用流程图、物质性矩阵、证据表格和长文本证据块。
- 图片必须承担证据或场景功能，并配合 caption、章节标签或数据解释。

候选模板：

- `integrated-report-spread`
- `value-creation-process-map`
- `materiality-matrix-board`
- `sustainability-proof-spread`
- `governance-table-editorial`

QA 要求：

- 统合报告可以密，但 PPT 不能直接继承报告密度。
- 从报告转 PPT 时，必须压缩成“一页一个判断 + 一个 proof object + 一个决策含义”。

### 4. 招聘文化册型

代表参考：POSTAS、ELEMENTS 类资料。

可抽象规律：

- 几何形状更柔和，强调色更温暖，页面个性比财报更强。
- 人物、办公空间、产品瞬间和价值观行为都应作为证据，而不是装饰。
- Mission / Value 页面适合大字号 statement。
- 公司概况页可以更友好，但仍要保持结构化信息。

候选模板：

- `culture-cover-with-soft-geometry`
- `mission-statement-stage`
- `value-principle-cards`
- `people-proof-mosaic`
- `company-guide-profile`

QA 要求：

- 文化页可以有情绪，但必须有事实锚点：团队、产品、工作流、价值观行为或真实证据。

### 5. 美妆消费品牌编辑型

代表参考：Shiseido、Kao 类美妆/消费品牌统合报告。

可抽象规律：

- 品牌世界观、人物/产品图像、经营信息和 ESG 证据需要交替出现，不能只做成财报看板。
- 大图承担情绪和品牌叙事，小图、表格、指标和 caption 承担可信证据。
- 色彩适合白底、黑字、肤色/暖中性色和少量品牌红或品牌绿，形成克制但不单调的高级感。
- 产品和人物图不应作为装饰背景，而应带出场景、用户、研发、供应链或社会价值证据。

候选模板：

- `beauty-brand-editorial-cover`
- `consumer-proof-photo-grid`
- `brand-world-and-business-proof`
- `product-evidence-story`
- `warm-premium-integrated-report`

QA 要求：

- 美妆/消费品牌资料不能直接套 B2B 财报或 SaaS 卡片页。
- 每个图像区域都要有证据角色：品牌资产、产品、用户、研发、门店、供应链、社会责任或经营指标。

## Slideland 分类标准化映射

Slideland 的原始页面含日文分类名。后续模板系统使用中文/英文标准名，原始日文只作为溯源字段保留。

页面角色：

- 封面 / Cover: `cover`
- 目录 / Table of contents: `toc`
- 章节页 / Chapter divider: `chapter-divider`
- 结尾页 / Closing: `closing`
- 背景/诊断 / Context and diagnosis: `diagnosis`
- 证明和实绩 / Proof and traction: `proof-traction`
- 商业逻辑 / Business logic: `business-logic`
- 路线图 / Roadmap: `roadmap`
- 指标 / Metrics: `metrics`
- 对比 / Comparison: `comparison`

图解结构：

- 横向流程 / Horizontal flow: `process-flow`
- 循环/飞轮 / Operating loop: `operating-loop`
- 矩阵 / Matrix: `matrix`
- 层级/架构 / Layered architecture: `layered-architecture`
- 瀑布图 / Waterfall bridge: `waterfall-bridge`

语气和场景：

- 信任感 / Executive trust: `trust`
- 高级感 / Premium restraint: `premium-restraint`
- 制造 / Manufacturing: `manufacturing`
- SaaS / SaaS: `saas`
- 金融 / Finance: `finance`
- 能源 / Energy: `energy`
- 公司介绍 / Company introduction: `company-introduction`
- 服务介绍 / Service introduction: `service-introduction`
- 财报说明 / Financial results: `financial-results`
- 统合报告 / Integrated report: `integrated-report`
- 美妆/美容 / Beauty: `beauty`
- 消费品牌编辑型 / Consumer brand editorial: `consumer-brand-editorial`

## 模板升级任务

高优先级：

1. 增加 `financial-kpi-snapshot`、`chart-grid-with-commentary`、`quarterly-results-summary` 页面族。
2. 增加统合报告压缩规则：把 report spread 转成单页 claim / proof / action。
3. 增加 `culture-cover-with-soft-geometry`、`mission-statement-stage`、`people-proof-mosaic`。
4. 增加 `airy-concept-opening`、`single-object-concept-map`。
5. 增加 `beauty-brand-editorial-cover`、`brand-world-and-business-proof`、`consumer-proof-photo-grid`。
6. 把 Slideland 标准化 taxonomy 和全分类参考样本接入路由词库，让行业、页面角色、图解结构、视觉气质和资料类型共同影响页面族选择。

中优先级：

1. 增加 palette intent：
   - `airy-neutral-concept`
   - `financial-green-board`
   - `integrated-report-editorial`
   - `culture-soft-geometry`
   - `beauty-warm-premium`
2. 增加 QA：
   - 财务页没有驱动因素或基准。
   - 把报告密度原样搬进 PPT。
   - 文化页只有装饰，没有真实 proof。
   - 高级感/信任感页面使用过多装饰形状。
   - 美妆/消费品牌页面只有漂亮图，没有产品、用户、研发或经营证据。
3. 增加 contact-sheet 节奏检查：opener、orientation、diagnosis、system、metric、evidence、risk、close 是否形成可读节奏。

低优先级：

1. 等用户选择偏好的风格方向后，再对代表页做小规模人工标注。
2. 对全分类样本做视觉聚类，沉淀出更细的行业模板族。

## 安全规则

- 不复用外部图片、照片、Logo、图标或精确页面构图。
- 不大段引用外部资料文本。
- 只把外部参考转成抽象语法：区域、密度、节奏、语义色、证据角色和 QA 约束。
- 如果用户要求接近某一套具体参考，先区分是内部研究还是商业外发；商业外发必须在素材和构图上保持足够距离。
