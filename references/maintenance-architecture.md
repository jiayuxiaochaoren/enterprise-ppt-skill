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

## Non-Goals

- Do not add new visual styles, page families, or single-page visual negative examples in maintenance-only cycles.
- Do not make renderer facades responsible for QA policy or asset authorization.
- Do not add external dependencies for contract evidence that can be expressed with existing Node modules and local fixtures.
