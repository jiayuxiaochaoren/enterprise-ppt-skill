# premium-commercial-ppt-skill

中文高端商用 PPT 生成与设计 QA 的 Hermes Skill 项目。

它的目标是把用户材料、会议纪要、产品文案、公司资料或简短需求，转成一套简洁、高级、可编辑、可交付的商业 PPTX。系统强调商业主线、事实约束、行业化视觉表达和可验证的渲染结果。

## 快速开始

```bash
npm install
npm test
npm run sample
```

生成自定义 deck plan：

```bash
node scripts/generate_pptx.js examples/sample-deck-plan.json out/sample.pptx
```

验证 PPTX：

```bash
node scripts/validate_pptx.js out/sample.pptx --expect-slides 10 --require 新能源,告警
```

需要预览图时：

```bash
node scripts/validate_pptx.js out/sample.pptx --expect-slides 10 --require 新能源,告警 --preview-dir out/preview
```

交付前工程门禁：

```bash
npm run verify:delivery
```

## Agent 入口

新窗口继续优化本项目时，先读 [CONTEXT.md](CONTEXT.md)，再按任务读取对应 reference。

默认不要打开：

- `out/**`
- `outputs/**`
- `assets/reference-recipe-library.json`
- `assets/reference-recipes/index.json`
- `assets/reference-recipes/shards/**`
- `package-lock.json`
- `references/context/skill-full-workflow.md`

这些文件已写入 [.rgignore](.rgignore)，普通 `rg` 检索会自动避开。

## 项目结构

```text
.
├── CONTEXT.md                       # 新窗口轻量上下文入口
├── SKILL.md                         # skill 运行时入口和核心契约
├── scripts/
│   ├── material_ingest.js           # 摄取用户材料
│   ├── material_orchestration_prompt.js
│   ├── material_to_deck_plan.js
│   ├── generate_pptx.js             # 根据 deck plan 生成可编辑 PPTX
│   ├── validate_pptx.js             # PPTX 结构和文本验证
│   ├── visual_qa.js                 # 预览图和视觉 QA 编排
│   └── qa/                          # visual/render-meta QA 子模块
├── assets/
│   ├── visual-system.json           # 视觉系统配置
│   ├── copy-policy.json             # 可见文案和 fallback 策略
│   ├── reference-recipe-library.json # recipe manifest
│   ├── reference-recipes/            # recipe compact index 和分片
│   └── media/                       # 真实图片/视频资产与来源
├── references/
│   ├── context/                     # 代码地图和长版 workflow 归档
│   └── adr/                         # 架构决策记录
├── examples/                        # deck plan、材料抽取和验收样例
├── templates/                       # prompt 片段
└── package.json
```

## 核心流程

真实材料默认走分阶段链路：

```text
raw materials
  -> material_ingest
  -> material_orchestration_prompt
  -> source audit / story architecture / clarification gate / extraction / critic
  -> material_to_deck_plan
  -> generate_pptx
  -> validate_pptx
  -> visual_qa
```

小型结构化样例可以直接从 deck plan 生成 PPTX。

## 设计契约

- 每页一个明确 claim。
- 每页一个 proof object：图解、矩阵、流程、证据图、数据视图、风险板、对比结构或价值信号。
- 中文 PPT 的非必要可见微文案默认中文；品牌名、产品名、URL、邮箱、股票代码和标准缩写可保留原文。
- 信息缺失时进入澄清、风险说明或保守表达，不把“待补充/占位/待办标记”写进可见页面。
- 图片必须承担证据、产品、场景、人物、地点或情绪主视觉职责，不作为随机装饰。
- 对外商用稿需要检查品牌身份、事实证据、素材授权、敏感案例、联系方式和收尾完整性。

## 常用命令

材料链路：

```bash
npm run materials:ingest -- <materials...> --out out/material-bundle.json
npm run materials:orchestrate -- --bundle out/material-bundle.json --out-dir out/model-orchestration
npm run materials:plan -- --bundle out/material-bundle.json --model-json out/material-extraction.json --out out/deck-plan.json
npm run materials:deliver -- <materials...> --out-dir out/delivery-run --model-json out/material-extraction.json --quality-mode formal
```

没有 `material-extraction.json` 时，`materials:deliver` 会停在模型抽取 prompt 节点；小型低风险材料可加 `--auto-draft` 生成内部草案，但不能直接外发。外部模型工具可用 `--model-results FILE|-` 传入 `sourceAudit`、`storyPlan`、`extraction`、`critic`，扫描件或图片 OCR 可用 `--ocr-json FILE|-` 回填，也可用 `--ocr-command` 接入本机 OCR 命令，交付摘要可用 `--summary-md out/summary.md` 输出 Markdown。

设计和资产：

```bash
npm run inspect:design -- out/deck-plan.json
npm run assets:gate -- out/deck-plan.json --out out/asset-gate.json
npm run assets:plan -- out/deck-plan.json --out out/asset-prompts.json
```

验证和回归：

```bash
npm run validate -- out/sample.pptx --expect-slides 10 --require 新能源,告警
npm run visual:qa -- out/sample.pptx --preview-dir out/preview --plan examples/sample-deck-plan.json
npm test
npm run test:fast
npm run test:slow
npm run test:unit
npm run test:pipeline
npm run test:render
npm run test:visual
npm run test:delivery
npm run test:renderer-family
npm run test:renderer-family:cover
npm run test:renderer-family:financial
npm run verify:ci
npm run verify:nightly
npm run verify:delivery -- --skip-preview
npm run preview:doctor
npm run clean:outputs
npm run test:intelligence
npm run test:orchestration-contract
npm run test:materials
node scripts/audit_hardening_readiness.js --summary-md out/hardening-dashboard.md
```

Renderer family smoke tests can be scoped with `--family` or the npm shortcuts for `architecture`、`closing`、`cover`、`evidence-gallery`、`financial`、`risk`，用于单个页面族迁移后的快速回归。

Changed-file 最小门禁可用：

```bash
node scripts/run_all_tests.js --changed-files scripts/render/text-meta.js --explain
node scripts/run_all_tests.js --changed-files scripts/render/text-meta.js --explain --json
node scripts/run_all_tests.js --changed-files scripts/render/text-meta.js
node scripts/run_all_tests.js --changed-files scripts/render/text-meta.js --profile fast
node scripts/run_all_tests.js --group visual --profile fast --list --json
node scripts/run_all_tests.js --group visual --profile slow --list
node scripts/run_all_tests.js --changed-file scripts/render/text-meta.js --changed-file scripts/test_timeline_renderers.js --explain
node scripts/run_all_tests.js --changed-files scripts/render/chrome/canvas-motifs.js --explain
node scripts/run_all_tests.js --changed-files scripts/render/overlay-component-renderer.js --explain
node scripts/run_all_tests.js --changed-files scripts/render/industry/energy-deployment-renderers.js --explain
node scripts/run_all_tests.js --changed-files scripts/design/semantic-proof-candidates.js --explain
node scripts/run_all_tests.js --changed-files scripts/design/design-system-foundation-helpers.js --explain
node scripts/run_all_tests.js --changed-files scripts/design/language-microcopy-translations.js --explain
node scripts/run_all_tests.js --changed-files scripts/qa/visual-slide-audit-primitives.js --explain
node scripts/run_all_tests.js --changed-files scripts/qa/hardening-readiness-summary.js --explain
node scripts/run_all_tests.js --changed-files scripts/reports/hardening-readiness-format.js --explain
node scripts/run_all_tests.js --changed-files scripts/deck_asset_decision_gate.js
node scripts/run_all_tests.js --changed-files scripts/material_to_delivery.js
```

默认最小门禁映射为：

- renderer-only/runtime/layout/page-family/renderer fixture 改动：`unit + render + visual`，包括 `scripts/render/overlay-*`、`scripts/render/industry/*-renderers.js`、page-family primitives/splits
- asset-only/provenance/asset-generation/attribution 改动：`unit + pipeline + delivery`
- material-only/ingest/orchestration/model-results/material fixture 改动：`pipeline + delivery`
- design planning/chart/routing/language helper 改动：`unit + pipeline + visual`，包括 design-system foundation/planning helpers、microcopy、semantic/source-trace/typography splits
- visual QA/baseline/QA audit 改动：`unit + visual + delivery`，包括 `scripts/qa/visual-*`、render-meta schema、route metadata、component consumption audits
- delivery verification/hardening dashboard/report 改动：`unit + delivery + audit:hardening`
- test runner/profile mapping 改动：`unit`
- docs/skill/reference 改动：`validate:skill + unit`

`--changed-files` 接受逗号分隔列表；`--changed-file` 可重复传入，适合从 git hook 或本地脚本逐项追加路径。`--explain` 只输出匹配规则和建议命令，不运行测试；`--explain --json` 可给本地脚本或 CI 读取。无法识别的路径会回退到全量 group 并建议 `npm test`。

本地内循环可以在 changed-file gate 后追加 `--profile fast`，会保留匹配到的 test group，但跳过慢速 fixture、截图和 delivery 回归；交付或 handoff 前以 `--explain` 输出的 `MINIMUM GATES` 为准，不加 `--profile fast`。`npm run test:slow` 只跑慢速集合，适合在 fast 通过后补跑 fixture/render/visual 的重项。`--list` 只列出当前 group/profile/changed-file 组合会运行的测试，不执行测试，可用于审计 fast/slow profile 是否覆盖了预期门禁。

预览验证优先使用 macOS Keynote；无 Keynote 时会尝试 LibreOffice/soffice + pdftoppm，仍不可用时进入 render-meta/metadata fallback，并在 summary 中标记 preview provider。

截图基线回归可用 `node scripts/visual_qa.js deck.pptx --preview-dir out/preview --baseline path/to/baseline-manifest.json --quality-mode formal --json`。区域级 manifest 示例见 [visual-baseline-region-manifest.example.json](examples/visual-baseline-region-manifest.example.json)，生成、更新和负例说明见 [Screenshot Baseline QA](references/screenshot-baseline-qa.md)。

Hardening dashboard 可用 `node scripts/audit_hardening_readiness.js --json --summary-md out/hardening-dashboard.md` 同时输出机器可读摘要和 Markdown 任务表，逐项标记 code path、render-meta、automated QA、rendered proof 证据状态，并汇总 required objective coverage、P0/P1/P2 objective coverage、P2 热点 facade、大型 layout 模块、dashboard 依赖模块的行数预算、headroom、usage 和 changed-file test profile gates。

当前工程基线见 [2026-05-29 Delivery Baseline](references/release-notes/2026-05-29-delivery-baseline.md)。
本轮材料/renderer/CI 基线见 [2026-05-30 Material And Renderer Hardening](references/release-notes/2026-05-30-material-renderer-hardening.md)。
后续 renderer 拆分基线见 [2026-05-31 Renderer Decomposition Follow-up](references/release-notes/2026-05-31-renderer-decomposition-followup.md)。
Renderer 主文件减重基线见 [2026-06-01 Renderer Runtime Slimdown](references/release-notes/2026-06-01-renderer-runtime-slimdown.md)。

## 参考文档

- [CONTEXT.md](CONTEXT.md)：新窗口上下文入口。
- [references/context/code-map.md](references/context/code-map.md)：主要脚本职责地图。
- [references/adr/0001-visible-language-policy.md](references/adr/0001-visible-language-policy.md)：中文可见语言策略。
- [references/context/skill-full-workflow.md](references/context/skill-full-workflow.md)：旧版长工作流归档，按需读取。

## License

MIT
