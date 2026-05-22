# Premium Keynote Page Family Playbook

Use this reference when iterating a modern commercial / Keynote-like Chinese business PPT after visual QA feedback. The lesson from recent iterations: once the deck is past basic correctness, improve by changing page-family structure, not by endlessly tuning borders, dots, and transparency.

## 1. Directory / Contents Page

Problem signal:
- User says the contents page is messy, chaotic, or too much like a constellation diagram.
- Nodes, orbit lines, and chapter titles compete for attention.

Preferred fix:
- Keep the dark stage, but switch to a disciplined navigation sequence.
- Left side: large low-contrast page number + simple title + one short explanatory line.
- Right side: one glass navigation panel with a vertical rail, small colored dots, numbers, chapter titles, and subtle separators.
- Avoid diagonal constellation lines unless the page has very few labels and the geometry is clean.

## 2. Architecture Page

Problem signal:
- User says the architecture page is still not elegant, looks like “dots everywhere,” or lacks architecture feeling.
- A lane of many bullet nodes reads like a feature list rather than a system design.

Preferred fix:
- Switch from node/lane architecture to a platform-section architecture.
- Use horizontal glass strata:
  1. ACCESS / 用户入口层
  2. APPLICATIONS / 业务应用层
  3. DATA FOUNDATION / 数据支撑层
- Use one quiet vertical operating spine / operating core instead of diagonal connector spaghetti.
- Let labels and large surfaces communicate structure; use connectors only sparingly.

## 3. Capability Map

Problem signal:
- User asks whether a map should have a radar chart or something that connects the points.
- Distributed capability labels feel disconnected.

Preferred fix:
- Add a central radar / capability field.
- Use concentric rings, spokes, and a light polygon to connect the capability nodes.
- Keep node descriptions short; the radar is the organizing metaphor.

## 4. Risk Matrix

Problem signal:
- User says the right-side coordinate chart seems to lack lines or feels unfinished.
- Left side feels empty or like a generic list.

Preferred fix:
- Right side needs visible axes, midpoint lines, quadrant separators, and light grid lines.
- Left side should be a diagnostic summary: counts by severity, compact signal list, severity labels.
- Add a bottom assurance mechanism strip to close the page.
- Use red only for high risk; use accent blue for medium risk.

## 5. Verification Pattern

For each iteration:
1. Generate a real PPTX.
2. Export key pages with macOS `qlmanage -t -s 1600 -o <preview_dir> <pptx>`.
3. Visually inspect at least contents, architecture, capability map, and risk matrix.
4. Verify the PPTX does not contain scaffolding text such as 示例, 验收, 占位, 待补充, 测试.

## Design rule of thumb

When feedback says “not advanced / not elegant,” ask whether the page family is wrong before tuning details. A correct page family usually fixes more than 20 small style tweaks.