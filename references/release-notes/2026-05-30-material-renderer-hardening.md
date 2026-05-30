# 2026-05-30 Material And Renderer Hardening

## Scope

- Renderer page-family migration continued for financial, closing, and architecture families.
- `scripts/material_pipeline.js` is now a compatibility facade; ingestion, clarification, extraction schema/prompt, and deck-plan compilation live under `scripts/material/`.
- Validation and delivery summaries share `delivery-report-summary/v1` for JSON and Markdown output.
- Test runner supports `fast`, `slow`, and `full` profiles; CI uses fast PR gates and scheduled/manual full gates.

## Public Commands

- `npm run test:fast`
- `npm run test:slow`
- `npm run verify:ci`
- `npm run verify:nightly`
- `npm run clean:outputs`
- `npm run preview:doctor`

## Verification Baseline

- `npm run test:fast`: 32/32 passed.
- `npm run test:slow`: 8/8 passed.
- Full delivery and CI gates should still be run before marking a release candidate externally shareable.

## Compatibility

- Deck plan schema, render-meta schema, page types, and existing material pipeline exports remain compatible.
- OCR, LibreOffice, and model execution remain optional capabilities.
