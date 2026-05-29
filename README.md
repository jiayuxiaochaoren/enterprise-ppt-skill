# premium-commercial-ppt-skill

中文高端商用 PPT 生成与设计 QA 的 Hermes Skill 项目。

它的目标是把用户材料、会议纪要、产品文案、公司资料或简短需求，转成一套简洁、高级、可编辑、可交付的商业 PPTX。系统强调商业主线、事实约束、行业化视觉表达和可验证的渲染结果。

## 快速开始

```bash
npm install
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
│   └── visual_qa.js                 # 预览图和视觉 QA
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
- 信息缺失时进入澄清、风险说明或保守表达，不把“待补充/占位/TODO”写进可见页面。
- 图片必须承担证据、产品、场景、人物、地点或情绪主视觉职责，不作为随机装饰。
- 对外商用稿需要检查品牌身份、事实证据、素材授权、敏感案例、联系方式和收尾完整性。

## 常用命令

材料链路：

```bash
npm run materials:ingest -- <materials...> --out out/material-bundle.json
npm run materials:orchestrate -- --bundle out/material-bundle.json --out-dir out/model-orchestration
npm run materials:plan -- --bundle out/material-bundle.json --model-json out/material-extraction.json --out out/deck-plan.json
```

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
npm run test:intelligence
npm run test:orchestration-contract
npm run test:materials
```

## 参考文档

- [CONTEXT.md](CONTEXT.md)：新窗口上下文入口。
- [references/context/code-map.md](references/context/code-map.md)：主要脚本职责地图。
- [references/adr/0001-visible-language-policy.md](references/adr/0001-visible-language-policy.md)：中文可见语言策略。
- [references/context/skill-full-workflow.md](references/context/skill-full-workflow.md)：旧版长工作流归档，按需读取。

## License

MIT
