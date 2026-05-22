# Commercial Palette System

Use this reference when choosing or extending `assets/visual-system.json` palettes.

## Palette Roles

Each palette must define roles, not just pretty colors:

- `background`: main light canvas, usually near-white rather than pure white.
- `text`: primary readable text.
- `body`: paragraph and secondary text.
- `muted`: labels, page numbers, metadata.
- `line`: dividers, borders, grid lines.
- `panel`: card or content surface.
- `dark`: dark-stage canvas, usually near-black rather than pure black.
- `darkPanel`: dark surface for cards or overlays.
- `darkText`: text on dark background.
- `accent`: one structural emphasis color per slide.
- `secondary`: optional technical or flow signal.
- `tertiary`: restrained third color for rare categorization.
- `soft`: low-contrast atmospheric field.
- `dataHighlight`: one memorable data/callout color.

## Built-In Palettes

- `boardroom-ink`: default premium technology and operations palette.
- `japan-editorial-navy`: Japanese-style business clarity: navy structure, off-white field, restrained accent.
- `graphite-ivory`: warm premium professional-services palette.
- `sage-operations`: calm healthcare, ESG, education, and service operations palette.
- `signal-charcoal`: high-contrast product, AI, security, and launch palette.
- `finance-slate`: conservative finance/investment/governance palette.
- `warm-white-redline`: editorial brand, retail, culture, and leadership narrative palette.

## Practical Rules

- Use 3-4 roles per slide: background, text, accent, optional data highlight.
- Use one accent color per slide unless a chart/risk matrix truly needs a second signal.
- Avoid saturated pure colors across large areas; use them for precise emphasis.
- Prefer near-white and near-black over pure white/pure black for long decks.
- For white/light backgrounds, use dark gray or ink text rather than default black.
- For projected decks, design with stronger contrast than web minimums because screens and projectors vary.
- When using a photo background, the text contrast must be created with image darkening, gradient wash, or a stable overlay panel.

## Research Notes

- MiriCanvas Japan recommends limiting color roles and prioritizing contrast for business presentation readability: https://www.miricanvas.com/blog/ja/powerpoint-color-design-tips
- PowerPoint Lab Japan recommends three-color role discipline: base color, main color, accent color, and warns against high-saturation pure colors: https://presentationdesign.jp/ppt-lab/cat_visual/515/
- Microsoft Support emphasizes strong contrast between text and backgrounds and cautions against red/green text-background combinations: https://support.microsoft.com/en-us/office/combining-colors-in-powerpoint-mistakes-to-avoid-555e1689-85a7-4b2e-aa89-db5270528852
- ColorArchive notes that presentation palettes differ from web palettes because decks are projected or viewed in variable conditions; it recommends near-neutrals, stronger contrast, and one accent per slide: https://colorarchive.org/guides/color-palette-for-presentations/

