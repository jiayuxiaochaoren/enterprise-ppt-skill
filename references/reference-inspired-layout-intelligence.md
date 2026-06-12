# Reference-Inspired Layout Intelligence

Use this file when the deck feels like one template with different colors. It distills reusable patterns from high-quality public slide/report references without copying their layouts.

## Source Set

- Slideland slide gallery: https://www.slideland.tech/3
- Slideland category list: https://www.slideland.tech/docs/category-list
- Slideland full category sampler: `out/reference-corpus/meta/slideland-category-reference-samples.json`
- COTEN report PDF: https://coten.co.jp/wp-content/uploads/2025/06/0f17e9f5d0bf9c6c9004120304adefbb.pdf
- Sumitomo Forestry annual report: https://sfc.jp/information/ir/library/pdf/ar2025jpn.pdf
- AMIYA financial results: https://www.amiya.co.jp/assets/ir/financial_results_2025_Q1.pdf
- Postas SpeakerDeck recruiting deck: https://speakerdeck.com/postas/posutasucai-yong-pitutizi-liao
- Dentsu integrated report: https://www.group.dentsu.com/jp/sustainability/common/pdf/integrated-report2025.pdf
- ITOKI annual report: https://www.itoki.jp/company/ir/accounts/anual/assets/pdf/accounts_annual_2025_02.pdf
- Japanese disclosure PDF: https://finance-frontend-pc-dist.west.edge.storage-yahoo.jp/disclosure/20250704/20250703507829.pdf
- HRX culture deck: https://speakerdeck.com/hrxteam/elements-culture-deck
- Patagonia progress report: https://www.patagonia.com/media/pdf/patagonia-progress-report-2025-jp.pdf
- NICE disclosure PDF: https://www.nice.co.jp/uploads/2025_11_13_02.pdf
- Shiseido integrated report: https://corp.shiseido.com/jp/ir/library/annual/pdf/2025report_jp.pdf

## Patterns To Generalize

Slideland's useful contribution is not a single style. It is the category logic:
page purpose, chart type, diagram grammar, photo subject, color, taste, industry,
and document type. The skill mirrors that in `assets/reference-layout-library.json`
so a page can be routed by proof object rather than by a fixed template name.

The full category sampler extends that logic with 173 Chinese/English category
entries and 342 reference samples. Use it as a retrieval index, not as a template
to copy: category tags can steer theme intent, palette intent, page family and QA,
but generated slides must use original structure, user assets and editable PPTX
components.

1. **Editorial Openers**
   - Best for: cover, chapter divider, strong thesis.
   - Traits: large single claim, generous whitespace, one brand/industry signal, tiny meta.
   - Avoid: using busy product/site photos behind long Chinese titles.

2. **Metric Readout**
   - Best for: finance, operations, KPI, results.
   - Traits: one hero number, two or three secondary metrics, concise movement explanation, footnote/caveat area.
   - Map to: `metric-comparison`.

3. **Value Creation Map**
   - Best for: integrated report, ESG, strategy, business model.
   - Traits: left-to-right flow from inputs/drivers to operating actions to outcomes; boxes are compact and aligned.
   - Map to: `strategy-map`.

4. **Case/Product Gallery**
   - Best for: product, venue, real estate, retail, manufacturing, portfolio.
   - Traits: images are evidence, not decoration; use repeated crop ratios, visible captions, and restrained borders.
   - Map to: `case-gallery`; never default to full-bleed background unless a safe text zone exists.

5. **Culture Manifesto**
   - Best for: recruiting, organization values, brand principles, internal culture.
   - Traits: one bold sentence, few values, rhythmic numbering, dark/light stage contrast.
   - Map to: `manifesto`.

6. **Governance/Risk Matrix**
   - Best for: governance, risk, compliance, implementation assurance.
   - Traits: prioritize visually; use matrix/scatter/heat signal plus a short mitigation summary.
   - Map to: `risk-table`.

7. **Consumer Brand Editorial**
   - Best for: beauty, fashion, food, retail, consumer goods, premium brand reports.
   - Traits: brand world and proof objects alternate; hero imagery sets emotion, while product/user/research/operation evidence carries credibility.
   - Map to: `case-gallery`, `executive-blocks`, `strategy-map`, or a dedicated `brand-world-and-business-proof` family when available.

## Router Rules

- First select a reference recipe from `assets/reference-layout-library.json`.
- If the material has a clear industry, page role, diagram type, taste or document type, query `out/reference-corpus/meta/slideland-category-reference-samples.json` and use its labels/tags as abstract design evidence.
- Then map that recipe to an editable render type supported by `generate_pptx.js`.
- If the recipe asks for an asset and no suitable user/source asset exists, call
  `scripts/asset_prompt_planner.js` and use imagegen for an original bitmap asset.
- If the material has 3+ numeric expressions or explicit KPI fields, use `metric-comparison` before table layouts.
- If it has “value chain / capital / input / output / outcome / business model / ESG / integrated report” signals, use `strategy-map`.
- If it has 2+ images, case names, product names, store/site/project labels, use `case-gallery`.
- If it has values, culture, mission, vision, recruiting, principles, use `manifesto`.
- If it has risk, mitigation, governance, compliance, assurance, use `risk-table`.
- If it has beauty, fashion, food, retail or consumer brand signals, prefer a consumer-brand editorial rhythm: image evidence, product proof, brand world, business data and ESG/governance pages must be paced instead of collapsing into generic finance or SaaS cards.
- If none of the above and the page has 5+ cards/items, use `module-matrix`; otherwise use `two-column` or `executive-blocks`.

## Generated Asset Rules

- Generated assets are acceptable for: abstract editorial backgrounds, generic product/industry mood images, generic concept scenes, non-factual visual metaphors, and texture fields.
- Generated assets are not acceptable for: named customer proof, real financial figures, real employee portraits, real screenshots, regulatory evidence, actual project sites, or real before/after proof.
- Prompts must ask for no text, no logos, no fake charts, no fake UI labels, and clean negative space when used as a background.
- If an image is a product/showcase/evidence/gallery asset, keep text outside the bitmap in editable PPT text.

## QA Implications

- The deck should show at least four page-family rhythms in a 10-slide deck.
- A photo-rich deck should still contain solid analysis pages; a finance deck should still have visual proof objects.
- A gallery page fails if crops look random or captions are not aligned.
- A metric page fails if every number has equal weight.
- A strategy map fails if arrows imply flow but the labels read like unrelated cards.
