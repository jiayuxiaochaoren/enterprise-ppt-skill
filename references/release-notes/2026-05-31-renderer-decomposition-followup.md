# 2026-05-31 Renderer Decomposition Follow-up

## Scope

- Continued the renderer decomposition baseline after the material/CI hardening pass.
- Extracted financial scorecard renderers from the financial family entry module.
- Extracted risk/governance board renderers from the risk family entry module.
- Extracted closing core renderers from the closing family entry module.
- Extracted evidence gallery core renderers from the evidence gallery family entry module.
- Extracted cover core renderers from the cover family entry module.
- Added focused unit coverage for the new financial scorecard and risk board renderer modules.
- Added focused unit coverage for closing, evidence gallery, and cover core renderers.
- Kept deck plan schema, render-meta schema, page types, and renderer family public interfaces compatible.

## Structural Baseline

- `scripts/material_pipeline.js`: 37 lines; remains a compatibility facade over `scripts/material/`.
- `scripts/generate_pptx.js`: 1504 lines; still the shared orchestration and drawing-helper host.
- `scripts/render/page-families/financial.js`: 158 lines; delegates scorecard, industry, investment, and results renderers.
- `scripts/render/page-families/risk.js`: 23 lines; delegates risk board implementation to `risk-boards.js`.
- `scripts/render/page-families/closing.js`: 25 lines; delegates generic/adaptive closing implementation to `closing-core.js`.
- `scripts/render/page-families/evidence-gallery.js`: 26 lines; delegates evidence gallery implementation to `evidence-gallery-core.js`.
- `scripts/render/page-families/cover.js`: 26 lines; delegates cover implementation to `cover-core.js`.

## Verification Baseline

- `npm run test:unit`: 39/39 passed.
- `npm run test:render`: 6/6 passed.
- `npm test`: 71/71 passed.
- `npm run verify:delivery`: passed with Keynote preview provider.

## Remaining Optimization Plan

### P0: Continue Renderer Decomposition

- Completed for `closing.js`, `evidence-gallery.js`, and `cover.js`.
- Keep `generate_pptx.js` focused on orchestration, shared helper creation, render-meta, and compatibility routing in subsequent work.
- For any future page-family extraction, keep the wrapper-plus-focused-test pattern.

### P1: Strengthen Equivalence Fixtures

- Added `cover-family.json` and `cover-energy-family.json` renderer family fixtures.
- Renderer family fixtures now compare extracted text hash/length, render-meta key fields, component consumption, and detailed rendererMatch data.
- Existing focused fixtures cover risk/governance, scorecard, gallery, and closing variants.

### P1: Harden Renderer Context Contracts

- Added executable context and color-token contract checks through `assertRendererContext`.
- Core renderer factories for closing, cover, evidence gallery, risk, and financial scorecards now fail fast on missing helpers or required color tokens.
- Public page-family APIs remain stable while internal helper contracts are auditable.

### P2: Improve Delivery Evidence

- Added `sections.evidence` to the shared validation, delivery, and verification summary schema.
- Markdown summaries now include an "Evidence Snapshot" before pass/risk details.
- Preview provider, render-meta state, visual QA status, OCR risk counts, model critic blockers, asset gate state, and audit evidence strength now surface in one short human-readable report while preserving full JSON for machine checks.

### P2: Reduce Test Matrix Friction

- Added `--family` and `--fixture` filters to `scripts/test_renderer_family_fixtures.js`.
- Added per-family smoke targets for architecture, closing, cover, evidence-gallery, financial, and risk renderer decomposition work.
- Continued writing generated artifacts under `out/` or `outputs/`, with `clean:outputs` as the documented reset path.

## Compatibility Notes

- OCR, LibreOffice, and external model tools remain optional.
- Keynote remains the highest-fidelity preview path on macOS.
- New renderer modules are internal implementation details; consumers should continue using existing npm scripts and deck-plan schema.
