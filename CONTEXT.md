# Project Context

This is the lightweight entry point for new agent windows working on this repository.
Read this file first. Only open the deeper references listed below when the current task needs them.

## Mission

`premium-commercial-ppt-skill` turns raw Chinese business materials into concise, premium, editable PPTX decks.
The system should behave like a commercial presentation strategist plus deterministic renderer:

- Extract facts and risks from user material.
- Build a claim spine and page-level proof objects.
- Route each page through industry-aware visual intelligence.
- Generate editable PPTX files.
- Validate structure, text safety, and preview quality.

## Default Data Flow

```text
raw materials
  -> scripts/material_ingest.js
  -> scripts/material_orchestration_prompt.js
  -> source audit / story architecture / clarification gate / extraction / critic
  -> scripts/material_to_deck_plan.js
  -> scripts/generate_pptx.js
  -> scripts/validate_pptx.js
  -> scripts/visual_qa.js
```

For small structured examples, `scripts/generate_pptx.js` can consume a deck plan directly.
For real client/company materials, use the staged material pipeline.

## Files To Read First

- `SKILL.md`: short runtime contract and routing guide.
- `CONTEXT.md`: this file.
- `references/context/code-map.md`: where major logic lives.
- `package.json`: available test and sample commands.

## Read Only When Needed

- `references/context/skill-full-workflow.md`: archived long-form workflow from the old `SKILL.md`.
- `references/material-to-industry-deck-workflow.md`: material-to-deck architecture.
- `references/reference-inspired-layout-intelligence.md`: layout recipe reasoning.
- `references/visual-intelligence-router.md`: visual routing principles.
- `references/pptx-layout-qa.md`: PPTX layout QA details.
- `references/industry-adaptive-keynote-profiles.md`: industry profile expectations.
- `references/adr/0001-visible-language-policy.md`: Chinese visible-language policy.

## Avoid Reading By Default

These files or folders are large/noisy and should not be opened unless the task explicitly requires them:

- `assets/reference-recipe-library.json`
- `assets/reference-recipes/index.json`
- `assets/reference-recipes/shards/**`
- `out/**`
- `outputs/**`
- `package-lock.json`
- generated `.pptx`, `.pdf`, `.png`, `.jpg`, `.mp4`
- `references/context/skill-full-workflow.md`

Use `rg` and targeted `sed -n` ranges instead of opening large files wholesale.

## Key Architecture Invariants

- The model understands materials; scripts generate stable deck plans and PPTX.
- LLM output should describe story, facts, risk, and art direction, not hand-written coordinates.
- `assets/visual-system.json` is the design configuration source.
- `scripts/design-system.js` is the visual decision layer.
- `scripts/generate_pptx.js` is the rendering layer.
- Every slide needs one claim and one proof object.
- Missing facts go to clarification, delivery notes, or risk metadata, not visible placeholder text.
- Client-visible decks must not show internal scaffolding such as "TODO", "placeholder", "material shows", "formal delivery suggestion", or "sample".
- Chinese PPT visible microcopy defaults to Chinese. Preserve necessary names, URLs, email addresses, stock tickers, and standard acronyms.

## Most Likely Task Areas

Language and copy:

- `scripts/design-system.js`
- `scripts/design/language-policy.js`
- `scripts/material_pipeline.js`
- `scripts/material_orchestration_prompt.js`
- `assets/copy-policy.json`
- `references/adr/0001-visible-language-policy.md`

Deck plan compilation:

- `scripts/material_to_deck_plan.js`
- `scripts/material_pipeline.js`
- `scripts/test_material_pipeline.js`
- `scripts/test_orchestration_contract.js`

Rendering and layout:

- `scripts/generate_pptx.js`
- `scripts/render/registry.js`
- `scripts/components/**`
- `assets/visual-system.json`
- `scripts/test_intelligence_layers.js`

QA and validation:

- `scripts/validate_pptx.js`
- `scripts/visual_qa.js`
- `references/pptx-layout-qa.md`
- `scripts/test_*qa*.js`

Assets and generated imagery:

- `scripts/deck_asset_decision_gate.js`
- `scripts/asset_prompt_planner.js`
- `scripts/bind_generated_assets.js`
- `assets/media/ATTRIBUTION.md`

## Common Commands

Syntax checks:

```bash
node -c scripts/design-system.js
node -c scripts/generate_pptx.js
node -c scripts/material_pipeline.js
node -c scripts/material_orchestration_prompt.js
```

Focused tests:

```bash
npm run test:intelligence
npm run test:orchestration-contract
npm run test:materials
```

Sample generation:

```bash
node scripts/generate_pptx.js examples/sample-deck-plan.json out/sample.pptx
node scripts/validate_pptx.js out/sample.pptx --expect-slides 10 --require 新能源,告警
```

## Handoff Template

Use this at the end of substantial work so the next window can continue without re-reading everything:

```md
Goal:
Changed:
Important files:
Tests:
Open risks:
Next likely files:
```
