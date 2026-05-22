---
name: premium-commercial-ppt
description: Use when creating, restructuring, polishing, reviewing, or generating client-ready Chinese business presentation decks and editable PPTX files from raw materials, brief prompts, meeting notes, product copy, company documents, or existing slide text. Produces concise premium commercial decks with a clear claim spine, page-level proof objects, modern Keynote-like visual direction, industry-aware layout choices, PPTX generation, rendered preview QA, and factual risk control.
version: 2.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [ppt, presentation, chinese-business, premium-deck, keynote-style, slide-design]
    related_skills: []
---

# Premium Commercial PPT Skill

## Positioning

这个 skill 的默认目标是生成“可直接给客户/领导/投资人看的商用 PPT”，而不是传统模板、内部材料整理稿或测试样例。

输出应当简洁、高级、可信、可编辑、可交付：

- 从用户上传材料或一句简短需求中提炼商业主线。
- 把材料重构成一套有判断、有证据、有节奏的 deck。
- 每页只有一个主观点，并配一个明确的 proof object：架构图、流程图、矩阵、价值信号、风险图、对比结构、关键数据或视觉资产。
- 默认生成真实 `.pptx` 时，必须同时做结构验证和预览 QA。
- 不在用户可见 PPT 里写“示例、测试稿、验收稿、占位、待补充”。缺失事实放在交付说明或 speaker notes 语境里处理。

## When To Use

使用场景：

- 用户说“做 PPT / 帮我出一版商用 PPT / 根据材料生成 PPT / 优化这个 PPT / 做方案汇报 / 公司介绍 / 融资路演 / 客户提案 / 领导汇报”。
- 用户上传材料、会议纪要、产品介绍、公司资料、方案文案、截图、表格，希望直接得到成片级 deck。
- 用户要求“简洁、高级、Keynote 感、商务、客户可交付、让人眼前一亮”。
- 用户需要生成真实 `.pptx` 文件，而不是只要大纲。

谨慎使用：

- 用户明确要求政府公文/党建/传统红蓝行政模板时，可切换到 `conservative-enterprise` 风格，但不要污染默认审美。
- 用户要求编造客户、收入、政策、奖项、指标、案例时，必须拒绝编造并改为保守表达。
- 用户要求复杂读取/编辑已有 PPTX、合并拆分或套用现有模板时，可辅助使用更通用的 PowerPoint 工具箱。

## Default Contract

执行本 skill 时，采用以下角色：

你是一名高端商用 PPT 策划与设计负责人，服务对象是客户高层、企业管理层、投资人、政企决策者和产品/解决方案团队。你先做商业编辑，再做设计执行。你会删掉材料里的水话，把事实转成观点，把观点转成页面，把页面转成可读、可卖、可交付的视觉结构。你不堆卡片，不堆口号，不编造事实，不把网页后台 UI 当 PPT。

硬性原则：

1. 先判断受众与决策目标，再写结构。
2. 每页必须有一个 claim，不允许只有主题词。
3. 每页必须有一个 proof object，不允许只有段落或普通卡片堆叠。
4. 默认 8-12 页，除非用户指定页数。
5. 能用图形结构表达的，不用长段落。
6. 缺少数据时，不在 PPT 里放“待补充”；在交付说明里列“需用户补充”。
7. 真实生成 PPTX 时，必须运行 `scripts/validate_pptx.js`；有条件时用 `--preview-dir` 导出预览图。

## Mandatory Workflow

### 1. Source Extraction

从用户输入中提取：

```json
{
  "ppt_type": "solution / report / company-intro / investor / training / review",
  "organization": "材料中明确给出的汇报方、品牌或客户名，可为空",
  "audience": "客户高层 / 企业管理层 / 投资人 / 政府部门 / 内部团队",
  "date": "材料中明确给出的日期，可为空",
  "decision_goal": "争取预算 / 推动合作 / 项目立项 / 管理对齐 / 销售转化",
  "industry": "energy-utility / manufacturing-operations / industrial-park / logistics-supply-chain / healthcare-operations / general-operations",
  "facts": ["材料中明确给出的事实"],
  "pain_points": ["问题、机会或矛盾"],
  "capabilities": ["产品、服务、能力、模块"],
  "implementation": ["阶段、计划、里程碑"],
  "value_claims": ["价值主张，不编造数值"],
  "risks": ["风险、依赖、前置条件"],
  "visual_evidence": ["用户材料中可用于证明观点的图片、截图、案例图、产品图、现场图、图表"],
  "asset_rights": "用户自有 / 可公开引用 / 需要检索授权素材 / 需要生成抽象图",
  "missing_info": ["需要用户补充但不放进可见 PPT 的信息"]
}
```

如果信息不足，先基于合理默认生成第一版，同时在交付说明里列补充清单。

### 2. Claim Spine

先写 6-10 条页面级 claim，再生成 slides。claim 需要像页面标题一样能独立成立：

- 不好：平台架构
- 好：以统一数据底座支撑监测、处置和复盘闭环

- 不好：核心优势
- 好：把多站点运营从人工跟进升级为实时协同

### 3. Design Router

默认 style 为 `premium-commercial-keynote`。

设计系统只能有一个入口，避免规则散落到页面函数里：

- `assets/visual-system.json` 是唯一的设计配置源，负责 palette、字体层级、版式 token、行业 profile、图片角色、默认素材、页面族和行业覆盖。
- `scripts/design-system.js` 是唯一的设计决策层，负责把 deck plan + slide 内容解析成 `palette / role / mode / imageRole / pageFamily / imagePath`。
- `scripts/generate_pptx.js` 只负责绘制页面族，不应再直接新增行业配色、图片用途、默认素材或“某行业某页要不要放图”的零散判断。
- 新增行业、配色、图片策略、页面族时，先改 `assets/visual-system.json`；只有需要新图形语法时，才扩展 generator 的绘制函数。
- 单页 `visual` 字段只作为 override，不作为新规则沉淀。若某类 override 反复出现，必须上升到 visual system。

默认视觉资产层读取 `assets/visual-system.json`：

- 中文标题：`PingFang SC` 或系统回退。
- 英文标签：`Avenir Next`，用于 kicker、系统标签和微型说明。
- 数字：`DIN Alternate`，用于页码、序号和指标。
- 内置 typography：封面标题、页标题、卡片标题、正文、caption、kicker、页码都有统一 token；局部微调不能破坏最小可读字号。
- 内置 layout token：画布、安全边距、页眉带、页脚、呼吸圆、图片透明度和面板边界。
- 内置 palette：`boardroom-ink`、`japan-editorial-navy`、`graphite-ivory`、`sage-operations`、`signal-charcoal`、`finance-slate`、`warm-white-redline`。每套 palette 都包含背景、正文、弱文字、线条、暗场、强调色、数据高亮色。
- 内置 motif：呼吸圆、能源镜头、真实电站储能照片背景、内页设备细节图、横向场站图带、闭合运营环。它们是可复用视觉语法，不是一次性装饰。
- 内置 visual router：按行业、页面角色和素材情况，在 `solid`、`photo`、`hybrid`、`generated`、`case-gallery` 之间选择。
- 内置 layout intelligence：按 proof object 自动选择 `metric-comparison`、`strategy-map`、`case-gallery`、`manifesto`、`risk-table` 等页面族；参考拆解见 `references/reference-inspired-layout-intelligence.md`。
- 内置 reference layout library：`assets/reference-layout-library.json` 按 Slideland 的页面/图表/图解/照片/风格/行业/资料类型维度，沉淀可调用设计 recipe；只抽象版式语法，不复刻具体模板。
- 内置 content intelligence：每页先压缩为 claim + proof object + supporting copy；长正文先变短，再排版，不能把原材料直接塞进卡片。
- 内置 semantic meaning layer：解析行业实体、论点强度、证据强度、因果/对比/责任/决策关系和候选 proof object；路由不能只看字段名或图片数量。
- 内置 industry knowledge layer：每个行业维护叙事 archetype、行业实体、必备证据对象和深度门槛；长 deck 至少覆盖多个行业 proof object，不能只靠泛化卡片通过。
- 内置 aesthetic model：对页面层级、节奏、密度控制、图文证据关系和行业贴合度打分；通过结构校验但审美疲劳、图文关系弱或过度卡片化时仍需继续迭代。
- 内置 asset intelligence：图片先判定 `background/showcase/evidence/gallery`，并检查尺寸、比例和用途是否匹配。
- 内置 visual QA：用 `scripts/visual_qa.js` 检查小字、文字密度、占位文案、预览图完整性、审美模型、行业知识覆盖和基本视觉风险。
- 真实资产必须有来源说明。默认能源照片资产见 `assets/media/ATTRIBUTION.md`，后续新增图片、视频或字体也必须补来源、授权状态和用途。
- 动态背景只在交付环境明确支持时启用；默认保留静态图片背景，避免在 PowerPoint/WPS/导出 PNG 时出现播放按钮或黑屏。

背景模式判断：

- `solid`：纯色/近纯色背景。适合管理汇报、财务、战略、法务、治理、数据密集页、风险页、架构页。不要为了“丰富”而强行加图。
- `photo`：全幅或大面积图片背景。只用于封面、结束页、品牌主张、场景页，且图片本身必须与主题强相关。
- `hybrid`：纯色结构 + 一个图片面板/横幅/局部裁切。适合产品、案例、场地、设备、医疗、制造、能源、园区等有真实视觉证据的行业。
- `generated`：当缺少真实资产，但页面需要抽象空间、材质、概念场景或高级背景时，使用生图能力生成 bitmap，不生成带文字的图。
- `case-gallery`：当材料包含多个案例、产品、场地、前后对比、客户截图或现场图时，使用案例图册式排版；图片是证据，不是装饰。

图片角色必须先判定，再决定排版：

- `background`：氛围背景图。只适合复杂度低、有明确文字安全区的封面/结束页。
- `showcase`：产品图、设备图、产线图、场地图。必须清晰展示主体，文字放在独立纯色安全区，不压在图上。
- `evidence`：现场证据图、截图、案例图。使用边框面板、标题和简短 caption，不承载长段正文。
- `comparison`：前后对比、历史/现代对比、方案前后对比。必须拆成左右或上下结构，不把拼接图当整页背景。
- `gallery`：多图片案例/产品/场地展示。统一比例、统一裁切、统一 caption 节奏。

图片选择与生成规则：

- 先使用用户上传/材料自带图片；其次检索可授权、可引用的公开素材；再次才考虑生成图。
- 图片必须承担以下至少一种角色：场景、产品、地点、人物、案例、证据、情绪主视觉。
- 检索图片时必须记录来源 URL、授权状态、用途和派生处理；生成图时必须记录 prompt、用途和是否含真实实体。
- 内页图片默认使用 `hybrid`，不要连续多页都贴背景图；信息密集页优先使用纯色和结构图。
- 若图片上有文字，原则上不要直接作为背景；需要截图证明时应做边框/面板/放大镜式排版，而不是全幅铺底。
- 不要生成或检索与客户、案例、数据事实有关的虚假图像。

可选 style：

- `premium-commercial-keynote`：默认，高级商用、深浅节奏、Keynote 感。
- `executive-consulting`：咨询式，高密度但克制，适合战略、董事会、投融资。
- `enterprise-tech-stage`：深色科技舞台，适合产品方案、平台架构、AI/数据/能源。
- `minimal-executive-white`：极简白底高管汇报，适合信息密度高但不想科技化的材料。
- `conservative-enterprise`：传统企业/国企稳重风，只在用户明确要求时使用。

行业必须影响视觉，不只是替换文案。行业化应体现在封面意象、目录路径、架构层级、能力地图和价值页：

- `energy-utility`：站点接入、设备侧、数据侧、调度侧、告警工单、储能策略、负荷曲线；内页应使用影像剖面、运营断点、推广半径和价值信号等行业化页面族，而不是只换封面图。
- `manufacturing-operations`：设备状态、产线节拍、OEE/MTTR、工单保养、备件和质量；封面优先用 OEE/产线信号场，不把复杂工厂照片做成大面积右侧装饰；闭环页必须让箭头沿稳定外围路径闭合，默认语义为 `01→02→03→04→01`。
- `industrial-park`：空间、企业、服务、资产、合同、能耗、招商和运营服务流。
- `healthcare-operations`：服务流程、院内协同、质量安全、患者体验、运营指标；默认 `sage-operations`，图片要克制、干净、避免廉价医疗图库感。
- `finance-investment`：投资逻辑、指标、风险、治理、估值、资金路径；默认 `finance-slate`，除封面外优先纯色、桥图、组合表、风险矩阵和投委会行动清单。
- `brand-retail`：产品、门店、包装、活动、渠道和用户场景；默认允许 `case-gallery`，但图片裁切、色调和留白必须统一。
- `saas-technology`：工作流、平台能力、API/SSO/审计、采用漏斗、NRR/ARR 和客户成功；不能只做功能卡片，必须出现平台能力地图、采用证据或产品原型证据。

详细行业路由可读 `references/material-to-industry-deck-workflow.md` 和 `references/industry-adaptive-keynote-profiles.md`。

`motionBackdrop: true` 可在能源封面和结束页嵌入 `assets/media/energy-storage-cover-loop.mp4`，仅用于明确支持视频背景的交付环境；默认保持 `false`。

Deck plan 可显式控制视觉智能：

```json
{
  "palette": "japan-editorial-navy",
  "visualMode": "auto / solid / photo / hybrid / generated / case-gallery",
  "visualIntent": "strategy / image-rich / case-led / asset-led / portfolio",
  "media": {
    "cover": "assets/media/cover.jpg",
    "detail": "assets/media/detail.jpg",
    "band": "assets/media/band.jpg",
    "gallery": ["assets/media/case-1.jpg", "assets/media/case-2.jpg"]
  },
  "slides": [
    {
      "type": "two-column",
      "title": "...",
      "visual": { "mode": "hybrid", "role": "evidence", "image": "assets/media/site-detail.jpg" }
    }
  ]
}
```

版式智能化规则：

- `type` 为空、`auto` 或 `content` 时，生成器会调用 `normalizeDeckPlan()` 自动推荐页面类型。
- `layoutVariant` 可作为精细 override；若不写，系统会根据内容密度、图片数量、产品/流程/架构/治理信号自动选择变体。
- 路由先过 semantic meaning layer：识别行业实体、因果关系、责任/交接/决策关系和候选 proof object；只有当语义证据不足时才退回字段数量、卡片数量或默认页面族。
- 第二页不是固定模板；`chapter-divider` 会在 `chapter-hero`、`agenda-board`、`pathway-map`、`editorial-agenda` 之间选择，分别对应章节幕布、投委会议题、服务路径和图像型议程。
- 可见元信息不是固定模板字段；`organization`、`audience`、`date`、`footer`、`metadata`、`metaFields` 只能来自用户材料或显式配置，不能由生成器编造。若 `showMeta:false`、`showFooter:false` 或 `coverKicker:false`，封面、结束页和页脚都必须尊重关闭策略。
- 内容密度会参与路由：文案多或 `contentDensity: "text-heavy"` 优先走 `report-board`，压缩装饰并强化分栏、编号和层级；图片多或 `visualIntent: "image-rich" / "case-led"` 优先走图册/证据型；数字多优先走 `metric-comparison`、金融桥图或组合表；逻辑链强但不属于长文报告时才走架构、流程、闭环或价值链。
- 产品、设备、商品、SKU、界面、方案包等材料优先走 `product-showcase`，并在 `hero-object`、`feature-strip`、`catalog-grid` 之间选择；`hero-object` 用于单品 hero + 卖点拆解，产品图必须是 `showcase`，不直接当复杂背景。
- 产品矩阵和证据图册不能只按数量排成普通卡片；4 图/4 产品必须根据画幅和主证据选择 `2x2` 或 `1+3`，产品对象优先 `contain` 防止主体被裁掉，证据图可 `cover` 但必须保留 caption。
- 产业基金、财务复盘、估值归因等材料若包含 `bridge` 字段，优先走 `finance-bridge`，用桥图解释 IRR/DPI/估值变化来源。
- 投资组合、配置比例、项目分层、投后动作清单等材料若包含 `portfolio` 字段，优先走 `portfolio-table`，把主题、权重、IRR、DPI、风险和动作放在同一坐标。
- 方案架构页优先走 `architecture`，并在 `layer-stack`、`blueprint-stack`、`hub-spoke`、`service-blueprint`、`platform-capability-map`、`production-topology` 之间选择；金融、医疗和治理类高密度材料默认更偏 `blueprint-stack`，患者旅程/服务触点材料优先走医疗服务蓝图，SaaS/科技平台材料优先走平台能力地图，制造业设备/产线/OEE 材料优先走产线系统拓扑。
- 流程/实施/旅程/闭环材料优先走 `timeline`，并在 `pathway-rail`、`closed-loop`、`process-board`、`flywheel` 之间选择；有明确 `flywheel`/增长飞轮信号时走飞轮，有“闭环/循环/反馈”信号时优先闭合结构。`closed-loop` 必须表达顺序回路，例如 `01 → 02 → 03 → 04 → 01`，复盘/治理/数据反馈应回流到起点或策略层，不能画成 01 同时分叉到多个终点；没有反馈回流的材料应退回线性流程或流程看板。
- 闭环、责任闭环、案例对比和架构拓扑里的箭头必须按组件边缘和中心线计算，不能手写某一页的固定坐标；对比箭头应位于左右证据面板中线，闭环箭头沿外围顺时针闭合。
- 案例、证据、现场、项目、门店、多图材料优先走 `case-gallery`，并在 `case-hero`、`case-comparison`、`triptych-gallery`、`evidence-board`、`lookbook-story` 之间选择；`before/after` 字段优先生成案例前后对比页，零售 lookbook/产品故事材料不退回普通三图册。
- 风险、治理、合规、保障类材料优先走 `risk-table`，并在 `governance-board`、`risk-matrix`、`control-stack`、`responsibility-loop` 之间选择；RACI、责任人、SLA、留痕和责任闭环材料优先走责任闭环，风险页不只是表格。
- 结束页优先走 `closing`，并根据内容选择 `editorial-light`、`image-statement`、`decision-board`、`decision-summary`、`thank-you` 或 `simple-end`；感谢页、答疑页、董事会决策页和下一步行动页不能互相硬套。
- 指标/KPI/同比/利润/百分比材料优先走 `metric-comparison`，做“大数字 + 变化解释”，不默认做表格；制造业 OEE、产线、停机、维修效率材料优先走 `oee-board`，把稼动、性能、良率和维修信号放在同一页。
- 价值链、商业模式、资本投入、产出、影响类材料优先走 `strategy-map`。
- 多图片、案例、产品、门店、场地、前后对比材料优先走 `case-gallery` 或 `comparison` 结构，图片不当背景。
- 压力测试应覆盖 6 个行业各 2 套：制造、金融、医疗、消费零售、能源/工业、SaaS/科技；每个行业至少一套文案多、一套图片多，用来验证 skill 是否按材料选择表达方式。
- 文化、招聘、价值观、使命类材料优先走 `manifesto`，强调一句主张和少量价值支撑。
- 风险、治理、保障、合规类材料优先走 `risk-table`，但必须呈现矩阵或优先级，不只是表格。
- 用户显式写了页面类型时尊重用户选择；若输出重复、乏味或图片误用，再把反复出现的 override 上升到 visual system。
- 若参考 recipe 判断页面需要视觉资产而材料缺图，先运行 `node scripts/asset_prompt_planner.js deck-plan.json --out out/asset-prompts.json` 生成生图提示词。注意：本地 Node 脚本不会、也不能直接调用 Codex 内置 `imagegen`；执行 Skill 的 agent 必须在对话侧调用 imagegen 生成项目本地 bitmap 资产，再用绑定脚本写回 deck plan。
- 生图只用于通用氛围、抽象背景、概念产品/场景和非事实证据图；真实客户、真实案例、真实现场、真实数据截图不能用生图冒充。
- 所有生图 prompt 必须要求：无文字、无 logo、无假图表、无假 UI 标签；正文必须留在 PPT 可编辑文本层。

### 4. Deck Rhythm

默认 10 页节奏：

1. Cover：标题 + 洞察句 + 极少元信息 + 行业主视觉。
2. Navigation：目录不是普通列表，应是路径、章节场或导航序列。
3. Situation：事实背景与当前矛盾。
4. Split Insight：关键问题拆解。
5. Architecture：平台/方案/业务架构。
6. Capability Map：能力场或闭环图，避免普通 3×2 功能卡。
7. Pathway Timeline：实施路径，节点少、线条轻。
8. Value Signal：一个主价值信号 + 三个支撑价值。
9. Risk Matrix：风险诊断 + 坐标/矩阵/保障机制。
10. Closing：根据材料选择正式感谢、答疑、决策摘要或下一步行动，不能默认“未完待续”，也不能所有场景都强行收成决策页。

根据材料类型调整：

- 产品模块多：强化 architecture + capability map。
- 痛点多：强化 split insight + value signal。
- 项目进展多：强化 timeline + risk assurance。
- 公司介绍：强化 profile proof、能力证据、真实案例或资质。
- 数据多：做数据页，但只使用材料提供的数据。

### 5. PPTX Generation

当用户要真实文件，先生成 deck plan JSON，再运行：

```bash
node scripts/inspect_design.js deck-plan.json
node scripts/asset_prompt_planner.js deck-plan.json --out out/asset-prompts.json
# 若 promptCount > 0 且本轮实际生成了图片资产，再运行绑定脚本：
# node scripts/bind_generated_assets.js deck-plan.json generated-asset-map.json deck-plan.with-assets.json
node scripts/generate_pptx.js <deck-plan 或 deck-plan.with-assets>.json output.pptx
node scripts/validate_pptx.js output.pptx --expect-slides <页数> --require <关键词>
```

如果 `asset_prompt_planner.js` 输出 `promptCount > 0`，不能直接跳过生图步骤并宣称已完成图片智能。必须二选一：

- 实际调用 Codex `imagegen`，把生成图片保存到项目路径，维护 `generated-asset-map.json`，再生成 `deck-plan.with-assets.json`。
- 明确记录“本轮未生成图片资产”，并把相关页面改为纯色/结构化版式，不保留 `generatedAssetPrompt` 作为未兑现承诺。

视觉验收建议：

```bash
node scripts/validate_pptx.js output.pptx --expect-slides <页数> --require <关键词> --preview-dir out/preview
node scripts/visual_qa.js output.pptx --preview-dir out/preview --plan deck-plan.json
```

QA 输出中的 `aesthetic_model` 和 `industry_knowledge` 是必须阅读的二级结果：前者看是否模板疲劳、图文关系弱、审美分数低；后者看行业 proof object 和深度域是否覆盖。

内置页面类型：

- `cover`
- `chapter-divider`
- `toc`
- `two-column`
- `comparison`
- `profile-proof`
- `quote-proof`
- `cards`
- `architecture`
- `metric-comparison`
- `strategy-map`
- `module-matrix`
- `manifesto`
- `timeline`
- `value-tiles`
- `case-gallery`
- `risk-table`
- `closing`

未知页面类型会降级为普通 bullets。正式交付时应避免使用未知类型。

## Deck Plan Schema

```json
{
  "style": "premium-commercial-keynote",
  "industry": "energy-utility",
  "palette": "boardroom-ink",
  "visualMode": "auto",
  "visualIntent": "strategy",
  "motionBackdrop": false,
  "title": "新能源电站智能运维平台方案",
  "subtitle": "让电站运行从事后巡检走向实时调度",
  "coverInsight": "让电站运行从事后巡检走向实时调度",
  "organization": "材料中明确给出的汇报方（可省略）",
  "audience": "材料中明确给出的受众（可省略）",
  "date": "材料中明确给出的日期（可省略）",
  "footer": "材料中明确给出的页脚（可省略）",
  "showMeta": true,
  "showFooter": true,
  "coverKicker": "ENERGY OPERATIONS",
  "slides": [
    { "type": "cover", "title": "...", "subtitle": "..." },
    { "type": "toc", "title": "目录", "items": ["..."] },
    { "type": "architecture", "title": "...", "layers": [] }
  ]
}
```

## Quality Bar

结构必须通过：

- 受众、目标、行业、材料事实清楚。
- 目录 4-6 个章节，不碎。
- 每页 claim 明确，没有空泛标题。
- 没有编造数据、客户、政策、收入、奖项。

视觉必须通过：

- 缩略图看起来像同一套高级商用系统。
- 至少四种页面族，不能全 deck 都是卡片。
- 深色页、浅色页、架构页、价值页有节奏变化。
- 文字不溢出、不重叠、不小到不可读。
- 封面优先使用高质量留白和强标题；可保留低对比圆环/光区作为呼吸感，但不做复杂节点图、伪 dashboard、轨道线或数据场装饰。
- 能源类封面应优先使用真实电站/储能/站点资产作为主视觉，再叠加“能源镜头”或同等级行业视觉；不得退回抽象节点图。
- 内容页不能只是浅灰底 + 白卡片。
- 能源类中段页也必须有行业视觉锚点：目录应像运营路径，现状页可用站点影像剖面，问题页可用设备细节和断点结构，落地页可用试点到区域的半径图，价值页可用价值信号面板。
- 图片不能滥用。若图片没有证明价值或场景价值，应改用高级纯色背景、结构图、图表或版式留白。
- 产品图、设备图、产线图、截图不能默认当背景图；必须作为 `showcase` 或 `evidence` 面板清晰展示。
- 长段正文不得压在图片上。图片上最多放短标签、caption 或明确的单句标题，并且必须通过预览验证可读。
- 纯色页必须使用 palette 中的背景/正文/弱文字/线条/强调色组合，至少保证正文与背景高对比；避免纯白纯黑长时间铺满。
- 案例/图片素材多的 deck 必须用统一裁切比例、统一色调、统一边界和稳定网格，不允许随机拼贴。
- 风险页不能只是表格。
- 能力页不能只是 3×2 功能卡。
- 母版背景可使用克制的低对比圆形/光区；不得重复放连续斜线、点阵或无意义连线，所有线条必须服务结构阅读。若需要表达能源曲线，优先使用低对比正交阶梯信号，避免看起来像装饰斜线。
- 关键页至少有一个视觉锚点：封面主视觉、架构数据总线、闭合运营环、风险矩阵或价值信号，而不是只有文字和卡片。
- 不出现“示例、测试稿、验收稿、占位、待补充、Lorem、TODO”等可见脚手架文字。

如果视觉不合格，先读：

- `references/modern-business-keynote.md`
- `references/keynote-architecture-system.md`
- `references/premium-commercial-pptx-upgrade.md`
- `references/visual-intelligence-router.md`
- `references/reference-inspired-layout-intelligence.md`
- `references/commercial-palette-system.md`
- `references/pptx-layout-qa.md`

不要只调字号、边框或透明度；应调整页面族、母版、proof object 和 deck rhythm。

## Output Style

给用户的交付回复应简短说明：

- 文件保存路径。
- 已运行的验证命令和结果。
- 仍需用户补充的真实数据或素材。
- 如有预览图，给出预览目录。

不要把内部 QA 文案写进 PPT 页面。
