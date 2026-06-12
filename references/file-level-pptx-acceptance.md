# 真实 PPTX 文件级生成与验收流程

当用户要求生成真实 PPT、检查 skill 是否可用、或交付 `.pptx` 文件时，不要只输出大纲。必须生成可编辑 PPTX，并完成结构验证与预览 QA。

## 默认流程

1. 将用户材料整理成 deck plan JSON。
2. 运行 `scripts/generate_pptx.js` 生成 `.pptx`。
3. 运行 `scripts/validate_pptx.js` 检查文件结构、页数、中文文本、必含关键词和可见脚手架词。
4. 有 Keynote 的 macOS 环境中，使用 `--preview-dir` 导出逐页 PNG。
5. 看缩略图/contact sheet，确认页面族节奏、文字可读性、构图和高级感。

## 推荐命令

```bash
node scripts/generate_pptx.js examples/sample-deck-plan.json out/sample.pptx
node scripts/validate_pptx.js out/sample.pptx --expect-slides 10 --require 新能源,告警 --preview-dir out/preview
```

## Deck Plan 要求

```json
{
  "style": "premium-commercial-keynote",
  "industry": "energy-utility",
  "title": "新能源电站智能运维平台方案",
  "subtitle": "让电站运行从事后巡检走向实时调度",
  "organization": "曜能数智科技有限公司",
  "audience": "新能源投资运营企业管理层",
  "date": "2026年5月",
  "footer": "新能源电站智能运维平台方案",
  "slides": [
    { "type": "cover", "title": "...", "subtitle": "..." },
    { "type": "toc", "title": "...", "items": ["..."] },
    { "type": "architecture", "title": "...", "layers": [] },
    { "type": "closing", "title": "...", "subtitle": "..." }
  ]
}
```

## 最低验收标准

结构层：

1. 文件存在且扩展名为 `.pptx`。
2. PPTX zip 结构可读取。
3. 页数符合预期。
4. 能提取到中文标题与正文。
5. 必需关键词存在。
6. 不出现 `示例 / 测试稿 / 验收稿 / 占位 / 待补充 / Lorem / TODO / 材料显示 / 企业 PDF / PDF 简介口径 / 正式交付前 / 图册页优先 / 该页用于 / 该页只展示 / 模型抽取` 等可见脚手架或制作备注。
7. 不编造具体收入、客户、政策背书、效率提升百分比等事实。
8. 对外商用版必须确认客户名、logo、军工/敏感案例、现场图、证书和字体的可公开使用状态；未确认时在交付说明列为风险。

视觉层：

1. 封面、目录、正文、架构、价值、风险、结尾至少形成 4 种页面族。
2. 缩略图里能看出统一但不单调的视觉系统。
3. 内容页不能只是浅灰底 + 白卡片。
4. 架构页不能只是小盒子排队。
5. 能力页不能只是 3×2 功能卡。
6. 风险页不能只是表格。
7. 文字不溢出、不重叠、不小到不可读。
8. 字体大小合格还不够；正文/caption 的文本框宽度和字符密度也要可读，证据图册页不能把说明压进过窄列。
9. 公司介绍/能力介绍的结尾页至少包含联系人、官网、二维码、地址或下一步评审动作之一，不能只有空泛感谢。

## 注意事项

- 结构验证通过不代表视觉通过。
- 如果 `--preview-dir` 失败，说明环境无法完成完整预览 QA，应在交付说明中明确。
- 用户材料缺失的数据不要写成 PPT 里的“待补充”，应在交付回复中列出。
- “可用于客户沟通”不等于“可公开商用”：缺 logo、联系方式、授权、资质有效期或敏感信息脱敏时，应明确标记为内审/沟通稿。
