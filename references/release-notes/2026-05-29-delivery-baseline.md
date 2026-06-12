# 2026-05-29 Delivery Baseline

This baseline freezes the first engineering-hardening round before the next renderer and material-pipeline split.

Verified baseline:

- `npm test`: 37/37 passed.
- `npm run verify:ci`: grouped CI gate passed.
- `npm run verify:delivery -- --skip-preview`: non-Keynote delivery gate passed.
- `npm run verify:delivery`: Keynote formal delivery gate passed on macOS.

Public interfaces added or stabilized:

- npm scripts: `test`, `test:unit`, `test:pipeline`, `test:render`, `test:visual`, `test:delivery`, `verify:ci`, `verify:delivery`, `materials:deliver`.
- Material delivery CLI: `scripts/material_to_delivery.js`.
- Delivery fixtures: `examples/delivery-fixtures/`.
- Preview providers: Keynote first, LibreOffice/soffice fallback, metadata fallback when screenshot export is unavailable.
- Material interfaces: `--model-results FILE|-`, `--ocr-json FILE|-`, `--ocr-command`, `--summary-md`.
- QA semantics: chart scores distinguish `not_applicable`; readiness audits include evidence strength.
