# Typography System Architecture

The PPTX renderer uses a centralized typography system instead of per-slide
font-size guesswork.

## Layers

1. `assets/visual-system.json`
   - Defines the global type scale, role tokens, font policy, and industry
     typography profiles.
   - Core roles include `coverHeroTitle`, `coverTitle`, `pageTitle`,
     `subtitle`, `body`, `bodySmall`, `caption`, `sourceNote`, `kicker`,
     `microLabel`, `tableHeader`, `tableBody`, `chartTitle`, `chartLabel`,
     `metricLarge`, `metricMedium`, `metricSmall`, `number`, and `pageFolio`.

2. `scripts/design-system.js`
   - `typographyProfileFor(plan)` selects industry overrides.
   - `resolveTypeToken(plan, role, opts)` returns the effective token.
   - `normalizeTypographyOptions(plan, text, opts, role)` assigns font face,
     snaps sizes to the scale, and enforces CJK readability floors.
   - `typographyAudit(plan, normalizedPlan, renderMeta)` verifies the token
     contract and font policy.

3. `scripts/generate_pptx.js`
   - All `addText`, `addLabel`, and `addNumber` calls pass through the
     typography resolver.
   - Component renderers inherit the same system through
     `componentRendererContext`.

4. `scripts/components/*`
   - Chart, table, KPI, proof-gallery, risk-register, and value-chain
     components mark text with semantic roles such as `chartTitle`,
     `tableBody`, `metricMedium`, `caption`, and `sourceNote`.

5. `scripts/visual_qa.js`
   - Reports typography QA, deck font-family drift, per-slide font-size
     fragmentation, tiny text, and CJK readability issues.

## Regression

Run:

```bash
npm run test:typography
npm run test:charts
npm run sample
CODEX_THREAD_ID=019e5dff-f8d2-71f1-bc0a-57e4ebeec719 node scripts/run_beauty_chart_benchmark.js
```

The beauty benchmark is the primary regression for editorial font feel because
it exercises the `beauty-consumer` typography profile.
