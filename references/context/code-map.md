# Code Map

Use this map before opening large implementation files.

## Runtime Entry

- `SKILL.md`: short skill contract and routing guide.
- `CONTEXT.md`: repository context for new agent windows.
- `references/context/skill-full-workflow.md`: archived long-form workflow. Open only when a detailed historical rule is missing elsewhere.

## Material Pipeline

- `scripts/material_ingest.js`: reads user files/directories and creates a material bundle.
- `scripts/material_orchestration_prompt.js`: creates staged prompts for source audit, story architecture, clarification gate, extraction, and critic.
- `scripts/material_clarification_gate.js`: turns missing inputs and risks into user-facing choices.
- `scripts/material_pipeline.js`: schema, prompt, and plan compilation logic used by material tests and compatibility paths.
- `scripts/material_to_deck_plan.js`: compiles model extraction plus bundle context into a deck plan.

## Design Intelligence

- `assets/visual-system.json`: palette, fonts, industry profiles, motifs, page-family configuration, and visual tokens.
- `assets/copy-policy.json`: renderer fallback copy and visible copy policy.
- `assets/reference-recipe-library.json`: lightweight manifest for reference recipes.
- `assets/reference-recipes/index.json`: compact searchable recipe index. Do not open directly unless debugging recipe retrieval.
- `assets/reference-recipes/shards/**`: full recipe details split by render type.
- `scripts/design-system.js`: main design decision layer.
  - `makeDeckContext`: deck-level visual context.
  - `normalizeDeckPlan`: prepares a deck plan for rendering.
  - `applyDeckRhythm`: infers cross-slide rhythm.
  - `languagePolicyFor`: visible language policy.
  - `localizeMicrocopy`: localizes non-essential labels and renderer microcopy.
  - `resolveSlideVisual`: slide-level visual mode, image role, and treatment.
- `scripts/design/config.js`: configuration loaders for assets.
- `scripts/design/language-policy.js`: visible-language inference and microcopy localization.
- `scripts/design/reference-recipes.js`: recipe manifest, compact index, and shard adapter.

## Rendering

- `scripts/generate_pptx.js`: deterministic PPTX renderer.
  - `addLabel`: shared visible label renderer. It must pass through language localization.
  - `sectionKicker`: small section labels.
  - `renderCover`: cover pages.
  - `renderAgenda` / `renderToc`: navigation pages.
  - `renderArchitecture`: architecture and blueprint pages.
  - `renderTimeline`: pathway and loop pages.
  - `renderCaseGallery`: gallery/evidence pages.
  - `renderMetricComparison`: metrics and KPI pages.
  - `renderRiskTable`: risk/governance pages.
  - `renderClosing`: closing pages.
  - `RENDER_META`: output metadata for validation and debugging.
- `scripts/render/registry.js`: renderer registry used by `generate_pptx.js`.
- `scripts/components/**`: reusable chart, table, scorecard, gallery, and proof components.

## QA

- `scripts/validate_pptx.js`: PPTX structure, text, placeholder, and optional preview validation.
- `scripts/visual_qa.js`: visual/readability/composition checks from previews and deck plan metadata.
- `scripts/test_intelligence_layers.js`: broad design intelligence regression.
- `scripts/test_orchestration_contract.js`: staged orchestration schema/contract regression.
- `scripts/test_material_pipeline.js`: material pipeline regression.

## Large Data

- `assets/reference-recipes/index.json`: compact but still large searchable recipe index.
- `assets/reference-recipes/shards/**`: full generated recipe corpus split by render type.
- `assets/reference-layout-library.json`: smaller recipe/runtime layout library.
- `assets/template-readiness-matrix.json`: template family readiness metadata.
- `outputs/**` and `out/**`: generated artifacts. Use only for reproducing a specific run.
