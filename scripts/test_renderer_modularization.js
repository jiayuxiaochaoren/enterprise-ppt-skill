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
const {
  containsCjk,
  createTextRenderHelpers
} = require('./render/text-meta');
const {
  CHART_COMPONENT_IDS,
  createOverlayContractHelpers,
  nativeVariantSuppressesChartMeta,
  plannedComponentsForSlide,
  reportBoardNeedsRightOverlayRail
} = require('./render/overlay-contract');
const {
  createRenderMetaHelpers
} = require('./render/render-meta');

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
assert.equal(containsCjk('业务增长'), true);
const textRects = [];
const textHelpers = createTextRenderHelpers({
  activePlan: () => ({ industry:'general-operations' }),
  addRect: (slide, x, y, w, h, color, lineColor, extra) => textRects.push({ x, y, w, h, color, lineColor, extra }),
  canvasWidth: () => 13.333,
  colors: () => ({ body:'111111', cyan:'00FFFF' }),
  compactText: (text, max) => String(text || '').slice(0, max),
  localizeMicrocopy: (plan, text) => text === 'KPI' ? '指标' : text,
  normalizeTypographyOptions: (plan, text, opts) => Object.assign({}, opts),
  profile: () => ({ font:'Fixture Font' }),
  typeSize: (name, fallback) => fallback,
  visualSystem: () => ({ visualQA:{ preferredBodyMin:8.8, preferredCaptionMin:7.2 } })
});
assert.equal(textHelpers.isPageFolioText('03', { x:11.7, y:0.8, fontSize:12, align:'right' }), true);
const textSlide = { added:[], addText(text, opts) { this.added.push({ text, opts }); } };
assert.equal(textHelpers.addText(textSlide, '业务增长', { x:1, y:1, w:1.2, h:0.10, fontSize:6, typeRole:'body' }), true);
assert.equal(textSlide.added[0].opts.fontSize, 8.8);
assert.equal(textSlide.__codexTextBoxes[0].cjkChars, 4);
const folioSlide = { added:[], addText(text, opts) { this.added.push({ text, opts }); } };
assert.equal(textHelpers.addText(folioSlide, '03', { x:11.7, y:0.8, fontSize:12, align:'right', marker:true }), true);
assert.equal(textHelpers.addText(folioSlide, '04', { x:11.7, y:0.8, fontSize:12, align:'right' }), false);
assert.equal(folioSlide.added.length, 1);
assert.equal(textRects.length, 1);
assert.equal(CHART_COMPONENT_IDS.has('bar-chart'), true);
assert.deepEqual(plannedComponentsForSlide({
  componentPlan: { components:['proof-gallery', { id:'risk-register', required:false }] }
}).map(component => component.id), ['proof-gallery', 'risk-register']);
assert.equal(reportBoardNeedsRightOverlayRail({
  type:'report-board',
  componentPlan: { components:[{ id:'proof-gallery', required:true }] }
}), true);
assert.equal(nativeVariantSuppressesChartMeta({ layoutVariant:'product-evidence-story' }), true);
assert.equal(nativeVariantSuppressesChartMeta({ layoutVariant:'product-evidence-story', chartSpec:{ version:'chartSpec/v1' } }), false);
const overlayHelpers = createOverlayContractHelpers({
  canvasWidth: () => 13.333,
  canvasHeight: () => 7.5
});
const reportContract = overlayHelpers.nativeRendererContractFor({}, {
  type:'report-board',
  componentPlan: { components:[{ id:'proof-gallery', required:true }] }
}, 'reportBoard');
assert.equal(reportContract.safeOverlayZones['proof-gallery'].id, 'proof-gallery-right-rail');
assert.equal(overlayHelpers.overlaySlotForComponent(reportContract, 'metric-strip').id, 'kpi-strip-bottom-band');
assert.equal(overlayHelpers.componentBlockedByContract({ ownedComponents:[], safeOverlayZones:{} }, 'proof-gallery'), true);
assert.equal(overlayHelpers.componentSlotConflicts({
  occupiedZones:[{ x:0, y:0, w:1, h:1, role:'native' }]
}, { x:0.2, y:0.2, w:0.2, h:0.2 }), true);
assert.equal(overlayHelpers.overlaySlotConflicts([{ id:'a', x:0, y:0, w:1, h:1 }], { x:0.2, y:0.2, w:0.2, h:0.2 }).id, 'a');
const energyContract = overlayHelpers.nativeRendererContractFor({ industry:'energy-utility' }, { type:'architecture' }, 'energyArchitecture');
assert.ok(energyContract.ownedComponents.includes('load-curve-band'));
assert.ok(energyContract.occupiedZones.some(item => item.id === 'topology-board'));
const renderMetaHelpers = createRenderMetaHelpers({
  chartConsumedFields: spec => Object.keys(spec).filter(key => key !== 'visualChecks'),
  chartSpecToComponentId: spec => `${spec.kind || 'unknown'}-component`,
  cwd: () => '/repo',
  mediaForRole: () => 'assets/photo.jpg',
  shortHash: value => `hash:${String(value).slice(0, 4)}`,
  slideRole: () => 'evidence',
  visualRole: () => 'proof'
});
assert.deepEqual(renderMetaHelpers.assetRefsForSlide({}, {
  image:'assets/photo.jpg',
  visual:{ images:['https://example.com/a.png', 'assets/photo.jpg'] }
}), ['assets/photo.jpg', 'https://example.com/a.png']);
const assetDecision = renderMetaHelpers.assetDecisionForMeta({}, {
  generatedAssetPrompt:'render product proof',
  proof:{ sourceTrace:{
    assetAuthorizationStatus:'licensed',
    imageProvenance:[{ proofEligibility:'factual-proof', provenanceClass:'client-supplied', authorizationStatus:'licensed' }]
  } }
});
assert.equal(assetDecision.mode, 'bound');
assert.equal(assetDecision.generatedAssetPromptHash, 'hash:rend');
assert.equal(assetDecision.proofUse, 'factual-proof');
assert.deepEqual(renderMetaHelpers.compactChartSpecForMeta({ kind:'bar', categories:['A'], sourceTrace:{ id:'s1' } }).componentId, 'bar-component');
const chartSlide = {};
renderMetaHelpers.recordChartConsumption(chartSlide, { requestedKind:'waterfall', kind:'bar', title:'Chart' }, { rendered:true, rendererModule:'fixture', componentId:'bar-chart' }, { mode:'overlay' });
assert.equal(chartSlide.__codexChartConsumption.degraded, true);
assert.equal(chartSlide.__codexChartConsumption.actualComponentId, 'bar-chart');
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
