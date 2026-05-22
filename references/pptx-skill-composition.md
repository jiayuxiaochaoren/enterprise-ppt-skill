# PPTX Skill 组合与自包含导出策略

本参考记录本 skill 后续维护时的设计原则：当一个 PPT 相关 skill 要交付真实 `.pptx`，不要默认强绑定其他 skill；先判断该 skill 的主交付物和内置导出能力。

## 判断规则

- 内容策划型 skill：负责结构、叙事、文案、页面方案；若要真实 `.pptx`，应补内置导出脚本，或明确调用文件生成工具。
- 设计/HTML 型 skill：若已经自带 HTML→PPTX exporter，应优先用其原生链路，其他 PowerPoint 工具只做验证或高级编辑。
- HTML deck 型 skill：核心交付是浏览器演示稿；若用户强制要 `.pptx`，再做转换或额外生成验收版，不要拿 PPTX 质量反向否定 HTML 主流程。
- PowerPoint 通用工具 skill：适合读取、编辑、合并、拆分、模板处理、PDF/图片级 QA；不应覆盖某个设计 skill 的主创作链路。

## 已对比的外部参考

### huashu-design

仓库：`https://github.com/alchaincyf/huashu-design`

特征：
- HTML-native 设计 skill。
- 演讲幻灯片主流程是 HTML deck。
- 自带 `scripts/export_deck_pptx.mjs` / `scripts/html2pptx.js`，可把 DOM computedStyle 翻译为 PowerPoint 对象。
- 可导出可编辑 PPTX，文本框可在 PowerPoint 中编辑。

组合建议：
- 生成 HTML / 动画 / 原型：单独使用 huashu-design。
- 生成可编辑 PPTX：优先使用 huashu-design 自带 HTML→PPTX 链路。
- 如加载通用 PowerPoint 工具，限定其用途为验证、后续编辑或 QA，不要改用通用 PPT 生成流程重写设计。

### guizang-ppt-skill

仓库：`https://github.com/op7418/guizang-ppt-skill`

特征：
- 核心交付是单文件 HTML 横向翻页 PPT。
- README 明确 PPTX 不是当前主流程；可用浏览器演示、截图或录屏。

组合建议：
- 验收 guizang 风格时，优先验收 HTML deck。
- 只有用户明确要求 `.pptx` 时，再用额外 PPTX 生成/转换工具做验收版。

## 本 skill 的决策

`traditional-enterprise-ppt` 面向传统企业商务汇报，核心诉求是企业用户常见的可编辑 PowerPoint 文件。因此它应该自带最小 PPTX 生成闭环，而不是要求用户记住额外加载 `powerpoint`。

当前默认链路：

1. 先生成传统企业汇报的结构化 deck plan。
2. 用 `scripts/generate_pptx.js` 基于 `pptxgenjs` 生成可编辑 `.pptx`。
3. 用 `scripts/validate_pptx.js` 检查文件存在、页数、zip 结构、中文文本和必含关键词。
4. 复杂读取/编辑已有 PPTX、合并拆分、PDF/图片级 QA 时，才把 `powerpoint` 作为可选辅助。

## 常见坑

1. 不要把“PPT 相关”全部等同于必须加载 `powerpoint`。先看目标 skill 是否已有原生导出链路。
2. 不要让通用 PowerPoint 流程覆盖设计型 skill 的主流程；否则会丢掉设计系统的原生优势。
3. 不要把 HTML deck skill 强行按 PPTX 验收；应先按其主交付物验收。
4. 如果用户希望单 skill 闭环，优先补脚本和验证文档，而不是在 frontmatter 里强绑另一个 skill。
