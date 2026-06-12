# Premium Commercial PPTX Upgrade Lessons

## Trigger

Use this reference when a generated business PPTX is technically valid but the user says it is still not高级, not美观, too基础, or looks like a plain template.

## What went wrong in the session

The earlier modern-business-keynote version improved color and removed old red/blue administrative-template cues, but the content pages still looked like:

- light gray background plus four white cards
- large basic translucent circles as decoration
- card titles with bullet dots
- visible preview/acceptance/testing copy in the deck footer
- cover iterations that changed details but kept the same overall composition

The user explicitly rejected this as not高级 and asked for真实文案, not test/placeholder copy.

## Durable rules

1. Never let demo decks show testing, sample, acceptance, placeholder, or validation wording unless the user explicitly asks for QA artifacts. Generated preview decks should read like a real client-facing deck.
2. Treat production-note wording as a hard failure in visible slides: "材料显示", "企业 PDF 口径", "正式交付前建议", "图册页优先", "该页用于", and "适合某类材料" belong in internal QA notes or delivery caveats, not in the deck.
3. If the user complains that content pages are too basic, do not keep tweaking borders, transparency, or font sizes on the same gray-background card grid.
4. Move to a real page composition system: split-stage layouts, dark narrative rail plus light content stage, dashboard-like panels, strong section framing, or consulting-style evidence layouts.
5. Content pages need a designed background system, not just a clean background. Good background systems can include a left dark rail, subtle data geometry, pale panels, map/grid/axis motifs, or a structured visual object.
6. Cover revisions must be visibly different at composition level. If the user says the cover is similar, changing circles into lighter circles is not enough; introduce a new visual object such as an operating dashboard, abstract data panel, or product/solution architecture motif.
7. Avoid generic four-card grids as the default premium page. If used, they need a surrounding composition: section rail, numeric system, concise titles, one focal claim, and meaningful hierarchy.
8. Use realistic business names and content in generated previews, while avoiding fabricated performance data. Prefer plausible neutral company names and concrete operating scenario copy.
9. For company-introduction and capability decks, the final page must include real contact details, website/QR/address, or next-step review actions. A bare "THANK YOU" page is not commercially finished.
10. Customer names, logos, military projects, certificates, field photos, and project parameters need explicit public-use confidence or desensitization before the deck is called externally commercial-ready.
11. Fix readability at the component-system level. A caption with acceptable point size can still be unreadable if the text box is too narrow; evidence cards need a minimum text lane, stacked captions, or shorter copy.
12. Do not mistake a polished template system for a custom commercial solution. High-end delivery must show a business loop: problem evidence -> measurable impact -> action design -> ownership/path -> metric/result.
13. Add a deck-level art direction layer before rendering. LLMs may propose `deck_art_direction`, but scripts must enforce `themeIntent`, `accentRole`, `layoutEnergy`, `visualDensity`, and `rhythmTransition` through `compositionPlan`.
14. Use semantic color roles instead of random accent variation: brand, evidence, risk, action, data, and neutral each need a reason and a visible carrier.
15. Richness should come from page-family contrast: dark stage, tinted report page, evidence gallery, system map, metric readout, risk board, operating rail, and back-cover anchor.

## Practical v3 pattern that worked better

For problem-diagnosis pages:

- Left 30-35% dark rail with section number, English label, page title, and core statement.
- Right 65-70% light stage with a local section title, short explanatory line, and 2x2 numbered issue blocks.
- Use numbered cards instead of bullet dots.
- Keep footer as a real deck title, e.g. `园区运营数字化升级方案`, not `示例验收稿` or other scaffold copy.

For covers:

- Keep the left title area clean.
- Replace pure decorative circles with a purposeful abstract dashboard/panel: labels, thin metric lines, small nodes, and a tiny trend line.
- Ensure the right-side object communicates the solution theme rather than merely decorating the page.

For evidence and gallery pages:

- Treat images as proof objects. A product, site, store, screen, or certificate image needs a clear role label, a readable caption, and a source/use note when relevant.
- Use `1+3` layouts only when the three support cards have enough text width. If a support card can only fit a 1-inch text lane, stack title and caption vertically or switch to a 2x2 evidence grid.
- Do not force a long business explanation into each image caption. Keep captions to identification and proof relationship; put implications, actions, or caveats into a source note, callout rail, or a follow-up analysis page.
- Data pages should express `current state -> gap -> cause -> action -> expected result`, not just large numbers. Use comparison, funnel, heatmap, root-cause matrix, journey breakpoint, before/after, and milestone components when the material supports them.
- The model extraction layer should carry this as structured `business_logic`, not just prose. If the deck plan loses that chain, `visual_qa` should flag `metricBusinessLogic` or `commercialLogicThin`.
- The model extraction layer should also carry `deck_art_direction` and page-level theme intent. If omitted, `scripts/design-system.js` must infer it, and QA should still flag flat theme variety or adjacent layout similarity.

## QA checklist

- [ ] Does the deck contain any scaffold words like 示例, 测试稿, 验收稿, 占位, 待补充 in a user-facing preview? If yes, remove them.
- [ ] Does any visible copy sound like a production note ("材料显示", "PDF 口径", "该页用于", "适合...材料")? If yes, rewrite it as official client-facing copy.
- [ ] Is the content page more than gray background plus white cards?
- [ ] Does the page have a clear composition system beyond card borders?
- [ ] Did the cover change at the composition level, not only in decoration transparency?
- [ ] Would the page look plausible in a real client-facing business proposal?
- [ ] For external use, are logo/contact details, asset sources, case authorization, sensitive-case handling, and certificate/qualification details accounted for?
- [ ] Are all body/caption text lanes wide enough to read at contact-sheet scale, especially image evidence pages?
- [ ] Does each data or evidence page close a business logic loop instead of only presenting attractive cards or numbers?
- [ ] Does the deck expose multiple theme intents such as opening, navigation, diagnosis, evidence, system, value, risk, operating path, and closing?
- [ ] Are semantic colors used with responsibility, or is the accent only a hairline/page-number decoration?
- [ ] Are adjacent pages meaningfully different in composition, background tone, micro-components, and proof object grammar?
