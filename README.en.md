# Enterprise PPT Skill for Codex

A high-quality presentation generation skill for Chinese commercial decks. It turns user materials, meeting notes, industry data, product copy, or short prompts into structured, polished, editable, and verifiable PPTX decks.

The project can run as a Node.js script pipeline, but it works best inside Codex: Codex can inspect local materials, follow the skill contract, ask for missing decisions, bind assets, generate PPTX files, export previews, run QA, and iterate on renderer fixes. When a layout needs a strong visual and no suitable image is available, the skill can also generate images after the user chooses that path.

## Preview

The examples below are generated outputs from the current project: image-led covers, no-image structured covers, industry-specific dark covers, data pages, and decision pages.

<table>
  <tr>
    <td width="50%">
      <img src="docs/readme/executive-memo-cover.png" alt="Executive memo cover" width="100%">
      <br>
      <sub>Executive memo / paper sculpture visual</sub>
    </td>
    <td width="50%">
      <img src="docs/readme/beauty-brand-cover.png" alt="Beauty brand operating review cover" width="100%">
      <br>
      <sub>Beauty brand operating review / product scene visual</sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/readme/online-edu-cover.png" alt="Online education operating review cover" width="100%">
      <br>
      <sub>Online education operating review / no-image structured cover</sub>
    </td>
    <td width="50%">
      <img src="docs/readme/ev-charging-cover.png" alt="EV charging service operating review cover" width="100%">
      <br>
      <sub>EV charging service / industry-specific dark cover</sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/readme/online-edu-trend.png" alt="Online education monthly revenue trend" width="100%">
      <br>
      <sub>Monthly trend / evidence card plus line chart</sub>
    </td>
    <td width="50%">
      <img src="docs/readme/beauty-profit-trend.png" alt="Beauty brand monthly profit trend" width="100%">
      <br>
      <sub>Profit trend / chart plus diagnostic cards</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="docs/readme/online-edu-closing.png" alt="Online education closing decision slide" width="100%">
      <br>
      <sub>Closing decision / action cards plus decision summary</sub>
    </td>
  </tr>
</table>

## Why Use It In Codex

- **Local materials, local pipeline**: Codex can read the material folder, run ingestion, prepare model prompts, accept extraction results, and keep artifacts in the same workspace.
- **Missing inputs become explicit choices**: when imagery, brand assets, evidence fields, or key metrics are missing, the pipeline asks the user to provide assets, generate images, use a structured no-image layout, or adjust the story.
- **Generation and revision stay in one loop**: Codex can generate the PPTX, export previews, inspect layout issues, patch renderers, and run regression checks.
- **Built for commercial decks**: each slide centers on one claim and one proof object, using real materials, data views, process diagrams, matrices, evidence cards, and industry-specific layouts.

## Quick Start

```bash
npm install
npm test
npm run sample
```

Generate from an existing deck plan:

```bash
node scripts/generate_pptx.js examples/sample-deck-plan.json out/sample.pptx
```

Validate PPTX structure and text:

```bash
node scripts/validate_pptx.js out/sample.pptx --expect-slides 10 --require 新能源,告警
```

Export previews and run visual QA:

```bash
node scripts/validate_pptx.js out/sample.pptx --expect-slides 10 --preview-dir out/preview
node scripts/visual_qa.js out/sample.pptx --preview-dir out/preview --plan examples/sample-deck-plan.json
```

## Material-To-Deck Pipeline

Real materials use the staged pipeline:

```text
raw materials
  -> scripts/material_ingest.js
  -> scripts/material_orchestration_prompt.js
  -> source audit / story architecture / clarification / extraction / critic
  -> scripts/material_to_deck_plan.js
  -> scripts/deck_asset_decision_gate.js
  -> scripts/resolve_visual_assets.js
  -> scripts/generate_pptx.js
  -> scripts/validate_pptx.js
  -> scripts/visual_qa.js
```

One-command delivery entry:

```bash
npm run materials:deliver -- <materials...> --out-dir out/delivery-run --model-json out/material-extraction.json --quality-mode formal
```

Without `material-extraction.json`, the delivery pipeline stops at the model extraction prompt so a model or human reviewer can provide the structured result. Small low-risk materials can use `--auto-draft` for an internal draft.

## Image And Asset Policy

- Prefer user-provided brand, product, scene, and data assets when available.
- If a layout needs a hero visual and no suitable image exists, Codex asks the user to provide an asset, generate an image, or switch to a structured no-image layout.
- Generated images improve visual expression and industry context; test notes, placeholder text, and pipeline explanations are not written into client-facing slides.
- Renderers consume bound `imagePath` values or structured visual configuration. Asset decisions happen before PPTX rendering.

## Design Contract

- One clear claim per slide.
- One proof object per slide: diagram, matrix, process, evidence view, data view, risk board, comparison, or value signal.
- Chinese decks use Chinese visible microcopy by default; brand names, product names, URLs, emails, stock codes, and standard abbreviations can remain as-is.
- Images must serve evidence, product, scene, people, place, or mood duties, not random decoration.
- No visible test, placeholder, acceptance, internal pipeline, or TODO copy in user-facing slides.

## Commands

Material pipeline:

```bash
npm run materials:ingest -- <materials...> --out out/material-bundle.json
npm run materials:orchestrate -- --bundle out/material-bundle.json --out-dir out/model-orchestration
npm run materials:plan -- --bundle out/material-bundle.json --model-json out/material-extraction.json --out out/deck-plan.json
npm run materials:deliver -- <materials...> --out-dir out/delivery-run --model-json out/material-extraction.json --quality-mode formal
```

Asset pipeline:

```bash
npm run assets:gate -- out/deck-plan.json --out out/asset-gate.json
npm run assets:plan -- out/deck-plan.json --out out/asset-prompts.json
node scripts/deck_asset_decision_gate.js out/deck-plan.json --out out/asset-decision.json
node scripts/resolve_visual_assets.js out/deck-plan.json --decisions out/asset-decision.json --out out/deck-plan.assets.json
```

Validation and regression:

```bash
npm run validate -- out/sample.pptx --expect-slides 10 --require 新能源,告警
npm run visual:qa -- out/sample.pptx --preview-dir out/preview --plan examples/sample-deck-plan.json
npm run test:fast
npm run verify:delivery -- --skip-preview
node scripts/run_all_tests.js --changed-files README.md --explain
```

## Project Layout

```text
.
├── SKILL.md                         # skill entry and core contract
├── CONTEXT.md                       # lightweight context for new sessions
├── scripts/
│   ├── material_ingest.js           # ingest user materials
│   ├── material_orchestration_prompt.js
│   ├── material_to_deck_plan.js
│   ├── deck_asset_decision_gate.js  # image and asset decision gate
│   ├── resolve_visual_assets.js     # bind real assets or generated image results
│   ├── generate_pptx.js             # generate editable PPTX
│   ├── validate_pptx.js             # validate PPTX structure and text
│   └── visual_qa.js                 # preview and visual QA orchestration
├── assets/                          # visual system, copy policy, media assets
├── docs/readme/                     # README preview images
├── examples/                        # deck plans, extraction samples, acceptance cases
├── references/                      # architecture, QA, release notes
└── templates/                       # prompt snippets
```

## Agent Entry

When continuing work in a new Codex session, start with [CONTEXT.md](CONTEXT.md), then load the relevant references for the task. Regular `rg` searches avoid large outputs, recipe shards, and generated directories through [.rgignore](.rgignore).

## License

MIT
