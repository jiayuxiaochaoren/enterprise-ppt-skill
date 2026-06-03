# Screenshot Baseline QA

Screenshot baseline QA compares current preview PNGs with reviewer-approved baseline PNGs. Use it when a page family or fixture must keep its layout stable across renderer, primitive, or visual QA changes.

## Manifest

Start from `examples/visual-baseline-region-manifest.example.json`. The manifest is passed to:

```bash
node scripts/visual_qa.js out/deck.pptx --preview-dir out/preview --baseline path/to/baseline-manifest.json --quality-mode formal --json
```

Supported built-in regions are `mainBody`, `rightEvidence`, `cardGrid`, `chartBoard`, and `footer`. Each slide can set:

- `file`: baseline PNG path, relative to the manifest.
- `thresholds`: optional per-slide overrides for whole-slide hash/luminance/bbox, local region hash/bbox, and default region coverage.
- `regions`: region coverage expectations. Use explicit `minCoverage` for strict checks like missing cards, blank evidence panels, shifted chart boards, or lost footers.
  Region entries may also set `maxHashDistance` and `maxBboxDelta` to override the slide/default local-region thresholds for a specific region.

The audit reports whole-slide drift as `baselineHashDistance`, `baselineLumaDistance`, and `baselineContentBBoxShift`. Region-level drift is reported separately:

- `baselineRegionMissing`: coverage fell below `minCoverage` or the baseline-derived coverage floor.
- `baselineRegionHashDistance`: the local 4x4 region hash drift exceeded `maxRegionHashDistance`.
- `baselineRegionBBoxShift`: the local region content bbox drift exceeded `maxRegionBBoxDelta`.

Region findings include `regionName`, `actualCoverage`, `expectedCoverage`, `baselineCoverage`, `coverageRatio`, `localHashDistance`, `localBBoxDelta`, and an actionable `reason` field.

Every slide declared in the manifest must have a matching current preview PNG. Preview filenames such as `slide4.png` or `page4.png` are mapped back to slide 4; a missing declared slide raises `baselinePreviewMissing`.

## Generate Or Update

1. Render the deck or fixture PPTX.
2. Export preview PNGs with `node scripts/validate_pptx.js deck.pptx --preview-dir out/preview --preview-optional`.
3. Review the preview visually. Only approved previews become baselines.
4. Copy approved PNGs into a stable baseline folder, for example `references/baselines/<fixture>/slide1.png`.
5. Create or update the manifest from `examples/visual-baseline-region-manifest.example.json`.
6. Run `visual_qa.js --baseline` and keep the JSON output with the fixture evidence when the baseline is introduced or intentionally updated.

When updating a baseline, record the reason in the PR or release note. Treat baseline updates like snapshot updates: they should follow an intentional visual change, not hide drift.

## Negative Coverage

`node scripts/test_visual_qa_baseline.js` uses synthetic PNG fixtures so it does not require Keynote or LibreOffice. It verifies that region-level baseline QA catches:

- missing right-side evidence content via `rightEvidence`;
- missing card content via `cardGrid`;
- shifted main visual content via `chartBoard` and `baselineRegionBBoxShift`;
- lost footer content via `footer`.
