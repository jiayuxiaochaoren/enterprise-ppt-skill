const assert = require('assert/strict');
const path = require('path');
const { requirePptxGen } = require('./render/pptx-runtime');
const {
  RENDERER_CONTEXT_CONTRACT,
  createRendererContext,
  missingRendererContextKeys
} = require('./render/renderer-context');
const {
  PAGE_FAMILY_MODULES,
  createSlideRenderRegistry
} = require('./render/page-family-registry');
const {
  compactDiffValue,
  compactRenderMatch,
  isStrictRenderMode,
  normalizationModeFor,
  qualityModeForPlan,
  routeSensitiveDiffs,
  shortHash,
  stableStringify
} = require('./render/route-metadata');

assert.equal(typeof requirePptxGen(), 'function');
assert.equal(stableStringify({ b:2, a:1 }), '{"a":1,"b":2}');
assert.equal(shortHash({ b:2, a:1 }), shortHash({ a:1, b:2 }));
assert.equal(normalizationModeFor({ plannerFinalized:true }), 'finalized');
assert.equal(isStrictRenderMode({ quality_mode:'delivery' }), true);
assert.equal(qualityModeForPlan({ outputIntent:'formal_review' }), 'formal');
assert.equal(compactDiffValue({ text:'x'.repeat(300) }).length, 240);
assert.deepEqual(
  compactRenderMatch({ requestedType:'x', matchedType:'y', matchKind:'alias', rendererId:'r', rendererName:'render', source:'fixture', alias:'legacy' }),
  { requestedType:'x', matchedType:'y', matchKind:'alias', rendererId:'r', rendererName:'render', source:'fixture', alias:'legacy' }
);
assert.deepEqual(routeSensitiveDiffs(
  { slides:[{ type:'metric-comparison', layoutVariant:'old', notes:'ignored' }] },
  { slides:[{ type:'metric-comparison', layoutVariant:'new', notes:'ignored-new' }] }
), [{
  slide: 1,
  changed: true,
  changes: [{ field:'layoutVariant', before:'old', after:'new' }]
}]);
const context = createRendererContext({ colors: () => ({ accent: '000000' }) });
assert.equal(context.colors().accent, '000000');
assert.ok(RENDERER_CONTEXT_CONTRACT.text.includes('addText'));
assert.deepEqual(missingRendererContextKeys(context, ['colors']), ['presentationSpec', 'panelFill', 'surfaceFill']);
assert.ok(RENDERER_CONTEXT_CONTRACT.closing.includes('addVisualPhotoBackdrop'));
assert.ok(RENDERER_CONTEXT_CONTRACT.business.includes('reportBoardNeedsRightOverlayRail'));
assert.ok(RENDERER_CONTEXT_CONTRACT.chapter.includes('stageCanvas'));
assert.ok(RENDERER_CONTEXT_CONTRACT.general.includes('masterLight'));
assert.ok(RENDERER_CONTEXT_CONTRACT.toc.includes('glassPanel'));
assert.ok(RENDERER_CONTEXT_CONTRACT.manifesto.includes('stageCanvas'));
assert.ok(RENDERER_CONTEXT_CONTRACT.profile.includes('EvidenceImageFrame'));
assert.ok(RENDERER_CONTEXT_CONTRACT.beauty.includes('genericShowcaseField'));
assert.ok(RENDERER_CONTEXT_CONTRACT.financial.includes('renderChartSpec'));
assert.ok(RENDERER_CONTEXT_CONTRACT.financial.includes('componentRendererContext'));
assert.ok(RENDERER_CONTEXT_CONTRACT.financial.includes('variantOf'));
assert.ok(RENDERER_CONTEXT_CONTRACT.timeline.includes('addClockwiseLoopConnectors'));
assert.ok(RENDERER_CONTEXT_CONTRACT.risk.includes('compactEvidenceCaption'));
assert.ok(RENDERER_CONTEXT_CONTRACT.strategy.includes('industryProfile'));
['financial', 'beauty', 'business', 'chapter', 'general', 'toc', 'manifesto', 'profile', 'evidenceGallery', 'closing', 'architecture', 'timeline', 'risk', 'strategy'].forEach(key => {
  assert.ok(Array.isArray(PAGE_FAMILY_MODULES[key]), `${key} page-family module boundary should be declared`);
  assert.ok(PAGE_FAMILY_MODULES[key].length > 0, `${key} page-family module should list routed types`);
});
[
  'financial',
  'beauty',
  'business',
  'chapter',
  'general',
  'toc',
  'manifesto',
  'profile',
  'evidence-gallery',
  'closing',
  'architecture',
  'timeline',
  'risk',
  'strategy'
].forEach(name => {
  const family = require(path.join(__dirname, 'render', 'page-families', name));
  assert.equal(typeof family.entries, 'function', `${name} should expose registry entries`);
  assert.ok(Array.isArray(family.types), `${name} should expose routed types`);
});

const render = () => {};
const registry = createSlideRenderRegistry({
  architectureAdaptive: render,
  caseGallery: render,
  chapterDivider: render,
  closingAdaptive: render,
  comparisonSlide: render,
  companyProfileSpread: render,
  coverDark: render,
  executiveBlocks: render,
  fallbackBulletsSlide: render,
  financeBridgeSlide: render,
  industryChartSlide: render,
  manifestoSlide: render,
  metricComparison: render,
  moduleMatrix: render,
  portfolioTableSlide: render,
  productShowcase: render,
  profileProof: render,
  quoteProof: render,
  reportBoard: render,
  riskAdaptive: render,
  strategyMap: render,
  timelineAdaptive: render,
  tocClean: render,
  twoColumnClean: render,
  valueTiles: render
});
assert.equal(registry.matchFor('metric-comparison').rendererId, 'metric-comparison');
assert.equal(registry.matchFor('metric-comparison').source, 'page-family:financial');
assert.equal(registry.matchFor('case-gallery').rendererId, 'case-gallery');
assert.equal(registry.matchFor('case-gallery').source, 'page-family:evidence-gallery');
assert.equal(registry.matchFor('comparison').source, 'page-family:business');
assert.equal(registry.matchFor('report-board').source, 'page-family:business');
assert.equal(registry.matchFor('value-tiles').source, 'page-family:business');
assert.equal(registry.matchFor('chapter-divider').source, 'page-family:chapter');
assert.equal(registry.matchFor('toc').source, 'page-family:toc');
assert.equal(registry.matchFor('toc-clean').source, 'page-family:toc');
assert.equal(registry.matchFor('manifesto').source, 'page-family:manifesto');
assert.equal(registry.matchFor('company-profile-spread').source, 'page-family:profile');
assert.equal(registry.matchFor('profile-proof').source, 'page-family:profile');
assert.equal(registry.matchFor('quote-proof').source, 'page-family:profile');
assert.equal(registry.matchFor('product-showcase').source, 'page-family:beauty');
assert.equal(registry.matchFor('two-column-clean').source, 'page-family:general');
assert.equal(registry.matchFor('architecture').rendererId, 'architecture');
assert.equal(registry.matchFor('architecture').source, 'page-family:architecture');
assert.equal(registry.matchFor('timeline').rendererId, 'timeline');
assert.equal(registry.matchFor('timeline').source, 'page-family:timeline');
assert.equal(registry.matchFor('risk-table').rendererId, 'table');
assert.equal(registry.matchFor('risk-table').source, 'page-family:risk');
assert.equal(registry.matchFor('strategy-map').source, 'page-family:strategy');
assert.equal(registry.matchFor('module-matrix').source, 'page-family:strategy');
assert.equal(registry.matchFor('unknown-type').matchKind, 'fallback');

console.log('renderer modularization boundaries ok');
