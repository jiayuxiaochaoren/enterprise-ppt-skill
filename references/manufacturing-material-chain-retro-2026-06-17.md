# 制造业材料链路复盘（2026-06-17）

适用样本：

- `/Users/superboy/Downloads/7行业基础数据包/07_智能制造工业设备`

目的：

- 把这轮真实暴露出来的链路问题整理成可复查的问题清单。
- 区分“已经修掉的故障”和“还在主链路里的结构性残留”。
- 给下一轮优化提供更稳定的入口，避免继续来回打补丁。

## 1. 本轮最明显的问题，不是单个页面，而是链路有几处边界一直互相打架

### 1.1 内部 proof id 和用户可见文案没有彻底断开

表现：

- 页面标题里出现过 `Pareto / 帕累托`、`DOWNTIME PARETO`、`responsibility loop`、`downtime` 这类内部或统计术语。
- 某些页左侧深色卡片、右侧说明卡、封底标题会冒出英文残留。
- 同一行业里会出现“责任不落空 / 问题·责任·动作 / 责任分工”这种明显偏通用治理模板的话术。

根因：

- 历史 proof object 和 page family 名称曾经直接参与 visible copy 拼接。
- 旧 taxonomy 兼容层虽然已经开始收口，但之前还会影响标题、卡片标题、组件默认文案。
- 某些 renderer 仍带有默认英文或通用闭环话术兜底。

关联模块：

- `scripts/material/draft-extraction.js`
- `scripts/material/deck-plan-compiler.js`
- `scripts/design/slide-route-sanitization.js`
- `scripts/material/orchestration-prompts.js`
- `scripts/render/page-families/risk-board-*.js`

状态：

- 主链路已经开始改成 normalized proof object + display copy。
- 但这类问题仍然属于高风险回归点，不能只靠单页修文案。

### 1.2 legacy taxonomy 兼容层还在运行时“带路”

表现：

- 新 taxonomy 已经引入，但旧 id 仍会在 route、evidence chain、renderer 选择和 label 语义里留下影子。
- 用户看到的是“为什么所有行业都长得像同一个模板”，底层本质是 proof object 太宽，页面族也太宽。

根因：

- `downtime-pareto`、`responsibility-loop` 这一类历史 id 覆盖语义过大。
- 兼容层不仅做“输入标准化”，还曾继续影响渲染行为。

关联模块：

- `scripts/design/industry-evidence-chain.js`
- `scripts/material/delivery-stages.js`
- `scripts/industry_acceptance_matrix.js`
- `scripts/render/page-families/financial-industry-*.js`
- `scripts/render/page-families/risk-board-action-loop.js`

状态：

- 这轮已经把一部分核心页面迁到新 taxonomy。
- 但还需要继续清理“旧 id 只允许存在于输入兼容层”这条约束。

### 1.3 行业语义链覆盖范围过宽，容易把不该归类的页硬拉进制造业证据链

表现：

- closing / decision-summary 一度被误判为制造业 `process-delivery-promise`。
- 原因只是 closing 页里出现了 `actions`、`交付` 这类词。
- 结果是 QA 会错误要求它具备 `inspection-matrix` 一类工业证据组件。

根因：

- 证据链识别对词面信号过于敏感。
- 缺少“closing、封底、决策页先走中性链”的明确边界。

关联模块：

- `scripts/design/industry-evidence-chain.js`

状态：

- 这轮已修。
- `closing` 和 `closing-dark` 现在会直接走 neutral/general，不再错误继承制造业阶段。

### 1.4 auto-draft 抽取曾经过于浅，导致 deck 虽然能过链路，但内容长得很模板

表现：

- 早期自动草案基本只是把 CSV 前几行转成泛化 claim。
- 会出现“公司/品牌代号”“所属行业”这类不够像报告的标题。
- 最终页面虽然技术上生成成功，但视觉上和叙事上都偏素，行业辨识度不够。

根因：

- `buildDraftExtraction()` 之前主要吃 facts，而不是读取真实表结构。
- 没有把制造业 bundle 里的经营底座、产品明细、月度数据、渠道 ROI、客户调研、活动漏斗映射成行业 proof。

关联模块：

- `scripts/material/draft-extraction.js`

状态：

- 这轮已显著改善。
- 制造业 auto-draft 已改成按表结构生成 foundation / product / trend / loop / channel / issue ranking / funnel 等 claim。
- 但它仍是 auto-draft，不等于最终对外交付版本。

### 1.5 formal-safe 结构页和用户期待的“更有画面感”之间仍存在策略冲突

表现：

- 用户明确觉得页面“太素”“背景太轻”“没有质感”。
- 资产门禁、formal-safe cover、structure-only fallback 会让链路偏保守。
- 用户想要的是两条并行能力：
  - 一条 formal-safe 的原生结构封面
  - 一条更强视觉表达的“强制图像化封面”

根因：

- 现有链路更擅长避免违规和假证据，而不是主动生成更强的视觉主张。
- asset gate、cover archetype、generated asset binding 之间虽然已经接通，但用户决策体验还不够直接。

关联模块：

- `scripts/assets/decision-gate.js`
- `scripts/assets/resolution-facade.js`
- `scripts/design/asset-generation.js`
- `scripts/resolve_visual_assets.js`
- `scripts/render/page-families/cover-*.js`

状态：

- 架构上已经支持图像化封面路线。
- 但“重新 fresh 生成 + 明确走 auto_generate + 强制图像化 cover A/B”这一体验还不够顺。

### 1.6 轻底工业纹理仍然会制造“横线 / 十字线 / 页面太空”的感知问题

表现：

- 用户多次指出封面或浅底页中间会出现一条大横线。
- 某些浅底页右上角背景看起来像很淡的十字辅助线，不像真正的工业结构纹理。

根因：

- 当前 light texture 仍有一批细横线/竖线矩形在右侧背景中绘制。
- 某些 cover motif 和 texture policy 仍偏“结构参考线”，而不是更完整的工业质感背景。
- prompt 侧虽然已经显式写了“avoid centered horizontal rules / crosshair guide lines”，但 native texture 仍可能自己画出来。

关联模块：

- `scripts/render/chrome/canvas-chrome.js`
- `scripts/render/page-families/cover-light-editorial-motif.js`
- `assets/visual-system.json`

状态：

- 这是当前仍未完全收口的问题。
- 尤其制造业浅底页和封面，应该继续减少“辅助线感”，增强“工业场景/铭牌/结构面板感”。

### 1.7 renderer 层仍有不少局部版式 bug，需要靠 visual QA 才能抓出来

表现：

- 编号和标题之间太挤，行距不足。
- 右侧卡片内容被压缩、换行难看。
- 横轴文案 `投入` 被底部色块盖住。
- 某些文本会和标题、页脚、说明条互相冲突。
- 卡片 body 字数稍多就会出现缩放或溢出风险。

根因：

- 页面族虽然拆细了，但单个 renderer 仍有大量硬编码坐标。
- 某些组件 draw order 不合理，文字先画后被后续矩形覆盖。
- 某些卡片语法还没按行业拆开，仍在用偏通用的行高和宽度预算。

关联模块：

- `scripts/render/page-families/financial-industry-channel-efficiency.js`
- `scripts/render/page-families/closing-manufacturing-rollout.js`
- `scripts/render/page-families/risk-board-action-loop.js`
- `scripts/render/page-families/business-report-*.js`

状态：

- 这类问题已经修过一批，但仍属于高频局部返工点。
- 下一轮应该继续把“卡片内部 grammar”按行业拆分，而不是只拆 proof/page family。

### 1.8 QA 已能抓 contract 问题，但对“丑、不像行业、太模板”还不够前置

表现：

- 一份 deck 可以在 draft 验证里 pass，却仍然让用户觉得“太素”“太像模板”。
- 这说明 contract QA 和 aesthetic QA 之间还有空档。

根因：

- 现在 QA 更擅长抓：
  - 组件未消费
  - source 缺失
  - 文字碰撞
  - evidence chain 缺口
- 但对以下问题仍偏弱：
  - 工业质感是否足够
  - cover / closing 是否真的有分化
  - 浅底页主题色承载是否足够
  - 卡片语法是否还像跨行业同模版

关联模块：

- `scripts/visual_qa.js`
- `scripts/validate_pptx.js`
- `assets/visual-system.json`

状态：

- 已有 `accentOnlyAsThinLine`、`adjacentLayoutSimilarity`、`brandAdaptationWeak` 一类规则。
- 但还需要更强的制造业视觉验收断言。

## 2. 这轮已经确认修掉的问题

以下问题已经不再是当前主阻塞：

1. closing 页误入制造业证据链，导致错误要求 `inspection-matrix`
2. auto-draft 只会抽表头/前几行，导致 claim 太泛
3. issue ranking 页缺少可消费的 quality-scorecard 数据
4. channel efficiency 页 `投入` 轴标签被底部色块遮住
5. 制造业 auto-draft 缺失经营闭环 proof，导致深度不足

## 3. 当前状态与仍需关注的问题

截至最新输出 `out/智能制造工业设备_fresh_20260617_regen_v9`：

- `deck-native.pptx`
- `deck-imagecover.pptx`

两版都已经通过 `validate_pptx --quality-mode formal`，并且：

1. `chainStageNeutral`
   - 已修
   - 渠道效率页已稳定落到 `industry-chart:channel-efficiency-matrix`

2. `closedLoopCenteringRisk`
   - 已修
   - 闭环页头部预算和阶段卡片语法已重新收紧

3. `unboundGeneratedAsset`
   - 已修
   - 图像化封面已走完整的 asset decision / bind / render-meta 审计链

4. `loopSemantics`
   - 已修
   - `closing` 不再误落到制造业闭环语义

当前还值得继续关注的，已经从“blocking defect”下降为“质量继续拉高项”：

- 制造业浅底页虽然已经比前几轮更稳，但结构纹理仍可再增强
- 深色左卡/说明卡的行业 grammar 已经分化一轮，但跨行业骨架仍有进一步拆细空间
- native cover 与 imagecover 的差异已经建立，但 native cover 的工业质感还可以继续做得更强

## 4. 这轮反复最多的根本原因

如果只看表象，会觉得是在修很多零碎页面问题；但往下拆，其实主要是 4 个底层冲突：

1. 语义层冲突
   - proof object、industry chain、render family 三套语义以前没有完全一一对应

2. 可见文案和内部路由冲突
   - 内部枚举词泄漏到标题、卡片、说明

3. formal-safe 和 visual ambition 冲突
   - 为了安全回退成结构页，但用户要的是更强的画面和行业气质

4. 页面族已拆，但卡片 grammar 还不够细
   - 大页面骨架不同了，内部卡片还在复用同一套节奏

## 5. 下一轮最值得继续做的事情

优先级建议：

1. 继续拆“卡片内部 grammar”
   - 尤其制造业、医疗、金融、组织文化这几类的左深右浅卡片系统

2. 给制造业补一条更强的视觉主线
   - 一版 formal-safe native cover
   - 一版 forced-image manufacturing cover
   - 并把浅底页背景从“参考线纹理”升级到“结构面/铭牌/设备语义纹理”

3. 把“重新 fresh 生成 + 用户明确选择 auto_generate”做成更顺的一条链
   - 减少旧输出残留、旧 render-meta 残留、旧资产决策残留带来的误判

4. 继续把 light texture 从“几何参考线”推进到“工业结构背景”
   - 减少虽然不报错、但用户主观感知仍觉得“太空、太素”的页面

5. 继续提升 native cover 的工业场景表达
   - 保持 formal-safe 的前提下，让结构封面也更有制造语义，而不是只靠克制留白

## 6. 结论

这轮最有价值的收获不是“修了几页”，而是已经确认：

- 问题并不主要在模型会不会写句子，
- 而在“语义归一化、可见文案隔离、页面族分化、卡片 grammar、视觉门禁”这五层能不能同时闭合。

现在主链路已经比最初稳定很多，而且这轮制造业样本已经能稳定产出一套 formal 通过的 native deck 和一套 formal 通过的 imagecover deck。下一轮工作重点不再是“救火修故障”，而是继续下钻到 card grammar、native cover 质感和工业纹理表达，把“能交付”继续推进到“更有行业记忆点”。
