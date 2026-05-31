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
- `scripts/material_pipeline.js`: thin compatibility facade for material ingestion, gates, extraction prompts, and deck-plan compilation.
- `scripts/material/common.js`: shared material hygiene, text normalization, number extraction, and JSON helpers.
- `scripts/material/ingest.js`: material collection, PDF/Office/text/image ingestion, OCR attachment, table diagnostics, and source reliability reporting.
- `scripts/material/clarification.js`: deterministic clarification gate and answer normalization.
- `scripts/material/extraction-schema.js`: model extraction schema, prompt payload, and reference-context packaging.
- `scripts/material/deck-plan-compiler.js`: material extraction validation and deck-plan compilation facade for slide construction.
- `scripts/material/claim-slide-fields.js`: claim-to-slide field helpers for metrics, chart/data component routing, visible text, contact extraction, and image refs.
- `scripts/material/source-trace.js`: source trace, proof object, and claim spine contract construction.
- `scripts/material/slide-contract.js`: target slide count and material density contract logic.
- `scripts/material/ocr.js`: OCR JSON normalization, page-level OCR helpers, and optional local OCR command adapter.
- `scripts/material/tables.js`: lightweight table row/column detection for text-like sources.
- `scripts/material/model-results-contract.js`: standard model-results validation and critic blocking detection.
- `scripts/material_to_deck_plan.js`: compiles model extraction plus bundle context into a deck plan.
- `scripts/material_to_delivery.js`: one-command orchestrator for material ingestion, staged model handoff, clarification/asset gates, PPTX generation, validation, and Markdown summaries.

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

- `scripts/generate_pptx.js`: deterministic PPTX renderer and shared drawing helper host.
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
- `scripts/render/renderer-context.js`: stable context passed to extracted page-family renderers, including executable helper and color-token contracts.
- `scripts/render/page-families/**`: page-family route ownership and extracted high-value renderer implementations.
  - `financial.js`: financial family wrapper; delegates investment, results, scorecard, and industry renderers.
  - `risk.js`: risk family wrapper; delegates governance/risk board renderers to `risk-boards.js`.
  - `closing.js`: closing family wrapper; delegates generic/adaptive closing renderers to `closing-core.js` and industry-specific endings to `closing-industry.js`.
  - `evidence-gallery.js`: evidence gallery family wrapper; delegates generic gallery implementation to `evidence-gallery-core.js` and specialized proof/industry modules.
  - `cover.js`: cover family wrapper; delegates cover implementation to `cover-core.js`.
  - Remaining decomposition work should target renderer equivalence fixtures and context-contract hardening before moving more families.
- `examples/renderer-family-fixtures/**`: focused renderer family regression plans.
- `scripts/components/**`: reusable chart, table, scorecard, gallery, and proof components.

## QA

- `scripts/validate_pptx.js`: PPTX structure, text, placeholder, optional preview validation, provider fallback, and Markdown summary output.
- `scripts/preview/provider.js`: Keynote, LibreOffice, and metadata fallback preview provider adapter.
- `scripts/reports/delivery-report.js`: shared Markdown summary formatting for validation and delivery runs.
- `scripts/visual_qa.js`: visual/readability/composition checks from previews and deck plan metadata.
- `scripts/run_all_tests.js`: grouped test runner for unit, pipeline, render, visual, and delivery layers, with fast/slow/full profiles for PR and nightly gates.
- `scripts/test_intelligence_layers.js`: broad design intelligence regression.
- `scripts/test_orchestration_contract.js`: staged orchestration schema/contract regression.
- `scripts/test_material_pipeline.js`: material pipeline regression.

## Large Data

- `assets/reference-recipes/index.json`: compact but still large searchable recipe index.
- `assets/reference-recipes/shards/**`: full generated recipe corpus split by render type.
- `assets/reference-layout-library.json`: smaller recipe/runtime layout library.
- `assets/template-readiness-matrix.json`: template family readiness metadata.
- `outputs/**` and `out/**`: generated artifacts. Use only for reproducing a specific run.
