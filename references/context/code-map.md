# Code Map

Use this map before opening large implementation files.

## Runtime Entry

- `SKILL.md`: short skill contract and routing guide.
- `CONTEXT.md`: repository context for new agent windows.
- `references/maintenance-architecture.md`: maintenance boundary map for asset decisions, generated image state, renderRoute, render-meta schema, visual QA runner, and readiness dashboard evidence.
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
- `scripts/design-system.js`: thin facade for the design decision layer.
  - `makeDeckContext`: deck-level visual context.
  - `normalizeDeckPlan`: prepares a deck plan for rendering.
  - `applyDeckRhythm`: infers cross-slide rhythm.
  - `languagePolicyFor`: visible language policy.
  - `localizeMicrocopy`: localizes non-essential labels and renderer microcopy.
  - `resolveSlideVisual`: slide-level visual mode, image role, and treatment.
  - `scripts/design/design-system-foundation-runtime.js`: asset/config/library loading plus source/content/typography foundation helpers.
  - `scripts/design/design-system-core-runtime.js`: industry policy, visual media, art direction, composition, semantic, narrative, and aesthetic helper assembly.
  - `scripts/design/design-system-audit-runtime.js`: design/audit gate assembly.
  - `scripts/design/design-system-planning-runtime.js`: reference recipe, asset generation, routing, normalization, rhythm, and deck context assembly.
  - `scripts/design/design-system-exports.js`: explicit public export contract for the facade.
  - `scripts/design/proof-object.js`: proof object id normalization and synthetic-vs-real evidence classification.
  - `scripts/design/industry-knowledge-audit.js`: industry proof-object coverage profile and audit.
  - `scripts/design/deck-plan-normalization.js`: normalize/rhythm/claim-spine deck plan pipeline.
  - `scripts/design/deck-context.js`: deck context factory used by renderers.
  - `scripts/design/design-system-policy.js`: deep merge plus industry visual policy and design dialect helpers.
- `scripts/design/config.js`: configuration loaders for assets.
- `scripts/design/language-policy.js`: visible-language inference and microcopy localization.
  - `scripts/design/language-microcopy-translations.js`: direct English-to-Chinese microcopy dictionary.
  - `scripts/design/language-microcopy-tokens.js`: token-level translations plus acronym preservation list.
- `scripts/design/source-trace.js`: source trace facade.
  - `scripts/design/source-trace-core.js`: source trace merging, plan-authored trace, proof id preference, and image-ref helpers.
  - `scripts/design/source-trace-audit.js`: explainability, metric source, generated-only evidence, and asset authorization audits.
- `scripts/design/reference-recipes.js`: recipe manifest, compact index, and shard adapter.

## Rendering

- `scripts/generate_pptx.js`: deterministic PPTX renderer entrypoint. It now owns CLI parsing, deck normalization, PPTX initialization, render session state, per-slide dispatch, component consumption, and render-meta output.
- `scripts/render/render-runtime.js`: internal runtime assembler for renderer context, page-family renderer factories, industry overrides, fallback renderer wiring, and registry creation from the complete family renderer map.
- `scripts/render/renderer-api.js`: internal renderer API factory that combines chrome helper groups with content, component, chart, and design-system adapters before runtime assembly.
- `scripts/render/chrome-helpers.js`: thin facade over shared chrome helper groups.
- `scripts/render/chrome/**`: internal helper groups for theme/deck meta, shape and line primitives, media/photo panels, and canvas/page chrome.
- `scripts/render/fallback-renderer.js`: internal unknown-slide fallback renderer used only when strict rendering does not block fallback.
- `scripts/render/registry.js`: renderer registry used by `generate_pptx.js`.
- `scripts/render/renderer-context.js`: thin facade for stable renderer context creation and compatible contract exports.
- `scripts/render/context/contracts.js`: internal renderer helper/color contract definitions, flatten/missing-key checks, family grouping, and audited context proxy helpers.
- `scripts/render/page-families/**`: page-family route ownership and extracted high-value renderer implementations.
  - `primitives.js`: shared page-family drawing primitives for page headers, footers, metric cards, and evidence panels.
  - `business.js`: business family wrapper; owns comparison, report board, value tiles, and executive blocks/cards.
  - `strategy-evidence.js`: strategy/evidence proof variants reused by strategy, financial, and evidence-gallery routes.
  - `financial.js`: financial family wrapper; delegates investment, results, scorecard, and industry renderers.
  - `risk.js`: risk family wrapper; `risk-boards.js` is a thin facade over `risk-board-layouts.js`.
  - `closing.js`: closing family wrapper; `closing-core.js` wires adaptive routing across standard and industry closing modules.
  - `evidence-gallery.js`: evidence gallery family wrapper; `evidence-gallery-core.js` is a thin facade over gallery layouts plus specialized proof/industry modules.
  - `cover.js`: cover family wrapper; delegates cover implementation to `cover-core.js`.
  - `architecture.js`: architecture family wrapper; delegates generic architecture renderers to `architecture-core.js` and specialized energy/industry modules.
  - Remaining decomposition work should target renderer equivalence fixtures, context-contract hardening, and smaller helper factories rather than expanding `generate_pptx.js`.
- `examples/renderer-family-fixtures/**`: focused renderer family regression plans; run `scripts/test_renderer_family_fixtures.js --family <name>` or `--fixture <file>` for scoped smoke checks.
- `scripts/components/**`: reusable chart, table, scorecard, gallery, and proof components.
- `scripts/chart-spec.js`: compatibility facade for chart routing, data sufficiency, and chart QA contracts.
  - `scripts/design/chart-spec-constants.js`: chart ids, field keys, and routing regex constants.
  - `scripts/design/chart-data-utils.js`: generic data coercion, metric extraction, and source trace helpers.
  - `scripts/design/chart-intent.js`: chart-intent detection and requested-kind routing.
  - `scripts/design/chart-data-shape.js`: chart data shaping and sufficiency checks.
  - `scripts/design/chart-spec-routing.js`: chartSpec normalization, downgrade, information-gap, and component mapping.
  - `scripts/design/chart-spec-qa.js`: semantic, visual, evidence, page score, and acceptance-gate QA.

## QA

- `scripts/validate_pptx.js`: PPTX structure, text, placeholder, optional preview validation, provider fallback, and Markdown summary output.
- `scripts/preview/provider.js`: Keynote, LibreOffice, and metadata fallback preview provider adapter.
- `scripts/reports/delivery-report.js`: shared JSON/Markdown summary formatting for validation, delivery, and verification runs, including the human-readable evidence snapshot.
- `scripts/visual_qa.js`: visual/readability/composition checks from previews and deck plan metadata.
  - `scripts/qa/visual-slide-audit.js`: per-slide XML readability, overlap, blank-region, and text-density checks.
  - `scripts/qa/visual-preview-audit.js`: preview PNG readability and adjacent-slide similarity checks.
  - `scripts/qa/screenshot-baseline-audit.js`: screenshot baseline manifest comparison and region coverage checks.
  - `scripts/qa/visual-plan-audit.js`: plan-aware aesthetic, chart, component, asset, and delivery-readiness QA aggregation.
  - `scripts/qa/render-meta-audits.js`: compatibility facade for render-meta schema, route, content coverage, overlay, and component consumption audits.
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
