# Maintenance Architecture Boundary

This page is the maintenance map for asset decisions, render routing, render-meta contracts, visual QA, and readiness evidence. Use it when deciding where a new hardening change belongs.

## Layers

- Asset decision layer: `scripts/assets/resolution-facade.js`, `scripts/assets/decision-gate.js`, `scripts/assets/prompt-planner.js`, and compatibility CLIs decide whether a slide has a usable real asset, a generated-asset prompt, a blocked state, or a skipped optional visual.
- Generated image state: asset decision metadata records generation intent, proof eligibility, provenance class, risk, and bound asset count. Renderers consume this state; they do not invent generation decisions.
- Render route layer: `scripts/render/render-route.js` builds `renderRoute` from normalized slide data, renderer registry matches, component plans, and asset policy. `scripts/generate_pptx.js` attaches the route and renders deterministically.
- Render-meta schema: `scripts/qa/contract-registry.js` defines the render-meta schema contract; `scripts/qa/render-meta-schema-rules.js` enforces it; `scripts/qa/render-meta-schema-audit.js` is the audit adapter.
- Visual QA runner: `scripts/visual_qa.js` stays a CLI facade. `scripts/qa/visual-qa-runner.js` orchestrates slide XML, preview, baseline, render-meta, plan, component, chart, overlay, and typography audits.
- Readiness dashboard: `scripts/audit_hardening_readiness.js` stays a CLI facade. `scripts/qa/hardening-readiness-summary.js` assembles matrix, budget, objective, profile, subsystem, and internal contract-evidence summaries.

## Boundary Rules

- Renderer code consumes decisions. It must not make last-minute generated-image, skip-image, or proof-eligibility decisions.
- QA code consumes registries and contracts. It should read exported constants, schema contracts, and fixture manifests rather than scrape implementation strings.
- CLI files stay thin facades. Parsing, orchestration, and report formatting should live in modules that can be required by tests.
- Facades are compatibility surfaces. Add implementation parts behind them, then update require-closure budgets and changed-profile rules.
- Render-meta fields are a contract. Additive metadata is allowed only when existing fields remain stable and schema audits understand the new field.
- Readiness evidence explains both facade and parts. Internal summary rows should identify whether a contract is backed by a facade, runner, rule module, registry, or fixture test.

## Change Placement

- Asset authorization, generated prompt status, skipped critical visual, or provenance: asset decision layer first; render-meta evidence second; visual QA severity only after the contract exists.
- Page-family selection, fallback blocking, renderer match, or stale route metadata: render route and renderer registry first; render-meta schema/route audits second.
- New render-meta shape: contract registry first; schema rule module second; tests and readiness evidence third.
- Screenshot baseline regions: `visual-region-contract.js` and `screenshot-baseline-region-rules.js` first; baseline fixtures/docs/tests second.
- Text shrink or blank-page detection: text meta recorder/readability policy exports first; typography/content coverage audits second.
- Dashboard/readiness proof: hardening matrix and readiness summary first; report rendering second; tests should assert structured fields and sample markdown only.
- Test selection changes: `scripts/test-profile-mapping.js` first, matrix gates second, `scripts/run_all_tests.js --explain` evidence third.

## Brand Visual Components

- Component planning owns routing. Add or remove `proof-gallery`, `product-matrix`, `caption-bar`, `value-chain`, or `kpi-strip` in `scripts/design/component-planning.js` and `scripts/design/component-planning-filters.js`; renderers must only consume the plan.
- Component renderers own reusable drawing behavior. Update `scripts/components/proof-gallery.js` or overlay component rendering when a planned component needs a stronger generic layout such as main image plus proof cards, product matrix rows, source captions, or richer render-meta evidence.
- Page-family renderers own route-specific composition. Update `scripts/render/page-families/evidence-proof-*`, `evidence-brand-*`, or `strategy-brand-world-*` when a fixture/page family needs a custom arrangement of already planned components.
- Native component ownership must stay honest. If a page-family renderer claims a component in `scripts/render/overlay-native-ownership.js`, the slide must draw a visible native slot and `scripts/render/overlay-native-evidence.js` must report `drawnCount`, `bbox`, and a concrete evidence reason.
- Data field sources stay existing-schema only: image evidence from `images`, `visual.image`, `visual.images`, or resolved plan media; product proof from `products`, `productStory`, `cards`, or `items`; captions from `caption`, `visual.caption`, `proof.explanation`, `sourceNote`, and card/item body text; business proof from `metrics`, `drivers`, `actions`, and `outcomes`.
- Do not invent products, product efficacy, business metrics, source excerpts, or image provenance. Missing real images or missing product fields should fall back to proof-gallery/caption or QA review, not fabricated visible claims.
- Use `scripts/qa/brand-visual-richness-audit.js` for internal richness baselines. It reports component hits, image/caption binding, repeated-page signatures, brand visual coverage, and pass/review/fail gap reasons without changing public CLI or deck schema.

## Industry Evidence Chain

- Industry chain definitions live in `scripts/design/industry-evidence-chain-defs-*.js`; inference logic lives in `scripts/design/industry-evidence-chain.js`. Change the definition shards when adding an industry chain, changing the three-stage claim/promise/evidence vocabulary, adding proofObject/field/keyword inference, or defining stage-level default components and cross-industry avoid components.
- Industry packs stay the visual and proof vocabulary source. Change `assets/industry-packs.json` when an industry needs new `visualGrammar`, proof object names, or component rule language; do not hard-code those visual grammar rules in renderers.
- Component planning consumes the chain. Change `scripts/design/component-planning.js` and `scripts/design/component-planning-filters.js` when a chain stage should activate or suppress existing component IDs. The renderer should never infer industry logic at draw time.
- Material/model extraction fields do not own executable component planning. `componentPlan` is suppressed into previous/audit metadata, and claim-level `componentSuggestions` or accidental `componentHints` are non-executable extraction hints; only normalized deck planning and direct user deck-plan hints may activate components, subject to industry evidence QA.
- Component capability contracts live in `scripts/render/component-capability-contracts.js`. Update data requirements there when an existing industry component such as `equipment-nameplate`, `quality-scorecard`, `service-blueprint-lane`, `prototype-frame`, or `permission-audit-tag` becomes executable.
- Visual grammar decisions for generic evidence components live in `scripts/render/industry-visual-grammar.js`. Use it for component labels and evidence tone decisions that apply across page families; use page-family renderers only when the visible geometry itself must change.
- Reusable component drawing belongs in `scripts/components/*`; page-family-specific arrangements belong in `scripts/render/page-families/**`; native ownership and render-meta evidence belong in `scripts/render/overlay-native-ownership.js`, `scripts/render/overlay-native-evidence.js`, and `scripts/generate_pptx.js`.
- Industry evidence QA lives in `scripts/qa/industry-evidence-chain-audit.js`; render-meta field checks live in `scripts/qa/industry-evidence-render-meta.js`. They check stage coverage, component hits, structured evidence fields, caption/source coverage, cross-industry component mistakes, missing-evidence fallback, component consumption, bbox, drawnCount/itemCount, and chainStage/evidenceReason metadata.
- `scripts/visual_qa.js --plan ... --quality-mode formal --json` exposes `industry_evidence_chain_qa`. Severity policy promotes missing chain segments, cross-industry component mismatches, unconsumed industry components, and missing industry render-meta evidence.
- Regression samples live in `examples/industry-evidence-chain/` and are tested by `scripts/test_industry_evidence_chain.js`. These fixtures are not page families; they verify normalized slide/componentPlan/render-meta contracts across P0 and extended industries.
- Real industry smoke lives in `scripts/run_industry_evidence_chain_smoke.js` and `scripts/test_industry_evidence_chain_smoke.js`. It generates PPTX/render-meta/visual QA JSON under `outputs/test-industry-evidence-chain-smoke/` and writes `summary.json` for artifact paths, component hit tables, industry stage tables, compact visual QA summaries, contact sheets, and failure diagnostics.
- Missing real images, product efficacy, customer cases, operational metrics, authorization, or source notes should produce QA review/fallback. Do not satisfy an industry chain by inventing visible PPT facts.

## Industry Evidence Change Placement

- Change chain definitions when the wrong industry, stage, proof object, field, keyword, or avoid component is inferred. This belongs in `scripts/design/industry-evidence-chain-defs-*.js` or `scripts/design/industry-evidence-chain.js`, and the proof is a normalized/component-plan regression.
- Change component planning or filters when the right chain is inferred but the wrong component is planned, a required component is missing, or a generic component such as `hero-image` is over-triggered by weak signals. This belongs in `scripts/design/component-planning.js` or `scripts/design/component-planning-filters.js`.
- Change a reusable component renderer when a component needs visible drawing across routes, such as a stronger `proof-gallery`, `product-matrix`, `risk-register`, or industry component panel. This belongs in `scripts/components/*`, `scripts/render/overlay-component-renderer.js`, or `scripts/render/industry-component-renderers.js`, and render-meta must show bbox and drawn/item counts.
- Change a page-family renderer when the native layout itself must visibly change for a route, such as a SaaS workflow state page, healthcare service blueprint, or financial risk board. This belongs in `scripts/render/page-families/**`; do not use visual QA severity to compensate for a weak page family.
- Change native ownership/evidence only when the page-family already draws the concept visibly and render-meta needs to map that native slot to a planned component. Update `scripts/render/overlay-native-ownership.js` and `scripts/render/overlay-native-evidence.js` together, and verify `rendererModule` or `rendererMethod`, `bbox`, `nativeSlot`, `drawnCount` or `itemCount`, `chainStage`, and `evidenceReason`.
- Change `visualGrammar` when the industry needs different labels, evidence region preference, source/caption density, or composition bias while reusing existing components. This belongs in `assets/industry-packs.json` and `scripts/render/industry-visual-grammar.js`; it should influence geometry/density, not claim component consumption by itself.
- Change smoke summary/reporting when maintainers cannot tell whether a failure came from derivation, planning, drawing, render-meta, preview, or formal QA. Additive fields in `summary.json` are allowed; public CLI output and user deck plan schema remain unchanged.

## Non-Goals

- Do not add new visual styles, page families, or single-page visual negative examples in maintenance-only cycles.
- Do not make renderer facades responsible for QA policy or asset authorization.
- Do not add external dependencies for contract evidence that can be expressed with existing Node modules and local fixtures.
