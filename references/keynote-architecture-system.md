# Keynote Architecture System

Use this reference when the user asks for modern commercial PPTs that feel more elegant, spacious, and Keynote-like, especially when they explicitly says the fix must be architecture-level and not just optimization of the current PPT.

## Core principle

Do not solve premium PPT feedback by patching one slide at a time. Build a reusable design system:

1. style profile registry — e.g. `premium-commercial-keynote`, `executive-consulting`, `enterprise-tech-stage`, `minimal-executive-white`; do not hardcode one visual style as the only future direction
2. tokens — colors, typography, spacing
3. primitives — text, rectangles, hairlines, circles, nodes
4. fields — dark stage, light canvas, glass panel, orbital/track field
5. components — cards, value signals, timeline nodes, architecture lanes
6. layouts — cover, navigation, insight, architecture, capability map, pathway, value, risk matrix
7. deck rhythm — deliberate sequence of different page families

## Page families

### Stage Cover

Use for cover and closing.

- Deep stage background.
- Stable left title block.
- Right-side abstract system field only when it clearly supports the industry story; otherwise leave deliberate negative space.
- Do not replace a rejected dot/node motif with a generic chart panel. A broken-looking load curve or decorative dashboard-like chart is worse than no visual.
- Prefer rings, glass veils, light nodes, and subtle links only when they are related and polished.
- Reduce labels; visual system should feel spatial, not like a UI widget.

### Spatial Navigation

Use for table of contents and chapter transitions.

- Must not reuse the same left-dark/right-light layout as content pages.
- Prefer full dark stage, large low-contrast numbers, orbit/track lines, and floating chapter nodes.
- It should feel like navigation through the deck, not a plain list.
- Avoid messy constellation lines that compete with chapter text. If the spatial navigation becomes chaotic, switch to a clean glass navigation rail or disciplined chapter stack.
- For industry-specific decks, do not force a generic navigation metaphor. If the user asks for a domain path (e.g. energy operations), use a readable domain process layout with safe margins instead of a giant full-width line that may overflow or look like a generic navigation stack.

### Split Insight

Use for problem decomposition and core arguments.

- Left side: dark viewpoint panel.
- Right side: evidence or 2×2 supporting cards.
- One main judgement per slide.
- Cards are numbered, light, and concise.

### Light Narrative

Use for background, requirements, risk, detailed explanation.

- Near-white background is acceptable only when it has intentional canvas design: margins, subtle wash, fine separators, page number, and clear visual focus.
- Avoid plain white field + white cards.

### System Architecture

Use for architecture and capability maps.

- Deep stage preferred.
- Use lanes, nodes, glass panels, and thin lines.
- Avoid white button matrices.
- Architecture lanes must not include long guide lines crossing text labels or glass panels; prefer short local accent lines and clean separation.
- If a lane-based architecture still reads as “dots/modules everywhere”, switch to a platform section: horizontal glass strata for access/application/data foundation plus one quiet vertical operating spine. Avoid diagonal connector spaghetti.
- Central core elements must be foreground objects with clear bounds. Do not place a tall translucent core card behind multiple strata where it can look like an accidental overlay or broken z-order.

### Capability Map

Use for module/capability overview pages.

- Do not use a default 3×2 card grid when the user asks for a premium/keynote-like deck.
- Prefer one core explanation block plus distributed capability nodes connected by very light lines.
- Nodes should imply a system map, not equal SaaS feature cards.
- If using a map metaphor, add a central radar/field/loop that connects the nodes; disconnected labels around empty space feel unfinished.
- Avoid stacking a radar field on top of a large decorative background circle; use a plain light canvas or move/scale the radar so it reads as one intentional visualization, not duplicated imagery.

### Risk Matrix

Use for risk and assurance pages.

- Avoid spreadsheet-like risk tables as the default premium layout.
- Prefer risk signals by severity, sparse separators, and a clear assurance mechanism strip.
- Risk matrix diagrams need visible axes, center lines/quadrants, and light grid structure; otherwise the scatter field feels unfinished.
- Left side should provide diagnostic summary/context, not just another list.
- Use red only for truly high-risk items; medium risks can use the main accent color.

### Pathway Timeline

Use for implementation paths.

- Deep stage preferred.
- One quiet axis with floating notes.
- No thick arrows or card train.
- Node ticks/vertical guide lines must stop in empty space and never pass through titles or body copy. Put text blocks beside/above the node with clear offset, or remove the tick entirely.

### Value Signal

Use for value and outcome pages.

- Avoid four equal generic cards.
- Use one dominant value signal plus supporting evidence/signals.
- Let the main value occupy more visual weight than the supporting items.

## Default 10-page rhythm

1. Stage Cover
2. Spatial Navigation
3. Light Narrative
4. Split Insight
5. System Architecture
6. Capability Map / Light Narrative
7. Pathway Timeline
8. Value Signal
9. Risk Matrix / Light Narrative
10. Stage Cover

## QA checks

- Are there at least four distinct page families in the deck?
- Does the directory page avoid repeating the fourth/content page layout?
- Do deep and light pages alternate with narrative purpose?
- Are architecture and timeline slides system/spatial pages rather than button grids or arrow cards?
- Are repeated details implemented as generator primitives/helpers rather than copied one-off shapes?
- Does the final deck contain no scaffold words such as 示例, 测试稿, 验收稿, 占位, 待补充 unless the user explicitly asks for sample/test copy?
