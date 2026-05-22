# premium-commercial-ppt-skill

A Hermes Skill project for premium Chinese commercial presentation planning, editable PPTX generation, and rendered visual QA.

The goal is to turn uploaded materials, meeting notes, product copy, company documents, or short prompts into concise, polished, client-ready business decks rather than conservative templates or test artifacts.

## Contents

```text
.
├── SKILL.md                         # Main skill definition and quality bar
├── scripts/
│   ├── generate_pptx.js             # Generate editable .pptx files from deck plans
│   └── validate_pptx.js             # Validate PPTX files, text, placeholders, and previews
├── assets/
│   ├── visual-system.json           # Font stack, motifs, and premium visual constraints
│   └── media/                       # Real media assets and attribution notes
├── templates/
│   └── prompt-snippets.md
├── references/                      # Design systems, industry profiles, QA notes, failure modes
├── examples/
│   └── sample-deck-plan.json        # 10-slide commercial sample deck plan
├── package.json
├── README.md
└── LICENSE
```

## Quick Start

```bash
npm install
npm run sample
```

Generate from a deck plan:

```bash
node scripts/generate_pptx.js examples/sample-deck-plan.json out/sample.pptx
```

Validate and export previews:

```bash
node scripts/validate_pptx.js out/sample.pptx --expect-slides 10 --require 新能源,告警 --preview-dir out/preview
```

## Scope

- Converts structured deck plans into editable PPTX files.
- Defaults to the `premium-commercial-keynote` style.
- Uses `assets/visual-system.json` to coordinate Chinese title fonts, Latin labels, numeric typography, commercial palettes, visual routing, breathing circles, real photo backdrops, inner-page image crops, energy lens motifs, and closed-loop visuals.
- Supports `palette`, `visualMode`, `visualIntent`, `media`, and `slide.visual` so decks can choose solid, photo, hybrid, generated, or case-gallery layouts by industry and slide role.
- The energy sample cover, closing, and selected inner pages use different crops of a public-domain BESS site photo with attribution recorded in `assets/media/ATTRIBUTION.md`.
- `assets/media/energy-storage-cover-loop.mp4` provides an optional motion backdrop for Keynote/PowerPoint environments that handle embedded video cleanly.
- Supports commercial, consulting, executive-white, and enterprise-tech profiles.
- Supports industry profiles such as energy utility, manufacturing operations, and industrial park.
- Provides page families for cover, navigation, split insight, architecture, capability map, timeline, value signal, case gallery, risk matrix, and closing.
- Validates PPTX structure, slide count, required terms, Chinese text, visible scaffold words, and optionally exports slide previews through Keynote.

## Principles

- One claim per slide.
- One proof object per slide.
- Key pages need a real visual anchor: cover field, architecture data bus, closed operating loop, risk matrix, or value signal.
- Industry adaptation cannot stop at cover and closing images; navigation, situation, problem, pathway, and value pages need industry-specific page families.
- Images must be evidence or scene-setting, not decoration. Information-dense pages should prefer solid backgrounds and structured layouts.
- Solid pages use built-in palette pairings for background, text, line, accent, and data highlight roles with restrained color count and strong contrast.
- No repeated diagonal stripe clusters, dot noise, or meaningless connector lines.
- No visible test, sample, placeholder, or acceptance wording in client-facing decks.
- No invented customers, revenue, policy backing, awards, metrics, or cases.
- Structural validation is not visual validation; inspect rendered previews before treating a deck as deliverable.

## License

MIT
