# Template System Vertical Slice Task List

Purpose: turn the current reference index, recipe library, industry packs, renderer, orchestration, and QA into a visibly new commercial PPT template system. A task is not complete when metadata routes correctly. It is complete only when rendered PPT previews prove that the page family has a distinct visual grammar.

## Completion Rule

Every page-family or industry task must ship six pieces of evidence:

1. Reference recipe: samples are mapped to structured fields and scores.
2. Visual grammar: layout rules are written in concrete visual terms.
3. Renderer: PPTX generation has a distinct renderer or distinct variant branch.
4. Orchestration: model planning can select the page family and required proof object.
5. QA gate: tests catch fallback, weak evidence, repetition, and semantic color drift.
6. Rendered proof: fixture PPTX and preview PNG show the result is visually different from the old template.

Do not mark a task complete if it only adds tags, recipe entries, route names, or passing structural tests.

## Phase 0: Readiness Matrix

- [x] Create `assets/template-readiness-matrix.json`.
- [x] Track every high-value page family with these statuses: `recipe`, `visualGrammar`, `renderer`, `orchestration`, `qa`, `fixturePptx`, `previewPng`, `acceptanceDeck`.
- [x] Use only `missing`, `partial`, or `pass`.
- [x] Add a script `scripts/audit_template_readiness.js`.
- [x] Fail the audit when any page family has `renderer: missing` or no rendered preview.
- [x] Add an npm script, for example `npm run audit:templates`.

Definition of done:

- [x] Matrix includes all 20 priority page families.
- [x] Audit report shows current gaps honestly, including renderer fallback gaps.
- [x] Matrix distinguishes "recipe exists" from "visual style visible in PPT".

## Phase 1: Page Family Vertical Slices

Build page families one by one. Each page family must go from references to screenshot in the same task.

### 1.1 Financial Page Families

#### `financial-kpi-snapshot`

- [x] Select 3-5 finance/IR reference samples.
- [x] Write visual grammar: primary KPI hierarchy, supporting metric strip, source note, disclosure density, accent color role.
- [x] Add or split renderer branch that is not the same as generic `metric-comparison`.
- [x] Add fixture plan `examples/fixtures/financial-kpi-snapshot.json`.
- [x] Generate one-page PPTX and PNG preview.
- [x] Add QA that fails if it falls back to the old metric dashboard.

#### `chart-grid-with-commentary`

- [x] Define chart grid variants: 2x2, 3-chart with side commentary, trend with bottom insight bar.
- [x] Add renderer support for commentary placement, not just metric cards.
- [x] Add fixture with at least three charts or chart-like proof objects.
- [x] QA must verify commentary exists and is visually tied to data.
- [x] Add before/after contact sheet against old finance dashboard.

#### `quarterly-results-summary`

- [x] Define quarterly results grammar: period label, reported metric block, variance explanation, management action.
- [x] Add renderer branch distinct from `financial-kpi-snapshot`.
- [x] Fixture must include revenue, margin, cash flow, and guidance.
- [x] QA must verify period/source labels are present.
- [x] Preview must look like a results summary, not a generic KPI page.

#### `guidance-and-risk-board`

- [x] Define risk guidance grammar: assumption, risk, trigger, owner/action.
- [x] Add renderer branch or refactor `riskControlStack` so this family is visually distinct.
- [x] Fixture must include at least four risks with triggers.
- [x] QA must verify risk/action/trigger columns or equivalent structure.
- [x] Add acceptance slide into financial deck.

### 1.2 Integrated Report And Strategy Page Families

#### `value-creation-process-map`

- [x] Select integrated report references with value creation diagrams.
- [x] Define input, activity, output, outcome, capital/proof grammar.
- [x] Add renderer distinct from generic strategy map.
- [x] Fixture must include drivers, actions, outcomes, and source note.
- [x] QA must verify visible flow direction and outcome proof.

#### `materiality-matrix-board`

- [x] Define matrix axes, priority zones, stakeholder/business impact labels.
- [x] Add real matrix renderer, not only a risk table.
- [x] Fixture must include positioned topics.
- [x] QA must verify two axes and placed items.

#### `sustainability-proof-spread`

- [x] Define proof spread grammar: evidence image, metric, initiative, source note.
- [x] Add renderer with image proof plus ESG/impact caption.
- [x] Fixture must include at least two proof images or generated placeholder assets.
- [x] QA must verify image evidence is captioned.

#### `governance-table-editorial`

- [x] Define editorial governance table grammar: responsibility, cadence, evidence, decision.
- [x] Refactor renderer so it differs from generic risk table.
- [x] Fixture must include board/committee/owner rows.
- [x] QA must verify governance terms and responsibility fields.

### 1.3 Culture And Company Page Families

#### `culture-cover-with-soft-geometry`

- [x] Define cover grammar: soft geometry, people/culture signal, minimal metadata.
- [x] Add renderer branch separate from beauty/editorial cover.
- [x] Fixture must include organization, audience, mission line.
- [x] Preview must look recruiting/culture specific.

#### `mission-statement-stage`

- [x] Define mission stage grammar: big statement, proof principles, behavior evidence.
- [x] Add renderer branch or strengthen manifesto renderer.
- [x] Fixture must include mission plus 3-4 behavior principles.
- [x] QA must fail empty slogans without behavior proof.

#### `people-proof-mosaic`

- [x] Define people evidence wall grammar: role, scene, output, caption.
- [x] Add renderer distinct from generic case-gallery.
- [x] Fixture must include three or more people/team proof assets.
- [x] QA must verify every image has role/caption evidence.

#### `value-principle-cards`

- [x] Define value cards grammar: principle, observable behavior, proof example.
- [x] Add renderer branch distinct from generic card grid.
- [x] Fixture must include four principles with behavior proof.
- [x] QA must fail principle cards with only titles.

### 1.4 Beauty And Consumer Brand Page Families

#### `beauty-brand-editorial-cover`

- [x] Define beauty cover grammar: product/texture/brand world hierarchy, restrained redline or warm premium palette.
- [x] Add renderer branch distinct from generic image cover.
- [x] Fixture must include brand, product line, visual subject.
- [x] Preview must visibly differ from finance/company covers.

#### `brand-world-and-business-proof`

- [x] Define grammar: brand world, product promise, channel/member/business proof.
- [x] Add renderer separate from generic strategy map.
- [x] Fixture must include drivers, actions, outcomes, and product proof.
- [x] QA must verify brand and business proof appear on the same slide.

#### `consumer-proof-photo-grid`

- [x] Define consumer grid grammar: scene, reason, repeat/purchase signal.
- [x] Add renderer with visible three-part or four-part proof grid.
- [x] Fixture must include consumer scenes and captions.
- [x] QA must fail uncaptioned pretty-photo grids.
- [x] Add before/after preview against old case-gallery.

#### `product-evidence-story`

- [x] Define product story grammar: hero product, texture/detail, claim, evidence caption.
- [x] Add renderer distinct from `consumer-proof-photo-grid`.
- [x] Fixture must include product cards, benefits, and proof note.
- [x] QA must verify product proof is not only decorative.

### 1.5 General Premium Business Page Families

#### `airy-concept-opening`

- [x] Define airy opening grammar: abstract concept, generous whitespace, one proof object or metaphor.
- [x] Add renderer not tied to beauty references.
- [x] Fixture must include a non-beauty business opening.
- [x] QA must verify it does not pick beauty-specific cover styling for SaaS/lifestyle/general decks.

#### `single-object-concept-map`

- [x] Define single-object map grammar: one central object, surrounding forces, outcome.
- [x] Add renderer distinct from generic strategy map.
- [x] Fixture must include one central concept and 4-6 related nodes.
- [x] QA must verify a single visual center exists.

#### `executive-proof-board`

- [x] Define executive proof grammar: claim, evidence set, decision implication.
- [x] Add renderer branch for board/executive proof.
- [x] Fixture must include mixed evidence: metric, quote, case, risk.
- [x] QA must verify proof items connect to a decision.

#### `premium-closing-anchor`

- [x] Define closing grammar: final decision, next actions, contact or owner, visual anchor.
- [x] Add renderer that varies by industry.
- [x] Fixture must include actions and contact/next step.
- [x] QA must fail closing pages with only "thank you" unless the deck explicitly asks for that.

## Phase 2: Component Library Hardening

Each component must have fixtures and visual proof in at least two different page families.

- [x] KPI primary metric component: supports hero KPI, compact metric strip, comparison metric.
- [x] Chart commentary component: supports side commentary, bottom insight bar, and callout marker.
- [x] Caption image evidence component: supports dark caption bar, light caption bar, opt-in source note.
- [x] Product/case proof gallery: supports hero-plus-supporting, 3-column proof grid, contact-sheet gallery.
- [x] Value creation flow: supports input-output, value chain, process loop.
- [x] Risk matrix: supports 2x2 matrix, risk queue, control stack.
- [x] Governance table: supports owner/cadence/evidence/decision columns.
- [x] People/team evidence wall: supports role captions and scene-output captions.
- [x] Brand world hero: supports image-led brand proof and business proof side panel.
- [x] Chrome components: industry label, opt-in source note, page number, chapter rail, dark sidebar.

Component QA:

- [x] Add `componentFixtureQA`.
- [x] Add checks for text overflow in fixed component slots.
- [x] Add checks for image/caption pairing.
- [x] Add checks that source evidence stays internal by default and source-note visibility remains opt-in.

## Phase 3: Industry Pack Vertical Acceptance

Each industry pack must prove that its recommended page families appear in an 8-12 page deck. Do not count an industry pack complete if it only changes palette or labels.

### Finance / Financial Results / Investor Relations

- [x] Must include quarterly results summary, return bridge, portfolio/action table, guidance/risk board.
- [x] Must show units, period/source, risk/action relation.
- [x] Acceptance deck must pass finance visual QA and contact sheet review.

### Manufacturing / Industrial / Energy

- [x] Must include production topology, OEE/operation metric, site evidence, closed-loop delivery.
- [x] Must show equipment/site proof, not abstract diagrams only.
- [x] Acceptance deck must pass image evidence QA.

### SaaS / AI / Technology Services

- [x] Must include platform capability map, prototype flow, adoption funnel, permission/governance.
- [x] Must avoid fake UI or decorative AI shapes without workflow proof.
- [x] Acceptance deck must show product-platform grammar in previews.

### Beauty / Consumer Brand / Retail

- [x] Must include brand world, product evidence, consumer proof grid, member growth.
- [x] Must prove photos have brand/product/business roles.
- [x] Acceptance deck must visibly differ from SaaS/finance layouts.

### Healthcare / Care / Wellness

- [x] Must include service blueprint, quality handoff, patient scorecard, responsibility loop.
- [x] Must account for privacy and clinical quality boundaries.
- [x] Acceptance deck must show service path and handoff logic.

### Food / Tourism / Fashion

- [x] Must include place/product gallery, customer journey map, conversion scorecard, operating assurance.
- [x] Must use images as inspectable proof, not atmosphere.
- [x] Acceptance deck must show experience route and conversion logic.

### Government / Park / State-Owned Enterprise Reporting

- [x] Must include policy context board, resource map, governance model, risk assurance.
- [x] Must include source/date/sensitivity guardrails.
- [x] Acceptance deck must avoid festive or generic administrative styling.

### Recruiting / Culture / Company Introduction

- [x] Must include mission stage, people proof mosaic, value principle cards, growth path or contact closing.
- [x] Must prove values with behavior, not slogans.
- [x] Acceptance deck must include contact or next-step handoff.

## Phase 4: LLM Orchestration Contract

The LLM planning step must output data that the renderer can actually consume.

- [x] Given a brief, detect industry, audience, material type, and decision goal.
- [x] Retrieve industry pack and top reference recipes.
- [x] Generate recommended outline and page structure.
- [x] Ask missing information questions when proof objects require unavailable facts/assets.
- [x] Output page-level `themeIntent`.
- [x] Output page-level `proofObject`.
- [x] Output page-level `layoutVariant`.
- [x] Output page-level `componentHints`.
- [x] Output `referenceRecipeIds`.
- [x] Output asset requirements and source/provenance notes.
- [x] Hand the plan to `scripts/generate_pptx.js` without manual repair.

Contract QA:

- [x] Add fixture briefs for all 8 industries.
- [x] Add parser/contract tests for all required fields.
- [x] Fail if `layoutVariant` is generic when a high-value page family is expected.
- [x] Fail if missing info is silently ignored.

## Phase 5: Visual Difference And Fallback QA

Add QA that catches the exact failure mode discussed: metadata says "new page family", but PPT still looks like old templates.

- [x] `rendererFallbackQA`: fail when a high-value page family routes into an old generic renderer without an approved variant branch.
- [x] `templateNoveltyQA`: compare new preview against baseline old preview and flag excessive similarity.
- [x] `referenceGrammarQA`: verify rendered slide contains the expected visual grammar markers.
- [x] `pageFamilyCoverageQA`: deck must include a minimum number of industry-specific page families.
- [x] `proofObjectVisibleQA`: proof object must be visible in structure, not only in JSON.
- [x] `contactSheetRhythmQA`: contact sheet must show visibly different slide rhythms.

Baseline artifacts:

- [x] Save old contact sheets as baseline references.
- [x] Generate before/after sheets for each upgraded page family.
- [x] Record remaining similarity issues in a QA log.

## Phase 6: Final End-to-End Acceptance

Final acceptance is not a single green test. It requires all evidence below.

- [x] `assets/template-readiness-matrix.json` shows all 20 page families as pass.
- [x] Every page family has fixture PPTX and preview PNG.
- [x] Every component has at least two fixture uses.
- [x] 8 industry decks generate successfully.
- [x] 8 industry decks each contain 8-12 slides.
- [x] 8 industry decks each pass four acceptance QA checks.
- [x] 8 industry decks have contact sheets.
- [x] Contact sheets show clear visual differences by industry and page family.
- [x] QA log records issues found and the corresponding renderer/recipe/QA fix.
- [x] Full test suite passes.
- [x] `git diff --check` passes.

## Evidence Log

- Reference recipes: `assets/reference-recipe-library.json` contains 1548 structured recipes; `npm run test:references` requires every one of the 20 priority page families to have a searchable recipe.
- Readiness matrix: `assets/template-readiness-matrix.json`; `npm run audit:templates` reports all 20 page families as `pass` for recipe, visual grammar, renderer, orchestration, QA, fixture PPTX, preview PNG, and acceptance deck.
- Page-family fixtures: `outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/template-page-family-fixtures/manifest.json`; contact sheet: `outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/template-page-family-fixtures/contact-sheets/template-page-families.contact-sheet.svg`.
- Novelty QA: `outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/template-page-family-fixtures/qa/template-novelty-report.json`; before/after sheet: `outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/template-page-family-fixtures/contact-sheets/template-page-families.before-after.svg`.
- Component readiness: `assets/template-component-readiness.json`; `npm run test:component-fixtures` verifies every component has at least two rendered page-family uses.
- Industry acceptance: `outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/industry-template-system-acceptance/manifest.json`; all 8 decks pass with 8-12 slides, preview PNGs, visual QA, acceptance QA, and contact sheets.
- Industry QA log: `outputs/019e583b-b589-7043-8c51-700ce5757a00/presentations/industry-template-system-acceptance/qa/industry-acceptance-qa-log.md`.
- Orchestration contract: `npm run test:orchestration-contract`, `npm run test:orchestration`, and `npm run test:materials` verify industry detection, reference retrieval, missing-info handling, page-level `themeIntent`, `proofObject`, `layoutVariant`, `componentHints`, `referenceRecipeIds`, asset requirements, and handoff to `scripts/generate_pptx.js`.
- Final verification commands run: `npm run test:template-fixtures`, `npm run test:template-family-qa`, `npm run test:template-novelty`, `npm run test:component-fixtures`, `npm run test:references`, `npm run test:acceptance`, `npm run test:routing`, `npm run test:intelligence`, `npm run test:composition`, `npm run test:art-direction`, `npm run test:rhythm-planner`, `npm run test:density`, `npm run test:image-layout`, `npm run test:semantic`, `npm run test:metadata`, `npm run test:connectors`, `node --check` on changed scripts, and `git diff --check`.

## Recommended Execution Order

1. Build Phase 0 readiness matrix first.
2. Upgrade five highest-impact page families:
   - `quarterly-results-summary`
   - `chart-grid-with-commentary`
   - `value-creation-process-map`
   - `consumer-proof-photo-grid`
   - `people-proof-mosaic`
3. Add fallback and novelty QA before upgrading the remaining page families.
4. Upgrade the rest of the 20 page families.
5. Harden shared components.
6. Re-run 8 industry acceptance decks.
7. Review contact sheets manually and fix the weakest three slides.
8. Mark completion only after matrix, fixtures, QA, decks, and contact sheets all prove the system changed visually.

## Task Template For Future Work

Use this exact shape for each implementation ticket:

```md
Complete `<page-family>` vertical slice.

Scope:
- Reference samples:
- Visual grammar:
- Renderer branch:
- Orchestration fields:
- QA gates:
- Fixture plan:
- Rendered PPTX:
- Preview PNG:
- Before/after contact sheet:

Done when:
- Route selects `<page-family>`.
- Renderer does not fall back to a generic component.
- Preview shows the intended visual grammar.
- QA catches missing proof/caption/source/semantic color issues.
- Acceptance deck includes this page family without manual repair.
```
