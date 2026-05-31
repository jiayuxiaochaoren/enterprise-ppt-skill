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

assert.equal(typeof requirePptxGen(), 'function');
const context = createRendererContext({ colors: () => ({ accent: '000000' }) });
assert.equal(context.colors().accent, '000000');
assert.ok(RENDERER_CONTEXT_CONTRACT.text.includes('addText'));
assert.deepEqual(missingRendererContextKeys(context, ['colors']), ['presentationSpec', 'panelFill', 'surfaceFill']);
assert.ok(RENDERER_CONTEXT_CONTRACT.closing.includes('addVisualPhotoBackdrop'));
assert.ok(RENDERER_CONTEXT_CONTRACT.business.includes('reportBoardNeedsRightOverlayRail'));
assert.ok(RENDERER_CONTEXT_CONTRACT.financial.includes('renderChartSpec'));
assert.ok(RENDERER_CONTEXT_CONTRACT.timeline.includes('addClockwiseLoopConnectors'));
assert.ok(RENDERER_CONTEXT_CONTRACT.risk.includes('compactEvidenceCaption'));
['financial', 'beauty', 'business', 'evidenceGallery', 'closing', 'architecture', 'timeline', 'risk'].forEach(key => {
  assert.ok(Array.isArray(PAGE_FAMILY_MODULES[key]), `${key} page-family module boundary should be declared`);
  assert.ok(PAGE_FAMILY_MODULES[key].length > 0, `${key} page-family module should list routed types`);
});
[
  'financial',
  'beauty',
  'business',
  'evidence-gallery',
  'closing',
  'architecture',
  'timeline',
  'risk'
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
assert.equal(registry.matchFor('architecture').rendererId, 'architecture');
assert.equal(registry.matchFor('architecture').source, 'page-family:architecture');
assert.equal(registry.matchFor('timeline').rendererId, 'timeline');
assert.equal(registry.matchFor('timeline').source, 'page-family:timeline');
assert.equal(registry.matchFor('risk-table').rendererId, 'table');
assert.equal(registry.matchFor('risk-table').source, 'page-family:risk');
assert.equal(registry.matchFor('unknown-type').matchKind, 'fallback');

console.log('renderer modularization boundaries ok');
