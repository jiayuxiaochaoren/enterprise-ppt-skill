# PPTX Skill Hardening Backlog

Purpose: turn recent PPT defects into implementation tasks that harden the generation chain, not one-off slide fixes. The main failure mode is not a single bad coordinate; it is weak contracts between planning, native renderers, overlays, visual QA, and asset decisions.

Last reviewed: 2026-05-28

## Target Outcome

The skill should be able to render a formal business deck without recurring failures such as:

- planned components not consumed by the selected native page family
- old coordinates or fallback overlays covering new layouts
- stale `variant`, `layoutVariant`, `chartSpec`, or asset decisions overriding current routing
- unreadable text caused by aggressive `fit:'shrink'`
- blank/right-empty pages caused by missing data or wrong route
- product-image pages silently downgraded to line art or structural pages
- validation passing even when screenshot-level layout quality regresses

## Global Definition Of Done

Every task below should provide evidence in four forms:

1. Code path: the responsible script or renderer has an explicit contract, not an implicit fallback.
2. Render meta: `.render-meta.json` records enough information to audit plan-vs-render behavior.
3. Automated QA: at least one focused test or QA check catches the failure mode.
4. Rendered proof: a fixture or acceptance deck preview demonstrates the fix visually when the task affects layout.

Do not mark a task complete if it only adds route names, recipe metadata, or passing smoke tests.

## P0 Tasks

### P0-01 Strict Render Registry And Unknown Type Gate

Problem: unknown slide types can silently hit fallback renderers, which hides routing defects and lets generic pages appear in formal decks.

Files:

- `scripts/render/registry.js`
- `scripts/generate_pptx.js`
- `scripts/test_routing.js`

Work:

- Make the render registry return match metadata: requested type, matched type, `exact | alias | fallback`.
- Include actual renderer identity: `rendererId`, function or branch name, source module, and alias/fallback source.
- Record renderer match kind in render-meta.
- Fail QA when a formal deck or a slide with component requirements uses fallback.
- Add tests for unknown type, alias match, and fallback disallowed in strict mode.

Acceptance:

- Unknown `type` no longer renders silently in formal/material flows.
- Render-meta shows fallback usage whenever fallback is allowed in draft mode.
- Render-meta records `requestedType`, `matchedType`, `matchKind`, `rendererId`, `rendererName`, and source for every slide.
- A fixture with an unknown high-value page family fails before PPT delivery.
- Priority page-family fixtures can assert that the expected renderer identity was used, not only that a function returned a slide.

Suggested owner: Contract / routing agent.

### P0-02 Native Renderer Ownership Must Match Actually Drawn Components

Problem: some native page families declare broad ownership of overlay-prone components even when they do not draw them, so required components look consumed while no visible component exists.

Files:

- `scripts/generate_pptx.js`
- `scripts/design-system.js`
- `scripts/test_template_page_family_fixtures.js`
- `scripts/test_composition_planner.js`

Work:

- Replace broad native ownership with per-page-family contract maps.
- For every consumed native component, record evidence such as `nativeSlot`, `drawnCount`, or `rendererMethod`.
- Add a `drawnComponents[]` or equivalent native-renderer hook; `ownedComponents` alone must not count as rendered evidence.
- Remove blanket ownership of all overlay-prone components from curated/native variants.
- Add fixture tests that compare planned required components with real consumed evidence.

Acceptance:

- `missingRequiredComponents` being empty proves a real native or overlay rendering path existed.
- Portfolio-table cannot be required to consume image/gallery components unless its renderer draws them.
- Priority page-family fixtures fail if a required component is only "claimed" but not drawn.
- A native component with no `drawnCount`, `nativeSlot`, `bbox`, or renderer evidence fails component consumption QA.

Suggested owner: Contract / renderer agent.

### P0-03 Component Capability Registry

Problem: planner and renderer do not share a single component capability manifest, so planner can emit component ids that are native-only, unsupported, aliased inconsistently, or overlay-only.

Files:

- `scripts/design-system.js`
- `scripts/components/index.js`
- `scripts/generate_pptx.js`
- `scripts/visual_qa.js`

Work:

- Create an authoritative component manifest with id, aliases, data requirements, supported render modes, and ownership policy.
- Make `componentPlanFor()` emit only known component ids.
- Convert unknown hints into audit findings, not renderer fallback.
- Add a coverage test that every planned component id has a capability entry.

Acceptance:

- Unknown planned component ids fail QA.
- Aliases are resolved in one place.
- Native-only components cannot be requested as overlays unless explicitly supported.

Suggested owner: Component contract agent.

### P0-04 Screenshot Baseline Regression QA

Problem: current visual QA can confirm previews exist, but it cannot catch "same page shifted, missing a card, right side empty, or layout degraded versus prior good output."

Files:

- `scripts/visual_qa.js`
- `scripts/validate_pptx.js`
- `scripts/test_template_novelty_qa.js`
- `references/file-level-pptx-acceptance.md`

Work:

- Add a baseline manifest format for preview PNGs.
- Compare each page against baseline using perceptual hash distance, luminance distance, content bounding box delta, and crop diff.
- Support region-level expectations such as `mainBody`, `rightEvidence`, `cardGrid`, `chartBoard`, and `footer`.
- Report region coverage, local hash distance, visual bbox delta, and missing-region reason separately from whole-slide similarity.
- Support per-slide thresholds and allowed drift.
- Add at least one negative fixture where a page is visibly shifted or missing content.

Acceptance:

- A missing card or large layout shift fails screenshot QA.
- A missing right-side evidence panel or empty main-stage region fails even when the whole-slide hash is still similar.
- Baseline diff is reported with slide number, metric values, and actionable reason.
- `validate_pptx` can optionally run this gate and fail the command.

Suggested owner: Visual QA agent.

### P0-05 Text Shrink Risk Audit

Problem: `fit:'shrink'` can make Chinese body text unreadable while XML still contains the original font size.

Files:

- `scripts/generate_pptx.js`
- `scripts/visual_qa.js`
- `scripts/design-system.js`

Work:

- Record text box metadata in render-meta: role, original font size, fit strategy, text length, box width/height.
- Add density heuristics for CJK text based on characters per inch and box height.
- Mark risky combinations such as small caption/body text + `fit:'shrink'` + dense Chinese text.
- Convert key renderers from "shrink to fit" to fixed-size text areas with truncation or line budget.

Acceptance:

- Long Chinese body text in a too-small card is flagged before delivery.
- Closed-loop/timeline cards keep readable body text and do not shrink below the configured role minimum.
- At least one fixture proves the QA catches an unreadable shrink case.

Suggested owner: Visual QA / typography agent.

### P0-06 Blank Or Missing-Content Page Detection

Problem: right-empty or near-blank pages can pass current validation because the PPTX opens and contains text.

Files:

- `scripts/visual_qa.js`
- `scripts/validate_pptx.js`
- `references/pptx-layout-qa.md`

Work:

- Compute visual content coverage for body regions, not just full-slide variance.
- Detect pages with a header/footer but little main content.
- Add edge density and non-background pixel coverage checks by slide type.
- Make formal deck validation fail on content pages with insufficient main-stage coverage.

Acceptance:

- A page with title and footer but blank main body fails.
- A right-side evidence panel expected by plan but missing is detected through render-meta and/or screenshot coverage.
- QA output distinguishes intentionally minimal divider/cover pages from broken content pages.

Suggested owner: Visual QA agent.

### P0-07 Asset Decision Gate: Block Unsafe Auto-Generate Paths

Problem: blocked factual evidence pages can still be answered with `auto_generate`, which turns a risk into a generated image task.

Files:

- `scripts/deck_asset_decision_gate.js`
- `scripts/design-system.js`
- `scripts/test_asset_decision_gate.js`

Work:

- If `assetGeneration.status === 'blocked'`, allow only `provide_assets` or `skip_image`.
- Do not show `auto_generate` as an option for blocked factual proof questions.
- Reject `auto_generate` with a machine-readable unresolved/error entry.
- Extend factual risk detection to product/showcase roles when content implies real brand, SKU, package, store, screenshot, certificate, customer, or site evidence.
- Make prompts for safe generated images explicitly say "generic category visual, not real product proof" unless the user explicitly requested fictional preview assets.

Acceptance:

- Blocked factual pages cannot be converted into generated proof images.
- Answers that try `auto_generate` for blocked pages leave the gate unresolved and do not write `generatedAssetPrompt` to the resolved plan.
- Tests cover real customer/site/screenshot and product/SKU evidence cases.
- Generated product visuals are classified separately from real proof assets.

Suggested owner: Asset gate agent.

### P0-08 Stale Metadata Normalization And Conflict Audit

Problem: `normalizeSlide()` already removes some incompatible `layoutVariant`, `variant`, `proofObject`, and `chartSpec` fields, but stale route metadata is still handled field-by-field. Old `dataComponent`, `componentPlan`, `compositionPlan`, `assetGeneration`, or generated-image hints can survive a route change and later influence planner, renderer, visual QA, or asset decisions.

Files:

- `scripts/design-system.js`
- `scripts/generate_pptx.js`
- `scripts/test_metadata_policy.js`
- `scripts/test_routing.js`
- `scripts/test_composition_planner.js`

Work:

- Create one normalization conflict policy for route-sensitive fields: `variant`, `layoutVariant`, `proofObject`, `chartSpec`, `dataComponent`, `componentPlan`, `compositionPlan`, `assetGeneration`, `generatedAssetPrompt`, `referenceRecipe`, and legacy aliases.
- Record a machine-readable `routeSanitization` or `normalizationAudit` per slide with `active`, `suppressed`, `removed`, `recomputed`, `reason`, and `previousValueRef` entries.
- Preserve stale values only in audit fields such as `previousChartSpec` or `normalizationAudit`; do not leave them in fields later consumed by routing, rendering, or QA.
- Recompute component plans and asset-generation decisions after stale route fields are suppressed.
- Mark old asset decisions as `staleForRoute` if the page family, image role, or proof object changed.
- Write normalization audit summaries into render-meta.
- Add regression tests for stale portfolio/product/gallery/chart metadata being carried into incompatible page families.

Acceptance:

- A slide cannot route as `portfolio-table` while still carrying active `product-evidence-story`, gallery, chart, or generated-image obligations from an older variant.
- Render-meta makes every suppressed route-sensitive field auditable.
- Explicit compatible metadata still survives normalization and is not over-cleaned.
- Tests prove stale `chartSpec`, `dataComponent`, `componentPlan`, `referenceRecipe`, and asset-generation hints no longer change renderer behavior after route normalization.
- Formal render cannot use a generated, skipped, or bound asset decision that is stale for the current page family.

Suggested owner: Normalization / contract agent.

### P0-09 Planner Output Immutability At Render Time

Problem: `generate_pptx.js` normalizes the input plan at render time, which is useful for compatibility but dangerous for formal flows. A planner-approved deck can be silently retyped, re-variant-ed, or have `componentPlan`, `chartSpec`, and `assetGeneration` changed by the renderer entrypoint.

Files:

- `scripts/generate_pptx.js`
- `scripts/design-system.js`
- `scripts/test_orchestration_contract.js`
- `scripts/test_routing.js`

Work:

- Add explicit normalization modes such as `compat`, `strict`, and `finalized`.
- Compute and record input plan hash, normalized plan hash, normalization mode, and per-slide diff in render-meta.
- For planner-finalized plans, disallow renderer-time changes to `type`, `layoutVariant`, `componentPlan`, `chartSpec`, `assetGeneration`, and bound visual decisions unless a documented migration policy allows them.
- Add a formal-mode failure when a finalized plan changes route-sensitive fields during render.
- Keep draft compatibility behavior available for hand-authored legacy examples, but audit every mutation.

Acceptance:

- A finalized plan with a stale or unknown route fails with an explicit contract error instead of being silently repaired into a different page family.
- Render-meta can prove whether the renderer consumed the planner output as-is or normalized it.
- Tests cover unchanged finalized plans, repaired legacy plans, and rejected finalized-plan mutations.

Suggested owner: Contract / orchestration agent.

## P1 Tasks

### P1-01 Component Plan V2 As Hard Contract

Problem: current component plan is mostly a hint list. Renderer can repair, reroute, or claim consumption without checking mode, data, or slot constraints.

Files:

- `scripts/design-system.js`
- `scripts/generate_pptx.js`
- `scripts/visual_qa.js`

Work:

- Extend component plan fields: `allowedModes`, `dataRequirements`, `slotPolicy`, `repairPolicy`, `priority`.
- Add plan-vs-render diff to render-meta.
- Add visual QA output `componentPlanDiff` that compares required flag, mode, slot, data requirements, repair policy, priority, and actual renderer evidence.
- Disallow unplanned required component repair unless `repairPolicy` permits it.
- Add QA findings for mode mismatch and missing required data.

Acceptance:

- A plan requiring native consumption fails if renderer only overlays it.
- A required component with missing data fails before visual delivery or is explicitly downgraded.
- Native-only rendered through overlay, overlay-only claimed by native ownership, and "rendered" components with missing data all fail in formal mode.
- Render-meta makes every repair/downgrade auditable.

Suggested owner: Contract / planner agent.

### P1-02 Strict ChartSpec Consumption

Problem: render stage can reroute chart specs or render `informationGap` for unknown chart kinds, masking planner defects.

Files:

- `scripts/generate_pptx.js`
- `scripts/components/chart-renderer.js`
- `scripts/chart-spec.js`
- `scripts/test_chart_spec.js`

Work:

- Only consume planner-provided `chartSpec/v1` in strict mode.
- Unknown chart kind fails unless the planner explicitly requested `informationGap`.
- Add `chartSpec.source = planner | repair | explicit-gap`.
- Add tests for missing chartSpec, unknown chart kind, and explicit gap.

Acceptance:

- A stale process/timeline slide cannot create chart overlays at render time.
- Unknown chart kind is visible as a QA failure.
- Chart repair paths are explicit in meta.

Suggested owner: Chart contract agent.

### P1-03 Overlay Slot Strictness

Problem: default safe overlay zones and hardcoded slot fallbacks allow old overlays to reappear in native layouts.

Files:

- `scripts/generate_pptx.js`
- `scripts/visual_qa.js`
- `scripts/test_composition_planner.js`

Work:

- Overlay renderers may use only slots declared by the active native renderer contract.
- Remove or legacy-gate `slot || hardcoded bbox` patterns.
- Add QA finding for any overlay drawn without a declared safe slot.
- Add regression fixture where an old overlay would cover native content.

Acceptance:

- No overlay is drawn without a contract slot in formal mode.
- Native occupied zones block unsafe overlays.
- Old fallback coordinates cannot appear unless legacy mode is explicit and audited.

Suggested owner: Renderer / overlay agent.

### P1-04 Rendered Count Checks For Cards, Rows, Metrics, And Images

Problem: a renderer can omit one item, card, or table row while component consumption still passes.

Files:

- `scripts/generate_pptx.js`
- `scripts/visual_qa.js`
- `scripts/test_component_screenshot_qa.js`

Work:

- Record native rendered counts for cards, table rows, metrics, images, captions, and process phases.
- Compare expected counts from plan fields (`cards`, `items`, `metrics`, `rows`, `phases`, `images`) with actual rendered counts.
- Allow renderer-specific policies for capped lists and intentional summarization.

Acceptance:

- A 4-phase closed-loop plan cannot render only 3 cards without a QA failure or explicit summarization note.
- Portfolio tables report rendered row counts.
- Case-gallery reports image/caption counts.

Suggested owner: Visual QA / render-meta agent.

### P1-05 General Text And Shape Overlap Detection

Problem: current overlap checks are too narrow and do not catch text-card, text-text, or later opaque shape coverage reliably.

Files:

- `scripts/visual_qa.js`
- `scripts/generate_pptx.js`

Work:

- Parse shape order, bbox, opacity, fill, and text presence.
- Detect later opaque shapes covering text or cards beyond threshold.
- Add decorative/background exceptions through render-meta.
- Keep existing line/arrow checks but unify output under overlap QA.

Acceptance:

- A rectangle drawn over text fails.
- A decorative background does not false-positive when declared.
- Findings include slide, object ids or approximate bboxes, overlap area ratio, and severity.

Suggested owner: Visual QA agent.

### P1-06 Validate PPTX Runs Visual QA In Formal Mode

Problem: `validate_pptx.js` can succeed while visual QA would fail.

Files:

- `scripts/validate_pptx.js`
- `scripts/visual_qa.js`
- `references/file-level-pptx-acceptance.md`

Work:

- Add a one-command formal preset, for example `node scripts/validate_pptx.js deck.pptx --formal --plan plan.json --preview-dir preview`.
- Add `--run-visual-qa`, `--plan`, and quality-mode defaults that forward options consistently to `visual_qa.js`.
- Include visual QA summary in validate output under a stable JSON key such as `visualQa`.
- Exit non-zero when visual QA has fail-level findings.
- Document the standard validation command for formal decks.
- Add or update a package script for formal validation.

Acceptance:

- One command can validate structure, preview generation, language, component consumption, and visual layout.
- Formal decks cannot pass validation with fail-level visual QA.
- The command output includes visual QA success, fail count, review count, and findings without forcing reviewers to run a second script.

Suggested owner: QA integration agent.

### P1-07 Asset Binding Writes Unified Provenance

Problem: generated or provided assets are recorded in `assetAttribution`, while formal gates inspect `sourceTrace.imageProvenance`.

Files:

- `scripts/bind_generated_assets.js`
- `scripts/design-system.js`
- `assets/media/ATTRIBUTION.md`
- `scripts/test_asset_decision_gate.js`

Work:

- When binding an image, write both human-readable attribution and machine-readable `sourceTrace.imageProvenance`.
- Validate file existence, image dimensions, and basic format before binding.
- Reject out-of-range slide numbers, empty mappings, unsupported file types, unreadable dimensions, and missing paths with `errors[]` and non-zero exit.
- Count `boundSlides` from actual successful writes, not mapping keys.
- Distinguish `user-owned`, `public-licensed`, `model-generated-preview`, `model-generated-illustration`, and `synthetic-only`.
- Keep factual proof status from being upgraded by generated images.

Acceptance:

- Formal asset authorization gate can evaluate bound images without manual patching.
- Invalid mappings return errors and do not count as bound.
- A mapping that silently binds nothing is impossible; it either writes provenance or fails.
- Generated images do not become factual proof unless explicitly backed by user-provided evidence.

Suggested owner: Asset pipeline agent.

### P1-08 Asset Decisions Must Be Auditable In Render-Meta

Problem: `skip_image` currently downgrades image-led pages into structural pages without leaving enough trace for QA or delivery notes. The same gap exists for `auto_generate`, `provide_assets`, and `bound` decisions: delivery reviewers cannot reliably tell whether a page used real proof, synthetic preview art, or structure-only fallback.

Files:

- `scripts/deck_asset_decision_gate.js`
- `scripts/design-system.js`
- `scripts/generate_pptx.js`

Work:

- Write `assetDecision.action = 'skip_image'`, original role, reason, and risk level into resolved plan.
- Record every asset decision in render-meta: action, original role, resolved role, risk level, source, bound asset count, provenance class, and proof eligibility.
- Preserve a delivery note or QA finding for skipped critical proof visuals.
- Render-meta should include skipped visual decisions.
- Make visual QA list all critical image-led pages whose asset decision is skipped, generated-only, or unbound.

Acceptance:

- A user or reviewer can see which pages skipped product/site/screenshot visuals.
- A user or reviewer can also see which pages used generated previews, user-provided assets, public-licensed assets, or synthetic-only illustration.
- Commercial QA can review or fail critical skipped image decisions.
- The system no longer silently claims "layout can render natively" when a high-value visual was skipped.

Suggested owner: Asset gate agent.

### P1-09 Formal Mode Severity Matrix

Problem: several checks mention "formal mode," but the scripts do not share one severity model. A fallback renderer, skipped image, stale metadata suppression, unreadable text risk, or visual QA warning can mean different things depending on whether the run is draft, formal review, or delivery.

Files:

- `scripts/generate_pptx.js`
- `scripts/visual_qa.js`
- `scripts/validate_pptx.js`
- `scripts/deck_asset_decision_gate.js`
- `references/file-level-pptx-acceptance.md`

Work:

- Define a shared `qualityMode = draft | formal | delivery`.
- Add CLI support where needed, for example `--quality-mode formal`, while keeping existing commands backwards compatible.
- Maintain a severity matrix for fallback routing, unknown components, blocked overlays, skipped critical assets, stale metadata suppression, shrink risk, blank-body risk, and screenshot baseline drift.
- Put `qualityMode` and applied severity policy into render-meta and QA output.
- Document the standard commands for draft preview, formal review, and delivery validation.

Acceptance:

- The same deck can run in draft mode with review findings and in formal/delivery mode with fail-level findings where appropriate.
- `validate_pptx.js` and `visual_qa.js` agree on pass/fail severity for the same run.
- QA output explains whether a finding is intrinsically fatal or fatal because of the selected quality mode.

Suggested owner: QA integration / release gate agent.

### P1-10 Render-Meta Schema Gate

Problem: render-meta is now the backbone for contract QA, but it is still consumed ad hoc. Missing fields can make visual QA skip checks or misclassify defects.

Files:

- `scripts/generate_pptx.js`
- `scripts/visual_qa.js`
- `scripts/validate_pptx.js`
- new or extended render-meta schema test

Work:

- Define a versioned render-meta schema for formal runs.
- Require per-slide fields for renderer match, native contract, planned components, consumed/drawn components, route sanitization, chart decision, asset decision, and text box/readability metadata.
- Validate slide count, slide indexes, schema version, and required field presence before running dependent QA.
- Fail formal QA when render-meta is missing, malformed, stale, or has fewer slides than the PPTX/plan.
- Add schema tests with one valid meta fixture and several missing-field negative fixtures.

Acceptance:

- Visual QA cannot silently pass because a required render-meta field is absent.
- Schema errors name the exact missing path and slide number.
- `validate_pptx.js --formal` fails when render-meta is missing or incompatible.

Suggested owner: QA integration / render-meta agent.

### P1-11 Generated Asset Proof Boundary Audit

Problem: generated visuals are useful for premium-looking previews, but they must not satisfy factual proof requirements for real brands, products, customers, stores, screenshots, certificates, sites, employees, or metrics.

Files:

- `scripts/bind_generated_assets.js`
- `scripts/design-system.js`
- `scripts/visual_qa.js`
- `scripts/test_commercial_readiness_qa.js`
- `scripts/test_asset_decision_gate.js`

Work:

- Add `proofEligibility = factual-proof | generic-category | synthetic-only | illustration-only` to bound image provenance and render-meta.
- In source-trace/commercial readiness QA, fail factual proof slides whose only image provenance is `model-generated-*` or `synthetic-only`.
- Allow generated visuals for concept, mood, generic category, and synthetic preview roles, but label them clearly as not factual proof.
- Ensure generated product/category visuals never upgrade `assetAuthorizationStatus` or factual source-trace status by themselves.

Acceptance:

- A factual proof slide with generated-only provenance fails or is explicitly downgraded to synthetic illustration.
- User-owned or public-licensed cleared images can satisfy proof-image requirements.
- QA output distinguishes "visually acceptable generated preview" from "authorized factual evidence."

Suggested owner: Asset QA / commercial readiness agent.

## P2 Tasks

### P2-01 Visual QA Negative Fixture Suite

Problem: there are not enough failing examples for the exact defects that have recurred in real decks.

Files:

- `scripts/test_component_screenshot_qa.js`
- `scripts/test_template_family_qa.js`
- new `scripts/test_visual_layout_qa.js`

Work:

- Add minimal decks or fixture metadata for blank body, missing card, text covered by shape, long Chinese shrink, overlay conflict, and baseline drift.
- Make the core negative suite executable without Keynote by using fixture PNGs, PPTX XML snippets, or render-meta stubs where possible.
- Ensure each fixture fails with the expected finding type.

Acceptance:

- Each recurrent defect has a small automated negative test.
- Test names map directly to the failure categories in this backlog.
- CI can run the negative logic tests even when preview export is unavailable; screenshot/export-dependent checks remain separately flagged.

Suggested owner: QA fixtures agent.

### P2-02 Asset Prompt Planner Execution Status

Problem: `asset_prompt_planner.js` reports blocked prompts but still exits successfully by default, so automation can ignore asset risks.

Files:

- `scripts/asset_prompt_planner.js`
- `scripts/material_orchestration_prompt.js`
- `package.json`

Work:

- Add top-level `status = ready | blocked | empty`.
- Add `--fail-on-blocked`.
- Ensure blocked pages are excluded from generation prompts.
- Add or document an npm/orchestration path that uses `--fail-on-blocked` before image generation.

Acceptance:

- CI or orchestration can stop when blocked assets exist.
- Prompt files are safe to feed into image generation without manually filtering blocked pages.
- `prompts[]` never contains blocked slides, and blocked slides remain visible in `blocked[]` with reasons.

Suggested owner: Asset pipeline agent.

### P2-03 Page Family Fixture Contract Upgrade

Problem: existing page-family fixture tests mostly prove files render; they should prove contract consumption and visual distinctness.

Files:

- `scripts/test_template_page_family_fixtures.js`
- `scripts/run_template_page_family_fixtures.js`
- `assets/template-readiness-matrix.json`

Work:

- Each fixture reads its `.render-meta.json`.
- Assert no fallback renderer for priority page families.
- Assert expected `rendererId` for priority page families where a renderer identity is declared.
- Assert no active stale route fields or route-sanitization failures.
- Assert no missing required components.
- Assert component consumption QA and overlay contract QA pass.
- Keep rendered preview proof in readiness matrix.

Acceptance:

- A page family is not complete unless route, renderer, component contract, visual QA, and preview evidence all pass.

Suggested owner: Template fixture agent.

### P2-04 Hardening Progress Dashboard

Problem: the project has several readiness matrices and QA scripts, but no single view tells whether the hardening chain is safe enough for batch delivery.

Files:

- `assets/template-readiness-matrix.json`
- `assets/template-component-readiness.json`
- `scripts/audit_template_readiness.js`
- new `assets/hardening-readiness-matrix.json`
- new `scripts/audit_hardening_readiness.js`

Work:

- Track every task family from this backlog with status, owner, blocking files, required tests, and rendered proof artifact.
- Link hardening readiness to template readiness so a page family cannot be "pass" if contract, asset, or visual QA gates are missing.
- Add an npm script, for example `npm run audit:hardening`.
- Fail the audit when any P0 task is missing tests or when delivery-mode validation is unavailable.

Acceptance:

- One command reports whether the skill is safe for draft, formal review, or delivery.
- P0 readiness cannot be claimed without tests and at least one rendered regression proof where visual output is affected.
- The dashboard points reviewers to exact missing scripts, fixtures, or preview artifacts.

Suggested owner: Fixture/readiness agent.

## Ready-To-Spawn Agent Packets

Use these as direct subagent briefs. Keep write scopes disjoint unless the parent agent is intentionally integrating overlapping work.

### Agent A: Contract And Routing

Owns:

- `scripts/render/registry.js`
- registry-related helpers in `scripts/generate_pptx.js`
- `scripts/test_routing.js`

Initial task:

- Implement P0-01, P0-09, and the render-meta parts needed by P0-02.
- Return changed files, tests run, and one before/after example of an unknown type or fallback route being caught.

Do not edit:

- asset gate scripts
- screenshot baseline logic
- template readiness matrices

### Agent B: Normalization And Component Contract

Owns:

- route-sensitive cleanup in `scripts/design-system.js`
- component-plan contract tests in `scripts/test_composition_planner.js`
- metadata normalization tests in `scripts/test_metadata_policy.js`

Initial task:

- Implement P0-03 and P0-08 as one coherent planner contract.
- Return the component manifest shape, normalization audit shape, and the regression cases added.

Do not edit:

- PPTX preview export logic
- asset binding scripts
- page-family visual renderers except where needed to consume the new contract fields

### Agent C: Visual QA And Validation

Owns:

- `scripts/visual_qa.js`
- `scripts/validate_pptx.js`
- `scripts/test_component_screenshot_qa.js`
- new visual QA negative fixtures

Initial task:

- Implement P0-04, P0-05, P0-06, P1-06, P1-09, and P1-10 in stages.
- Start with metadata-only assertions when screenshot export is unavailable, then add preview-based checks behind explicit flags.

Do not edit:

- asset decision gate behavior
- component planner rules

### Agent D: Asset Gate And Provenance

Owns:

- `scripts/deck_asset_decision_gate.js`
- `scripts/asset_prompt_planner.js`
- `scripts/bind_generated_assets.js`
- `scripts/test_asset_decision_gate.js`

Initial task:

- Implement P0-07, P1-07, P1-08, P1-11, and P2-02.
- Return examples for blocked factual proof, generated preview asset, skipped visual, and user-provided asset provenance.

Do not edit:

- renderer registry
- screenshot baseline QA

### Agent E: Fixture And Readiness Integration

Owns:

- `scripts/test_template_page_family_fixtures.js`
- `scripts/run_template_page_family_fixtures.js`
- `assets/template-readiness-matrix.json`
- hardening readiness dashboard files

Initial task:

- Implement P2-03 and P2-04 after Agents A-D expose the needed metadata.
- Return a readiness report that distinguishes draft-safe, formal-review-safe, and delivery-safe page families.

Dependency:

- Start after at least P0-01, P0-03, P0-04, P0-07, P0-08, and P0-09 have landed.

## Suggested Parallel Workstreams

These tracks are intentionally separated to avoid overlapping edits:

1. Contract track: P0-01, P0-02, P0-03, P0-08, P0-09, P1-01, P1-02, P1-03.
2. Visual QA track: P0-04, P0-05, P0-06, P1-04, P1-05, P1-06, P1-09, P1-10, P2-01.
3. Asset track: P0-07, P1-07, P1-08, P1-11, P2-02.
4. Fixture/readiness track: P2-03, P2-04 plus rendered acceptance decks after the first three tracks land.

Recommended order:

1. Land P0-01 through P0-09 before expanding new page families.
2. Add P1 render-meta fields before requiring strict QA everywhere.
3. Turn QA warnings into hard failures only after fixture coverage proves expected decks pass.
4. Regenerate acceptance decks and contact sheets after each track is merged.

## Current Evidence From Recent Beauty Deck Incident

The recent beauty deck exposed all four tracks:

- Planner/renderer contract: portfolio-table was planned with image/gallery/product components it did not consume.
- Overlay contract: stale KPI/product/chart overlays could appear from generic safe slots.
- Text QA: closed-loop cards shrank body text below readable size.
- Asset pipeline: old `skip_image` decisions forced structural pages and line-art/desensitized assets instead of generated product visuals.

Use the beauty deck as a regression fixture candidate:

- `out/beauty_brand_selection_ppt/deck-plan.codex-real-images.json`
- `out/beauty_brand_selection_ppt/Q3_beauty_brand_selection_20p.codex-real-images.pptx`
- `out/beauty_brand_selection_ppt/Q3_beauty_brand_selection_20p.codex-real-images.pptx.render-meta.json`
- `out/beauty_brand_selection_ppt/Q3_beauty_brand_selection_20p.codex-real-images.grid.png`
