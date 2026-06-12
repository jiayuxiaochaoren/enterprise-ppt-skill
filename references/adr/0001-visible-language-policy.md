# ADR 0001: Visible Language Policy

## Status

Accepted

## Context

Chinese PPT output was still showing English page labels, section tags, renderer fallback labels, and industry profile labels. The issue was architectural rather than isolated to one page:

- orchestration prompts did not expose a visible-language policy;
- deck plan compilation injected English fallback labels;
- the renderer had many hard-coded English labels;
- `addLabel` rendered all labels with Latin-oriented typography;
- visual and copy configuration still described English labels as default.

## Decision

For Chinese decks, all non-essential visible microcopy should be Chinese by default.

This includes:

- page labels;
- section kickers;
- agenda and table-of-contents labels;
- renderer fallback copy;
- captions and opt-in source-note labels;
- component labels;
- closing labels;
- industry profile labels.

The following may remain in the original language:

- brand names;
- product names;
- organization names when officially English;
- URLs;
- email addresses;
- stock tickers;
- standard acronyms such as `API`, `KPI`, `OEE`, `IRR`, `SKU`, `SOC`, `PCS`, `BMS`, `ARR`, `NRR`, `SLA`, `ESG`.

## Implementation

- `scripts/material_orchestration_prompt.js` asks Stage 2 and Stage 4 to produce and preserve `language` plus `visible_language_policy`.
- `scripts/material_pipeline.js` infers or preserves deck language and compiles Chinese fallback labels.
- `scripts/design-system.js` owns `languagePolicyFor`, `inferDeckLanguage`, and `localizeMicrocopy`.
- `scripts/generate_pptx.js` sends shared labels through `localizeMicrocopy` and switches localized CJK labels to CJK typography.
- `assets/copy-policy.json` and `assets/visual-system.json` keep configuration defaults aligned with this rule.

## Verification

Use focused tests first:

```bash
npm run test:intelligence
npm run test:orchestration-contract
npm run test:materials
```

For rendered output, generate a Chinese sample and inspect visible text in slide XML. Pure-English remnants should be limited to allowed acronyms or official names.
