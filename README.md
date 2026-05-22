# premium-commercial-ppt-skill

中文高端商用 PPT 生成与设计 QA 的 Hermes Skill 项目。

这个项目的目标是：根据用户上传材料、会议纪要、产品文案、公司资料或一句简短需求，生成一套简洁、高级、可编辑、可交付的商业 PPTX，而不是传统模板或测试样例。

## 项目内容

```text
.
├── SKILL.md                         # skill 主说明：定位、工作流、质量门槛
├── scripts/
│   ├── generate_pptx.js             # 根据 deck plan 生成可编辑 .pptx
│   └── validate_pptx.js             # 验证 .pptx 文件、文本、占位符和预览图
├── assets/
│   ├── visual-system.json           # 字体、motif 与高级视觉约束
│   └── media/                       # 真实图片资产与来源说明
├── templates/
│   └── prompt-snippets.md           # 常用高端商用 PPT 提示片段
├── references/                      # 设计系统、行业化、QA、失败经验等文档
├── examples/
│   └── sample-deck-plan.json        # 10 页商用样例 deck plan
├── package.json
├── README.en.md
└── LICENSE
```

## 快速开始

```bash
npm install
npm run sample
```

生成自定义 deck plan：

```bash
node scripts/generate_pptx.js examples/sample-deck-plan.json out/sample.pptx
```

验证并导出预览：

```bash
node scripts/validate_pptx.js out/sample.pptx --expect-slides 10 --require 新能源,告警 --preview-dir out/preview
```

## 当前能力

- 将结构化 deck plan 转为可编辑 PPTX。
- 默认风格切到 `premium-commercial-keynote`。
- 接入 `assets/visual-system.json`，统一中文标题、英文标签、数字字体、商用配色、视觉路由和呼吸圆/能源镜头/真实照片背景/内页影像剖面/闭合环等视觉 motif。
- 支持 `palette`、`visualMode`、`visualIntent`、`media`、`slide.visual`，可按行业和页面角色判断使用纯色、图片背景、混合图文、生成图或案例图库排版。
- 能源样例封面、结束页和多类中段页已使用 public-domain BESS 现场照片的不同裁切，并在 `assets/media/ATTRIBUTION.md` 记录来源。
- `assets/media/energy-storage-cover-loop.mp4` 提供可选动态背景，适合明确支持视频背景的 Keynote/PowerPoint 交付。
- 支持现代商用、咨询式、高管白底、企业科技舞台等 style profile。
- 支持能源、制造、园区等行业 profile。
- 支持封面、目录、问题拆解、架构、能力地图、路径时间线、价值页、风险页、结尾页等 page family。
- 支持 `case-gallery` 页面族，用于案例、产品、场地、截图、前后对比等多图片素材场景。
- 验证脚本会检查文件结构、页数、中文文本、必需关键词、可见脚手架词，并可调用 Keynote 导出逐页 PNG 预览。

## 设计原则

- 每页一个 claim，每页一个 proof object。
- 不把材料摘要成普通卡片页。
- 关键页必须有视觉锚点：封面主视觉、架构数据总线、闭合运营环、风险矩阵或价值信号。
- 行业化不能只换首尾图；目录、现状、问题、路径和价值页也要有对应的行业 page family。
- 图片必须是证据或场景，不是装饰。信息密集页优先纯色背景和结构化排版。
- 纯色页使用内置 palette 的背景/文字/线条/强调色组合，控制色数并保证对比。
- 不用连续斜线、点阵或无意义连线伪装高级感。
- 不在用户可见 PPT 中出现“示例、测试稿、验收稿、占位、待补充”。
- 不编造客户、收入、政策、奖项、指标或案例。
- 结构验证通过不代表视觉通过，必须看缩略图/contact sheet。

## 重构方向

后续建议继续拆分 `scripts/generate_pptx.js`：

1. `tokens`
2. `primitives`
3. `industryProfiles`
4. `pageFamilies`
5. `visualQa`

当前版本先把 skill 的默认定位、样例、验证门槛和生成器入口从“传统企业模板”切到“高端商用交付”。

## License

MIT
