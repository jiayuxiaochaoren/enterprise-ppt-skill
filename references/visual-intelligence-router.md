# Visual Intelligence Router

Use this reference when deciding whether a premium commercial deck should use pure-color backgrounds, real images, generated images, or case-gallery layouts.

## Core Decision

Do not ask "will a picture make this prettier?" Ask "does a picture prove or situate the claim?"

The implementation must route through the centralized system:

1. `assets/visual-system.json` stores palettes, typography, layout tokens, industry profiles, image-role defaults, media defaults, and page-family mappings.
2. `scripts/design-system.js` resolves each slide to `role`, `mode`, `imageRole`, `wantsImage`, `imagePath`, `mediaKey`, and `pageFamily`.
3. Generator page functions consume that decision. They should not invent independent rules for whether an industry or slide type should use imagery.

Before choosing a layout, classify the image role:

- `background`: atmosphere. Use only when the image is low-noise and has a safe text zone.
- `showcase`: product, equipment, production line, venue, or object that must be clearly inspected. Put text in a separate solid area.
- `evidence`: site photo, screenshot, case proof, or field detail. Use a bordered panel and short caption.
- `comparison`: before/after or old/new visual. Split it into explicit comparison zones; do not use the combined image as a background.
- `gallery`: multiple product/case/venue images. Use consistent crop ratios and captions.

Choose the background mode per slide:

- `solid`: management reports, finance, governance, strategy, risk, architecture, data-heavy pages, and any slide where image relevance is weak.
- `photo`: cover, closing, brand manifesto, launch keynote, place/product hero, or emotional scene-setting page.
- `hybrid`: one disciplined photo panel or band plus a structured information field. Use for manufacturing, energy, industrial parks, healthcare, real estate, education, retail, products, and case-led proposals.
- `generated`: abstract scene, concept backdrop, material texture, or impossible-to-source visual. Do not generate fake customers, fake facilities, fake screenshots, or images containing text.
- `case-gallery`: multiple real images, product photos, screenshots, venues, before/after visuals, portfolio examples, or proof photos.

## Industry Defaults

- Energy / utilities: selective hybrid. Use real site imagery on cover and closing; use inner-page images only for station context, asset state, case proof, or field evidence.
- Manufacturing: hybrid for field/process pages, solid for KPI/OEE/process architecture.
- Industrial park / real estate / venue: hybrid or case-gallery when place is central; solid for management/risk/implementation.
- Healthcare / education / public service: mostly solid, with calm human/space images only when relevant.
- Finance / investment / governance: solid by default; use charts, matrices, and tables, not decorative photos.
- Brand / retail / product / culture: case-gallery and product-photo layouts are allowed, but crop, tone, and grid must be consistent.

## Asset Acquisition Ladder

1. Use user-uploaded or material-provided assets first.
2. Use public or licensed image search only when source, license, and use are clear.
3. Use generated bitmap assets only for abstract, non-factual visuals.
4. If none are safe or relevant, use a pure-color palette with strong typography and proof objects.

## Layout Rules For Images

- One image: use full-bleed hero or strong split. Avoid small floating thumbnails.
- Two images: use a left/right contrast or before/after structure.
- Three to six images: use a case-gallery grid with identical crop ratios and caption rhythm.
- Screenshots: frame them as evidence panels, crop away irrelevant browser chrome, and add one callout if needed.
- Product photos: give the object breathing room and avoid putting body text over complex product details.
- Full-bleed photos: darken or wash the image, then place text in a stable low-detail zone.
- Product, equipment, and screenshot visuals are usually `showcase` or `evidence`, not `background`.
- Long body copy must not sit on top of an image. If the slide needs body copy, use a solid panel or move the copy off the image.

## Research Notes

- MiriCanvas Japan frames color as an information-structure tool, not decoration, and recommends setting palette rules in advance for consistency: https://www.miricanvas.com/blog/ja/powerpoint-color-design-tips
- PowerPoint Lab Japan recommends limiting colors to base/main/accent roles, avoiding overly saturated pure colors, and using image backgrounds that match the main color tone: https://presentationdesign.jp/ppt-lab/cat_visual/515/
- Presentation Design Japan highlights alignment, whitespace, division, and repetition as basic layout foundations: https://ppt.design4u.jp/basics-of-layout/
- Presentation Design Japan's image guide emphasizes crop/scale discipline, image-text contrast, grouping, grid alignment, and avoiding over-enlarged images: https://ppt.design4u.jp/effective-use-of-images/
- MarkeZine recommends full-slide high-quality photos only when they match the theme, then darkening the photo and arranging text with enough whitespace: https://markezine.jp/article/detail/31799
- Microsoft warns that text over pictures is tricky because contrast becomes harder to control, and recommends strong contrast/shadow treatment where necessary: https://support.microsoft.com/en-us/office/combining-colors-in-powerpoint-mistakes-to-avoid-555e1689-85a7-4b2e-aa89-db5270528852
