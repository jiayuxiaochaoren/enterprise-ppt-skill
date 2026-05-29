const assert = require('assert/strict');
const {
  loadReferenceRecipeLibrary,
  loadAllReferenceRecipeDetails
} = require('./design/reference-recipes');
const {
  acceptanceAudit,
  industryPackFor,
  makeDeckContext,
  normalizeDeckPlan,
  normalizeSlide,
  referenceRecipeCandidates,
  visualIndustryId
} = require('./design-system');
const { detectIndustry, referenceContextForPrompt } = require('./material_pipeline');

const manifest = loadReferenceRecipeLibrary();
assert.ok(manifest.recipeCount >= 352);
assert.ok((manifest.recipes || []).length >= 352);
const library = { recipes: loadAllReferenceRecipeDetails() };
assert.ok(library.recipes.length >= 352);
assert.ok(library.recipes.every(recipe => recipe.designSyntax && recipe.designSyntax.proofObject));
assert.ok(library.recipes.every(recipe => Array.isArray(recipe.industry) && recipe.materialType != null && recipe.pageRole != null));
assert.ok(library.recipes.every(recipe => recipe.mainVisualMethod && recipe.informationDensity && Array.isArray(recipe.colorSemantics)));
assert.ok(library.recipes.every(recipe => Array.isArray(recipe.suitablePageFamilies) && Array.isArray(recipe.forbiddenMoves)));
assert.ok(library.recipes.every(recipe => recipe.scores && recipe.scores.commercialPremium != null && recipe.scores.industryRecognition != null && recipe.scores.imageEvidenceValue != null));
assert.ok(library.recipes.some(recipe => recipe.designSyntax.mainVisualMethod === 'captioned-real-asset-or-showcase'));
assert.ok(library.recipes.some(recipe => recipe.layoutVariant === 'financial-kpi-snapshot'));
assert.ok(library.recipes.some(recipe => recipe.layoutVariant === 'beauty-brand-editorial-cover'));
[
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
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'product-evidence-story',
  'airy-concept-opening',
  'single-object-concept-map',
  'executive-proof-board',
  'premium-closing-anchor'
].forEach(layoutVariant => {
  assert.ok(
    library.recipes.some(recipe => recipe.layoutVariant === layoutVariant),
    `${layoutVariant} should have at least one searchable reference recipe`
  );
});

assert.equal(visualIndustryId('beauty-consumer'), 'beauty-consumer');
assert.equal(makeDeckContext({ industry: 'beauty-consumer' }).industryDialect.name, 'luxury-beauty-editorial-system');
assert.equal(industryPackFor('beauty-consumer').id, 'beauty-consumer');
assert.equal(detectIndustry('政府园区国企汇报需要政策来源、招商项目地图和治理保障')[0].industry, 'government-public-sector');

const beautySlide = normalizeSlide(
  { industry: 'beauty-consumer', documentType: 'integrated-report', title: '美妆品牌年度报告' },
  {
    type: 'content',
    title: '产品证据与消费者场景共同证明品牌增长',
    proofObject: 'consumer-proof-photo-grid',
    images: ['product-a.png', 'counter-b.png', 'member-c.png'],
    cards: [{ title: '明星单品' }, { title: '柜台场景' }, { title: '会员反馈' }]
  },
  3,
  9
);
assert.equal(beautySlide.type, 'case-gallery');
assert.equal(beautySlide.layoutVariant, 'consumer-proof-photo-grid');
assert.equal(beautySlide.compositionPlan.industryExpression.dialect, 'luxury-beauty-editorial-system');
assert.ok(beautySlide.compositionPlan.microComponents.includes('caption-bar'));

const financeCandidates = referenceRecipeCandidates(
  { industry: 'finance-investment', documentType: 'financial-results' },
  { type: 'metric-comparison', title: 'Q1 财务业绩与核心 KPI', metrics: [{ label: '收入', value: '+12%' }] },
  { limit: 5 }
);
assert.ok(financeCandidates.some(recipe => /quarterly-results-summary|financial-kpi-snapshot/.test(recipe.layoutVariant || recipe.id)));

[
  ['finance-investment', 'metric-comparison', 'quarterly-results-summary', '季度业绩结果复盘'],
  ['beauty-consumer', 'strategy-map', 'brand-world-and-business-proof', '品牌世界观与业务证明'],
  ['general-operations', 'strategy-map', 'single-object-concept-map', '单一核心对象概念地图'],
  ['general-operations', 'case-gallery', 'executive-proof-board', '高管汇报证据板']
].forEach(([industry, type, proofObject, title]) => {
  const candidates = referenceRecipeCandidates(
    { industry, documentType: proofObject === 'quarterly-results-summary' ? 'financial-results' : 'integrated-report' },
    { type, title, proofObject, cards: [{ title: '证据', body: '说明' }], metrics: [{ label: '指标', value: '12%' }] },
    { limit: 3 }
  );
  assert.equal(candidates[0].layoutVariant, proofObject, `${proofObject} should keep explicit page-family recipe at the top`);
});

const referenceContext = referenceContextForPrompt({
  textSummary: {
    industryCandidates: [{ industry: 'beauty-consumer', score: 3 }]
  }
});
assert.equal(referenceContext.industryPack.id, 'beauty-consumer');
assert.ok(referenceContext.recommendedReferenceRecipes.length > 0);
assert.ok(referenceContext.recommendedReferenceRecipes[0].componentHints);

const weakDeck = {
  industry: 'beauty-consumer',
  slides: [
    { type: 'cover', title: '品牌汇报' },
    ...Array.from({ length: 6 }, (_, i) => ({
      type: 'content',
      title: `事项 ${i + 1}`,
      cards: [{ title: '背景', body: '说明' }, { title: '动作', body: '说明' }]
    })),
    { type: 'closing', title: '谢谢观看' }
  ]
};
const weakAudit = acceptanceAudit(weakDeck, normalizeDeckPlan(weakDeck));
assert.equal(weakAudit.version, 'acceptance-audit/v1');
assert.ok(weakAudit.checks.some(check => check.id === 'industry-customization' && check.status !== 'pass'));
assert.ok(weakAudit.checks.some(check => check.id === 'layout-repetition' && check.status !== 'pass'));

console.log('reference recipe system ok');
