function compactUnique(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

const HIGH_VALUE_PAGE_FAMILIES = new Set([
  'financial-kpi-snapshot',
  'chart-grid-with-commentary',
  'quarterly-results-summary',
  'guidance-and-risk-board',
  'value-creation-process-map',
  'materiality-matrix-board',
  'sustainability-proof-spread',
  'governance-table-editorial',
  'culture-cover-with-soft-geometry',
  'mission-statement-stage',
  'people-proof-mosaic',
  'value-principle-cards',
  'beauty-brand-editorial-cover',
  'editorial-proof-board',
  'product-role-board',
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'product-evidence-story',
  'airy-concept-opening',
  'single-object-concept-map',
  'executive-proof-board',
  'premium-closing-anchor',
  'loss-pareto',
  'issue-frequency-ranking',
  'review-sentiment-ranking',
  'manufacturing-action-loop',
  'healthcare-quality-loop',
  'saas-governance-loop',
  'generic-action-loop'
]);

const PRIORITY_PAGE_FAMILY_SPECS = [
  ['financial-kpi-snapshot', 'metric-comparison', ['finance-investment'], 'value-signal', ['kpi-primary-metric', 'metric-strip', 'chart-commentary-panel']],
  ['chart-grid-with-commentary', 'metric-comparison', ['finance-investment', 'general-operations'], 'value-signal', ['metric-strip', 'chart-commentary-panel']],
  ['quarterly-results-summary', 'metric-comparison', ['finance-investment'], 'value-signal', ['kpi-primary-metric', 'metric-strip', 'chart-commentary-panel', 'disclosure-footnote']],
  ['guidance-and-risk-board', 'risk-table', ['finance-investment', 'government-public-sector'], 'risk-warning', ['risk-matrix', 'control-tag', 'disclosure-footnote']],
  ['value-creation-process-map', 'strategy-map', ['beauty-consumer', 'general-operations'], 'system-architecture', ['process-rail', 'system-rail', 'value-chain-connector']],
  ['materiality-matrix-board', 'risk-table', ['general-operations', 'government-public-sector'], 'risk-warning', ['risk-matrix', 'control-tag']],
  ['sustainability-proof-spread', 'case-gallery', ['beauty-consumer', 'general-operations'], 'case-evidence', ['caption-bar', 'proof-gallery-grid']],
  ['governance-table-editorial', 'risk-table', ['finance-investment', 'government-public-sector', 'general-operations'], 'risk-warning', ['governance-table', 'control-tag']],
  ['culture-cover-with-soft-geometry', 'cover', ['people-culture', 'people-culture-company'], 'industry-opening', ['hero-image', 'commentary-panel', 'caption-bar']],
  ['mission-statement-stage', 'manifesto', ['people-culture', 'people-culture-company'], 'executive-narrative', ['statement-stage']],
  ['people-proof-mosaic', 'case-gallery', ['people-culture', 'people-culture-company'], 'case-evidence', ['people-proof-mosaic', 'caption-bar', 'proof-gallery-grid']],
  ['value-principle-cards', 'manifesto', ['people-culture', 'people-culture-company'], 'executive-narrative', ['statement-stage', 'value-principle-cards']],
  ['beauty-brand-editorial-cover', 'cover', ['beauty-consumer', 'brand-retail'], 'industry-opening', ['brand-world-hero', 'caption-bar', 'meta-folio']],
  ['editorial-proof-board', 'report-board', ['beauty-consumer', 'brand-retail'], 'case-evidence', ['content-card-grid', 'caption-bar', 'information-gap']],
  ['product-role-board', 'report-board', ['beauty-consumer', 'brand-retail'], 'case-evidence', ['product-matrix', 'caption-bar']],
  ['brand-world-and-business-proof', 'strategy-map', ['beauty-consumer', 'brand-retail'], 'system-architecture', ['brand-world-hero', 'value-chain-connector', 'brand-proof-caption']],
  ['consumer-proof-photo-grid', 'case-gallery', ['beauty-consumer', 'brand-retail'], 'case-evidence', ['caption-bar', 'proof-gallery-grid', 'brand-proof-caption']],
  ['product-evidence-story', 'case-gallery', ['beauty-consumer', 'brand-retail'], 'case-evidence', ['caption-bar', 'product-story-caption', 'proof-gallery-grid']],
  ['airy-concept-opening', 'cover', ['general-operations', 'finance-investment', 'industrial-energy', 'saas-technology', 'saas-ai-technology', 'healthcare-operations', 'healthcare-wellness', 'government-public-sector', 'lifestyle-food-tourism-fashion', 'people-culture', 'people-culture-company', 'beauty-consumer'], 'industry-opening', ['brand-world-hero', 'meta-folio']],
  ['single-object-concept-map', 'strategy-map', ['general-operations', 'saas-technology', 'people-culture'], 'system-architecture', ['system-rail', 'value-chain-connector']],
  ['executive-proof-board', 'case-gallery', ['general-operations', 'finance-investment', 'government-public-sector'], 'case-evidence', ['proof-gallery-grid', 'caption-bar']],
  ['premium-closing-anchor', 'closing', ['general-operations', 'finance-investment', 'industrial-energy', 'saas-technology', 'saas-ai-technology', 'healthcare-operations', 'healthcare-wellness', 'government-public-sector', 'lifestyle-food-tourism-fashion', 'brand-retail', 'beauty-consumer', 'people-culture', 'people-culture-company'], 'closing-anchor', ['editorial-end-card', 'contact-block']]
];

const PRIORITY_PAGE_FAMILY_RECIPES = PRIORITY_PAGE_FAMILY_SPECS.map(([variant, renderType, industryFit, themeIntent, componentHints]) => ({
  id: `priority-page-family--${variant}`,
  version: 'reference-recipe/v1',
  source: {
    kind: 'curated-priority-page-family',
    sourcePolicy: 'Runtime recipe distilled from the reference library and industry page-family playbook.'
  },
  taxonomy: {
    group: 'priority-page-family',
    groupZh: '高价值页面族',
    groupEn: 'Priority page families',
    pageRole: variant,
    documentType: '',
    visualTaste: ['premium-commercial'],
    tags: [variant, renderType],
    labels: [variant]
  },
  designSyntax: {
    industry: industryFit,
    materialType: '',
    pageRole: variant,
    visualTemperament: ['premium-commercial', themeIntent],
    mainVisualMethod: /gallery|cover|proof|product|beauty|people/i.test(variant) ? 'captioned-real-asset-or-showcase' : (/risk|governance|matrix|guidance/i.test(variant) ? 'structured-board-or-matrix' : 'process-map-or-data-readout'),
    informationDensity: /cover|closing|mission|airy/i.test(variant) ? 'low' : (/risk|governance|financial|chart|materiality/i.test(variant) ? 'high' : 'medium'),
    colorSemantics: ['brand=structure', 'evidence=proof', 'risk=constraint', 'data=readout', 'action=next-step'],
    proofObject: variant,
    suitablePageFamilies: compactUnique([renderType, variant.includes('cover') ? 'cover' : '', variant.includes('closing') ? 'closing' : '']),
    forbiddenPoints: ['copy source layout exactly', 'reuse source images/logos/text', 'use decoration without proof role']
  },
  industryFit,
  signals: compactUnique([variant, renderType, themeIntent, ...industryFit]),
  renderType,
  layoutVariant: variant,
  themeIntent,
  paletteIntent: industryFit.includes('beauty-consumer') ? 'beauty-warm-premium' : (industryFit.includes('finance-investment') ? 'finance-slate' : 'japan-editorial-navy'),
  proofObject: variant,
  pageFamilies: compactUnique([renderType]),
  assetRole: renderType === 'case-gallery' ? 'gallery' : (renderType === 'cover' ? 'showcase' : 'none'),
  componentHints: compactUnique(['top-rule', 'page-number', 'section-kicker', ...componentHints]),
  usage: {
    useAs: 'curated-runtime-page-family-recipe',
    doNotCopy: ['external images', 'logos', 'source text', 'exact reference layout'],
    notesZh: '用于显式页面族检索和运行时分派，保证高价值 proof object 不被泛化样本抢占。'
  },
  generatedAsset: /gallery|proof|cover|product|people|beauty/i.test(variant)
    ? 'optional synthetic category visual allowed; use only as non-factual atmosphere/showcase and never as named proof'
    : 'none',
  scores: {
    premiumLook: 86,
    dataPersuasion: /financial|chart|kpi|risk|governance|materiality/i.test(variant) ? 86 : 72,
    industrySpecificity: industryFit.some(id => id !== 'general-operations') ? 86 : 72,
    imageEvidence: /gallery|proof|cover|product|people|beauty/i.test(variant) ? 82 : 58,
    reusability: 90,
    copyrightSimilarityRisk: 12,
    overall: 88
  }
}));

const LAYOUT_VARIANT_RENDER_TYPES = new Map();
function registerLayoutVariantTypes(variant = '', types = []) {
  if (!variant) return;
  const existing = LAYOUT_VARIANT_RENDER_TYPES.get(variant) || new Set();
  types.forEach(type => existing.add(type));
  LAYOUT_VARIANT_RENDER_TYPES.set(variant, existing);
}
PRIORITY_PAGE_FAMILY_SPECS.forEach(([variant, renderType]) => registerLayoutVariantTypes(variant, [renderType]));
[
  ['culture-cover-with-soft-geometry', ['cover', 'cover-dark', 'manifesto']],
  ['editorial-cover', ['cover', 'cover-dark']],
  ['editorial-agenda', ['toc', 'toc-clean', 'chapter-divider']],
  ['agenda-board', ['toc', 'toc-clean', 'chapter-divider']],
  ['pathway-map', ['toc', 'toc-clean', 'chapter-divider']],
  ['line-agenda', ['toc', 'toc-clean', 'chapter-divider']],
  ['adoption-agenda', ['toc', 'toc-clean', 'chapter-divider']],
  ['board-briefing', ['toc', 'toc-clean', 'chapter-divider']],
  ['chapter-hero', ['toc', 'toc-clean', 'chapter-divider']],
  ['fact-metrics', ['industry-chart']],
  ['channel-efficiency-matrix', ['industry-chart']],
  ['monthly-pulse-trend', ['industry-chart']],
  ['waterfall-bridge', ['industry-chart']],
  ['loss-pareto', ['industry-chart']],
  ['issue-frequency-ranking', ['industry-chart']],
  ['review-sentiment-ranking', ['industry-chart']],
  ['valuation-sensitivity', ['industry-chart']],
  ['quality-handoff', ['industry-chart', 'closing']],
  ['patient-bottleneck', ['industry-chart']],
  ['member-cohort-ladder', ['industry-chart']],
  ['dispatch-map', ['industry-chart']],
  ['adoption-funnel', ['industry-chart']],
  ['evidence-readout', ['industry-chart']],
  ['oee-board', ['metric-comparison']],
  ['patient-service-scorecard', ['metric-comparison']],
  ['member-growth-board', ['metric-comparison']],
  ['adoption-revenue-board', ['metric-comparison']],
  ['pathway-rail', ['timeline', 'timeline-dark']],
  ['process-board', ['timeline', 'timeline-dark']],
  ['closed-loop', ['timeline', 'timeline-dark']],
  ['flywheel', ['timeline', 'timeline-dark']],
  ['case-hero', ['case-gallery', 'gallery', 'portfolio']],
  ['case-comparison', ['case-gallery', 'gallery', 'portfolio']],
  ['evidence-board', ['case-gallery', 'gallery', 'portfolio']],
  ['triptych-gallery', ['case-gallery', 'gallery', 'portfolio']],
  ['lookbook-story', ['case-gallery', 'gallery', 'portfolio']],
  ['editorial-proof-board', ['report-board']],
  ['product-role-board', ['report-board']],
  ['portfolio-evidence', ['case-gallery', 'gallery', 'portfolio']],
  ['service-touchpoint', ['case-gallery', 'gallery', 'portfolio']],
  ['site-evidence', ['case-gallery', 'gallery', 'portfolio']],
  ['prototype-flow', ['case-gallery', 'gallery', 'portfolio']],
  ['brand-world-and-business-proof', ['strategy-map', 'case-gallery']],
  ['product-evidence-story', ['case-gallery', 'strategy-map']],
  ['blueprint-stack', ['architecture', 'architecture-dark']],
  ['layer-stack', ['architecture', 'architecture-dark']],
  ['production-topology', ['architecture', 'architecture-dark']],
  ['energy-topology', ['architecture', 'architecture-dark']],
  ['service-blueprint', ['architecture', 'architecture-dark']],
  ['platform-capability-map', ['architecture', 'architecture-dark']],
  ['hub-spoke', ['architecture', 'architecture-dark']],
  ['manufacturing-action-loop', ['risk-table', 'table']],
  ['healthcare-quality-loop', ['risk-table', 'table']],
  ['saas-governance-loop', ['risk-table', 'table']],
  ['generic-action-loop', ['risk-table', 'table']],
  ['risk-matrix', ['risk-table', 'table']],
  ['control-stack', ['risk-table', 'table']],
  ['governance-board', ['risk-table', 'table']],
  ['thank-you', ['closing', 'closing-dark']],
  ['decision-summary', ['closing', 'closing-dark']],
  ['company-thanks', ['closing', 'closing-dark']],
  ['energy-stage', ['closing', 'closing-dark']],
  ['investment-decision', ['closing', 'closing-dark']],
  ['pilot-rollout', ['closing', 'closing-dark']],
  ['adoption-close', ['closing', 'closing-dark']],
  ['simple-end', ['closing', 'closing-dark']],
  ['auto', ['closing', 'closing-dark']]
].forEach(([variant, types]) => registerLayoutVariantTypes(variant, types));

function layoutVariantCompatibleWithType(type = '', variant = '') {
  const key = String(variant || '').trim();
  if (!key) return true;
  const expected = LAYOUT_VARIANT_RENDER_TYPES.get(key);
  if (!expected) return true;
  const normalizedType = String(type || '');
  return expected.has(normalizedType) ||
    (normalizedType === 'closing-dark' && expected.has('closing')) ||
    (normalizedType === 'timeline-dark' && expected.has('timeline')) ||
    (normalizedType === 'gallery' && expected.has('case-gallery')) ||
    (normalizedType === 'portfolio' && expected.has('case-gallery')) ||
    (normalizedType === 'table' && expected.has('risk-table'));
}

module.exports = {
  HIGH_VALUE_PAGE_FAMILIES,
  PRIORITY_PAGE_FAMILY_SPECS,
  PRIORITY_PAGE_FAMILY_RECIPES,
  LAYOUT_VARIANT_RENDER_TYPES,
  layoutVariantCompatibleWithType
};
