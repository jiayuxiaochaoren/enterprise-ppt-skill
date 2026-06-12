---
name: premium-commercial-ppt
description: Use when creating, restructuring, polishing, reviewing, or generating client-ready Chinese business presentation decks and editable PPTX files from raw materials, brief prompts, meeting notes, product copy, company documents, or existing slide text. Produces concise premium commercial decks with a clear claim spine, page-level proof objects, modern Keynote-like visual direction, industry-aware layout choices, PPTX generation, rendered preview QA, and factual risk control.
version: 2.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [ppt, presentation, chinese-business, premium-deck, keynote-style, slide-design]
    related_skills: []
---

# Premium Commercial PPT Skill

This is the runtime entry point. Keep it short so new agent windows do not exhaust context.
For repository work, read `CONTEXT.md` first. The previous long-form workflow is archived at `references/context/skill-full-workflow.md` and should be opened only for missing details.

## Positioning

Generate client-ready Chinese business PPTX decks, not generic templates or internal drafts.
The deck should be concise, premium, editable, factual, and ready for commercial review.

Core output expectations:

- Build a business claim spine before designing pages.
- Give every slide one clear claim and one proof object.
- Treat industry expression as an evidence chain plus visual grammar plus proof components, not as a generic template skin.
- For industry-specific decks, verify `industry_evidence_chain_qa` in visual QA when a deck plan is available; do not treat component plans as enough without render-meta consumption evidence.
- Use deterministic scripts for deck plans, rendering, validation, and QA.
- Keep visible PPT copy free of internal scaffolding and production notes.
- Do not invent facts, customers, metrics, policies, awards, dates, images, or authorizations.

## When To Use

Use this skill for:

- "做 PPT", "生成 PPT", "优化 PPT", "方案汇报", "公司介绍", "融资路演", "客户提案", "领导汇报".
- Raw material to deck workflows from PDFs, Word files, Excel files, notes, screenshots, product copy, or company material.
- Real `.pptx` generation with validation.
- Commercial design QA for presentation files.

Use caution when:

- The user requests a conservative government or administrative template. Switch style only when explicitly asked.
- Existing PPTX files need deep merge/split/template surgery. Use general PPT tooling as needed.
- The user asks for unverifiable facts. Refuse fabrication and use conservative wording.

## Default Contract

You are a senior commercial presentation strategist and design lead.
You edit the business logic first, then design the deck.

Hard rules:

1. Decide audience and decision goal before structure.
2. Every page needs a claim, not just a topic word.
3. Every page needs a proof object: diagram, matrix, flow, evidence image, data view, risk board, comparison, or value signal.
4. Data pages must explain business logic: current state, impact/gap, cause, action, and metric.
5. Missing facts go to clarification, delivery notes, or risk metadata. Do not show "待补充" or placeholders in visible slides.
6. Default deck length is 8-12 pages unless the user specifies otherwise.
7. Prefer visual structure over long paragraphs.
8. Real PPTX generation must run `scripts/validate_pptx.js`.
9. Use `scripts/visual_qa.js` or preview/contact-sheet review when visual quality matters.
10. External commercial decks must check brand identity, factual support, asset rights, sensitive cases, contact/closing completeness, and visible production-note leakage.

## Context Discipline

New windows should avoid loading the whole repository.

Read first:

- `CONTEXT.md`
- `references/context/code-map.md`
- `references/maintenance-architecture.md`
- `package.json`

Avoid by default:

- `assets/reference-recipe-library.json`
- `assets/reference-recipes/index.json`
- `assets/reference-recipes/shards/**`
- `out/**`
- `outputs/**`
- generated PPTX/PDF/image/video files
- `references/context/skill-full-workflow.md`

Use `rg` and targeted line ranges. Do not open large files wholesale.

## Mandatory Material Workflow

For real client/company materials, use the staged pipeline:

```text
user materials
  -> scripts/material_ingest.js
  -> scripts/material_orchestration_prompt.js
  -> source audit
  -> story architecture
  -> clarification gate
  -> structured extraction
  -> model critic
  -> scripts/material_to_deck_plan.js
  -> asset decision gate
  -> scripts/resolve_visual_assets.js
  -> scripts/generate_pptx.js
  -> validate + visual QA
```

Recommended one-command orchestrator:

```bash
node scripts/material_to_delivery.js <materials...> --out-dir out/run --model-results model-results.json --quality-mode draft --preview-optional
```

`scripts/material_to_delivery.js` ingests materials, writes staged prompts, accepts standard model results, runs the clarification gate when source audit and story architecture are present, compiles the deck plan, runs the asset decision gate and visual asset resolution, renders PPTX, and validates with preview/visual QA unless skipped.

Manual debug commands:

```bash
node scripts/material_ingest.js <materials...> --out out/material-bundle.json
node scripts/material_orchestration_prompt.js --bundle out/material-bundle.json --out-dir out/model-orchestration
node scripts/material_clarification_gate.js --bundle out/material-bundle.json --source-audit out/model-orchestration/source-audit.json --story-plan out/model-orchestration/story-architecture.json --out out/model-orchestration/clarification-gate.json
node scripts/material_orchestration_prompt.js --bundle out/material-bundle.json --stage extraction --source-audit out/model-orchestration/source-audit.json --story-plan out/model-orchestration/story-architecture.json --clarifications out/model-orchestration/clarification-gate.json --out out/model-orchestration/04-extraction.prompt.md
node scripts/material_to_deck_plan.js --bundle out/material-bundle.json --model-json out/material-extraction.json --out out/deck-plan.json
node scripts/deck_asset_decision_gate.js out/deck-plan.json --out out/asset-gate.json --summary-md out/asset-gate.md
node scripts/resolve_visual_assets.js out/deck-plan.json --out-dir out --out-plan out/deck-plan.assets-resolved.json
```

`scripts/material_model_prompt.js` is only a compatibility shortcut for very small, low-risk inputs.
`scripts/material_to_delivery.js` may stop at model-extraction, clarification, asset-decision, or image-generation pause points; use `--auto-draft` only for internal draft runs. External model tools can pass standard staged results through `--model-results FILE|-`; scanned/OCR material can pass external OCR through `--ocr-json FILE|-` or an optional local command through `--ocr-command`; `--summary-md` writes a human-readable run summary.

## Commercial Readiness

For external, client-facing, official, investor, tender, exhibition, or website-use decks:

- Cover and closing must show a real organization identity when available.
- Contact details, websites, QR codes, addresses, and dates must come from materials or explicit user input.
- Customer names, logos, case photos, sensitive industries, certificates, patents, and honors require source support or user confirmation.
- Real screenshots, real data, and real customer/project evidence must not be replaced by generated images.
- Visible text must sound like an official deck, not a production memo.
- Closing should include contact, next step, Q&A, decision action, or a deliberate "谢谢观看/期待交流" pattern depending on deck type.

## Design Router

Default style is `premium-commercial-keynote`.

Architecture:

- `assets/visual-system.json` is the design configuration source.
- `assets/copy-policy.json` is the fallback copy and visible-copy policy source.
- `scripts/design-system.js` is the design decision layer.
- `scripts/generate_pptx.js` is the deterministic rendering layer.
- LLM output may specify art direction and rhythm intent, but not page coordinates.

Deck plans may use:

- `deck_art_direction`
- `themeIntent`
- `accentRole`
- `backgroundTone`
- `layoutEnergy`
- `visualDensity`
- `rhythmTransition`
- `visualMode`
- `visualIntent`
- `media`
- `slide.visual`

## Visible Language Policy

Chinese PPT output should use Chinese for non-essential visible text.

Localize:

- labels;
- section kickers;
- agenda and TOC labels;
- captions;
- source-note labels;
- renderer fallback copy;
- component microcopy;
- closing labels.

Preserve when necessary:

- brand names;
- product names;
- official English organization names;
- URLs and emails;
- stock tickers;
- standard acronyms such as `API`, `KPI`, `OEE`, `IRR`, `SKU`, `SOC`, `PCS`, `BMS`, `ARR`, `NRR`, `SLA`, `ESG`.

Implementation reference: `references/adr/0001-visible-language-policy.md`.

## PPTX Generation

For structured deck plans:

```bash
node scripts/inspect_design.js deck-plan.json
node scripts/deck_asset_decision_gate.js deck-plan.json --out out/asset-gate.json
node scripts/resolve_visual_assets.js deck-plan.json --out-dir out/assets
node scripts/generate_pptx.js <deck-plan-or-with-assets>.json output.pptx
node scripts/validate_pptx.js output.pptx --expect-slides <count> --require <keywords>
```

If `resolve_visual_assets.js` returns `needs_user_input`, ask the user to choose per missing visual: provide assets, auto-generate illustrative visuals, or use structure-only pages.
Only rerun with `--missing-asset-action auto_generate --imagegen-capability available` after the user chooses generated visuals.
Only rerun with `--missing-asset-action skip_image` after the user chooses structure-only pages.
If `resolve_visual_assets.js` returns `needs_image_generation`, generate and bind real bitmap assets before rendering.
Do not leave unfulfilled generated-asset promises in the deck plan.

Visual QA:

```bash
node scripts/validate_pptx.js output.pptx --expect-slides <count> --require <keywords> --preview-dir out/preview
node scripts/visual_qa.js output.pptx --preview-dir out/preview --plan deck-plan.json
```

On non-Keynote environments, use `--preview-optional` or `npm run verify:delivery -- --skip-preview`; the validator reports preview `provider` as `keynote`, `libreoffice`, `metadata_fallback`, or `unavailable` instead of treating the missing preview exporter as a PPTX generation error.
Use `npm run preview:doctor` to inspect local preview provider capability.

## Quality Bar

Structure:

- Audience, goal, industry, and source facts are clear.
- Industry-specific decks follow the right evidence chain: claim, promise, and proof should use that industry's credible logic instead of defaulting to consumer-brand expression.
- Industry evidence components are actually consumed by the renderer with visible bbox and drawnCount/itemCount evidence.
- Page titles are claims.
- The deck has 4-6 coherent sections.
- No fabricated facts.
- Commercial risks are tracked outside visible slides.

Visual:

- The deck looks like one premium system.
- At least four page families appear in an 8-12 page deck.
- Dark/light rhythm, architecture pages, value pages, and evidence pages vary meaningfully.
- Text does not overflow, overlap, or become unreadable.
- Images are evidence, product, place, person, or scene assets, not decoration.
- Risk pages are not plain tables.
- Capability pages are not generic 3x2 cards.
- Closing has visual weight and an appropriate action/contact/thanks pattern.

Forbidden visible text:

- 示例
- 测试稿
- 验收稿
- 占位
- 待补充
- Lorem
- 英文待办标记
- 材料显示
- PDF 简介口径
- 正式交付前
- 该页用于
- 模型抽取

## Output Style

Final user replies should be short and include:

- saved file path;
- validation commands and results;
- preview/contact-sheet path if available;
- missing data or asset risks that still need user input.

Do not put internal QA or production notes into the PPT itself.
