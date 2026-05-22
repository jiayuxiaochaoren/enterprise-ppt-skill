# Keynote v7 Visual QA Lessons

Use this reference after generating a modern-business Keynote-style PPTX and exporting preview PNGs with `qlmanage`.

## Durable lessons from v7 iteration

### Architecture pages

- Avoid any long guide line that crosses layer labels, item labels, or glass panels. Even if technically aligned, it reads as a layout error.
- Prefer separated glass lanes, local short accent lines, and generous vertical spacing.
- Verify the architecture preview visually, not only by PPTX text/content checks.

### Directory vs timeline rhythm

- The table-of-contents slide must not share the same horizontal node-axis structure as the implementation timeline.
- Use a spatial/radial/constellation navigation field for TOC.
- Reserve the quiet horizontal axis for Pathway Timeline pages.

### Capability Map pages

- A module overview should not remain a 3×2 card matrix when the user asks for premium/Keynote-level design.
- Use one core explanation panel plus distributed capability nodes and very light relationship lines.
- If the node layout still feels like equal feature cards, reduce card containers and increase spatial hierarchy.

### Risk Matrix pages

- A simple row list with severity dots is better than a heavy table, but it is not enough to qualify as a Risk Matrix.
- Include an actual matrix field with axes such as impact / governance priority and plot risk nodes inside it.
- Keep the list concise; let the matrix become the visual center.

### Cover spatial device

- Direct node-to-node colored line segments often read as a mini line chart, even when intended as abstract links.
- For a pure spatial device, prefer rings, layered glass planes, glow dots, weak ambient hairlines, and low-contrast orbital geometry.
- Reduce dashboard labels and chart semantics; the right side should feel like an installation, not a data widget.

## QA checklist for this style

- [ ] Does the cover right side avoid chart/dashboard semantics?
- [ ] Does TOC use spatial navigation rather than a timeline/list clone?
- [ ] Does the architecture page have no crossing guide lines?
- [ ] Does module overview use a Capability Map rather than 3×2 cards?
- [ ] Does risk page include an actual matrix field rather than only a table/list?
- [ ] Are exported preview PNGs checked visually after content validation?
