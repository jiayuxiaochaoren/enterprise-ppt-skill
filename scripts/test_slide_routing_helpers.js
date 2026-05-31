const assert = require('assert/strict');
const {
  createSlideRoutingHelpers
} = require('./design/slide-routing');

const defaultSignals = {
  first: false,
  last: false,
  imageCount: 0,
  cardCount: 0,
  rowCount: 0,
  phaseCount: 0,
  layerCount: 0,
  productCount: 0,
  hasTimeline: false,
  hasRisk: false,
  hasResponsibilityLoop: false,
  hasStructuredLogic: false,
  hasNamedLogicChain: false,
  hasStrategyMap: false,
  isNumberHeavy: false,
  isTextHeavy: false,
  isDenseText: false,
  hasGovernance: false,
  hasGallery: false,
  hasCaseSignal: false,
  hasArchitecture: false,
  hasSplitProblem: false,
  flywheelCount: 0
};

const helpers = createSlideRoutingHelpers({
  contentSignals: (plan, slide, index, total) => Object.assign({}, defaultSignals, {
    first: index === 0,
    last: index === total - 1
  }, slide.signals || {}),
  flattenText: value => JSON.stringify(value),
  highValuePageFamilies: new Set(['service-blueprint', 'portfolio-evidence']),
  industryChartVariant: () => 'waterfall-bridge',
  layoutVariantCompatibleWithType: (type, variant) => (
    (type === 'architecture' && variant === 'service-blueprint') ||
    (type === 'case-gallery' && variant === 'portfolio-evidence')
  ),
  recipeCompatibleWithSlideType: (recipe, type) => recipe.renderType === type,
  selectReferenceRecipe: (plan, slide) => slide.recipe || null,
  semanticFrame: (plan, slide) => slide.semantic || {},
  staleIndustryChartRouteShouldYieldToProcess: slide => slide.staleProcess === true,
  themeIntentFor: (plan, slide) => slide.themeIntent || '',
  visualIndustryId: industry => industry === 'beauty-consumer' ? 'brand-retail' : industry
});

assert.equal(
  helpers.recipeAutoRouteAllowed({ renderType:'timeline' }, {}, defaultSignals),
  false
);
assert.equal(
  helpers.recipeAutoRouteAllowed({ renderType:'timeline' }, { phases:[{ title:'A' }] }, defaultSignals),
  true
);
assert.equal(
  helpers.recipeAutoRouteAllowed({ renderType:'architecture' }, {}, defaultSignals),
  false
);
assert.equal(
  helpers.recipeAutoRouteAllowed({ renderType:'architecture' }, { layers:[{ title:'A' }] }, defaultSignals),
  true
);

assert.deepEqual(
  helpers.recommendSlideType({}, { type:'industry-chart', staleProcess:true }, 1, 3),
  { type:'timeline', reason:'process fields override stale industry-chart route' }
);
assert.deepEqual(
  helpers.recommendSlideType({}, { title:'谢谢观看' }, 2, 3),
  { type:'closing', reason:'closing signal' }
);
assert.deepEqual(
  helpers.recommendSlideType({}, { bridge:[{ label:'A', value:1 }] }, 1, 3),
  { type:'industry-chart', reason:'explicit business bridge field' }
);
assert.deepEqual(
  helpers.recommendSlideType({ industry:'finance-investment' }, { bridge:[{ label:'A', value:1 }] }, 1, 3),
  { type:'finance-bridge', reason:'explicit finance bridge field' }
);

assert.equal(
  helpers.pickLayoutVariant({}, { proofObject:'service-blueprint' }, 'architecture'),
  'service-blueprint'
);
assert.equal(
  helpers.pickLayoutVariant({ industry:'brand-retail' }, { lookbook:true, signals:{ imageCount:2 } }, 'case-gallery'),
  'lookbook-story'
);
assert.equal(
  helpers.pickLayoutVariant({ industry:'finance-investment' }, {}, 'closing'),
  'investment-decision'
);
assert.equal(
  helpers.pickLayoutVariant({}, { products:['A', 'B', 'C', 'D'], signals:{ productCount:4 } }, 'product-showcase'),
  'catalog-grid'
);

console.log('slide routing helpers ok');
