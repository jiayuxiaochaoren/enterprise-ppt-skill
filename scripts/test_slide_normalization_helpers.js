const assert = require('assert/strict');
const {
  createSlideNormalizationHelpers
} = require('./design/slide-normalization');

const helpers = createSlideNormalizationHelpers({
  applyPlanAuthoredSourceTrace: (plan, slide, index) => Object.assign({}, slide, { sourceTraceApplied:index + 1 }),
  clampText: (text, max) => String(text || '').slice(0, max),
  compactUnique: values => Array.from(new Set(values.filter(Boolean))),
  componentPlanFor: () => ({
    version: 'component-plan/v1',
    components: [{ id:'kpi-strip' }],
    componentIds: ['kpi-strip'],
    rulesApplied: ['stub-component-plan']
  }),
  compositionPlan: () => ({
    version: 'composition-plan/v1',
    themeIntent: 'value-signal',
    accentRole: 'data',
    layoutEnergy: 'steady',
    visualDensity: 'balanced',
    rhythmTransition: 'build',
    microComponents: ['top-rule']
  }),
  contentSignals: (plan, slide) => slide.signals || {},
  flattenText: value => Array.isArray(value)
    ? value.filter(Boolean).map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(' ')
    : JSON.stringify(value),
  generatedAssetPolicy: (plan, slide) => ({ status:slide.assetStatus || 'none' }),
  generatedAssetPrompt: () => 'GENERATED PROMPT',
  highValuePageFamilies: new Set(['bad-proof']),
  layoutVariantCompatibleWithType: (type, variant) => !['bad-variant', 'bad-proof'].includes(variant),
  palettes: { dark:{ presentation:{ coverTone:'dark' } } },
  pickLayoutVariant: (plan, slide) => slide.pickedVariant,
  recipeCompatibleWithSlideType: () => true,
  recommendSlideType: (plan, slide) => ({ type:slide.forceType || slide.type || 'executive-blocks', reason:'fixture route' }),
  routeChartSpec: () => ({ version:'chartSpec/v1', kind:'bar' }),
  selectPaletteName: () => 'dark',
  selectReferenceRecipe: (plan, slide) => slide.recipe || null,
  slideDesign: () => ({ wantsImage:false }),
  slideHasChartIntent: slide => slide.chartIntent !== false,
  visualSystem: {
    contentIntelligence: {
      claimSpine: { introMaxChars:12, cardBodyMaxChars:10 }
    }
  }
});

assert.equal(helpers.nativeVariantOwnsChartZone({ layoutVariant:'lookbook-story' }), true);
assert.equal(helpers.nativeVariantOwnsChartZone({
  layoutVariant:'lookbook-story',
  chartSpec:{ version:'chartSpec/v1' }
}), false);

assert.deepEqual(
  helpers.deriveMetricsFromSlide({
    cards:[
      { title:'收入', body:'提升 12%' },
      { title:'交付', body:'减少 3 天' }
    ]
  }),
  [
    { label:'收入', value:'12%', note:'提升 12%' },
    { label:'交付', value:'3 ', note:'减少 3 天' }
  ]
);

const sanitized = helpers.normalizeSlide({ finalized:true }, {
  forceType:'report-board',
  layoutVariant:'bad-variant',
  variant:'bad-variant',
  proofObject:'bad-proof',
  chartSpec:{ version:'chartSpec/v1', kind:'bar' },
  chartSpecInferred:true,
  dataComponent:'waterfall',
  assetGeneration:{ status:'required' },
  generatedAssetPrompt:'OLD PROMPT',
  assetStatus:'required',
  title:'这是一个很长的标题用于截断 claim',
  cards:[{ title:'A', body:'123456789012345' }]
}, 2, 5);

assert.equal(sanitized.type, 'report-board');
assert.equal(sanitized.previousLayoutVariant, 'bad-variant');
assert.equal(sanitized.previousVariant, 'bad-variant');
assert.equal(sanitized.previousProofObject, 'bad-proof');
assert.deepEqual(
  sanitized.routeSanitization.removed.map(item => item.field),
  ['layoutVariant', 'variant', 'proofObject', 'chartSpec', 'dataComponent', 'generatedAssetPrompt']
);
assert.ok(sanitized.routeSanitization.recomputed.some(item => item.field === 'componentPlan'));
assert.ok(sanitized.routeSanitization.recomputed.some(item => item.field === 'assetGeneration'));
assert.equal(sanitized.componentPlan.componentIds[0], 'kpi-strip');
assert.equal(sanitized.compositionPlan.microComponents.includes('kpi-strip'), true);
assert.equal(sanitized.assetGeneration.previousDecisionStale, true);
assert.equal(sanitized.generatedAssetPrompt, 'GENERATED PROMPT');
assert.equal(sanitized.claim, '这是一个很长的标题用于截');
assert.equal(sanitized.cards[0].body, '1234567890');
assert.equal(sanitized.sourceTraceApplied, 3);

const metric = helpers.normalizeSlide({}, {
  forceType:'metric-comparison',
  title:'指标页',
  cards:[{ title:'收入', body:'提升 12%' }],
  pickedVariant:'financial-kpi-snapshot'
}, 0, 3);

assert.equal(metric.layoutVariant, 'financial-kpi-snapshot');
assert.deepEqual(metric.metrics, [{ label:'收入', value:'12%', note:'提升 12%' }]);
assert.equal(metric.chartSpec.version, 'chartSpec/v1');
assert.equal(metric.chartSpecInferred, true);
assert.equal(metric.themeIntent, 'value-signal');
assert.equal(metric.accentRole, 'data');

console.log('slide normalization helpers ok');
