const assert = require('assert/strict');
const path = require('path');
const { requirePptxGen } = require('./render/pptx-runtime');
const { chartConsumedFields } = require('./chart-spec');
const {
  RENDERER_CONTEXT_CONTRACT,
  RENDERER_COLOR_CONTRACT,
  assertRendererContext,
  createRendererContext,
  missingRendererColorTokens,
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
  plannedComponentsForSlide: plannedComponentsForSlideDirect,
  reportBoardNeedsRightOverlayRail: reportBoardNeedsRightOverlayRailDirect
} = require('./render/overlay-component-planning');
const {
  INDUSTRY_NATIVE_COMPONENTS,
  createNativeComponentIdHelpers,
  energyNativeOwnedComponentIds: energyNativeOwnedComponentIdsDirect,
  isEnergyNativeRenderer: isEnergyNativeRendererDirect,
  nativeOwnedComponentIdsFor: nativeOwnedComponentIdsForDirect,
  nativeVariantSuppressesChartMeta: nativeVariantSuppressesChartMetaDirect
} = require('./render/overlay-native-ownership');
const {
  createRenderMetaHelpers
} = require('./render/render-meta');
const {
  createOverlayRenderer
} = require('./render/overlay-renderer');
const {
  createOverlayComponentRenderer
} = require('./render/overlay-component-renderer');
const {
  createOverlayRenderGuardHelpers
} = require('./render/overlay-renderer-guards');
const {
  NATIVE_EVIDENCE_COMPONENT_IDS,
  createOverlayNativeEvidence
} = require('./render/overlay-native-evidence');
const {
  renderProofGallery
} = require('./components/proof-gallery');
const {
  createEnergyIndustryRenderers
} = require('./render/industry/energy');
const {
  createEnergyDeploymentRenderers
} = require('./render/industry/energy-deployment-renderers');
const {
  createEnergyNavigationRenderers
} = require('./render/industry/energy-navigation-renderers');
const {
  createEnergySituationRenderers
} = require('./render/industry/energy-situation-renderers');
const {
  createCoverRenderers
} = require('./render/page-families/cover');

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
assert.equal(textSlide.__codexTextBoxes[0].region, 'chrome');
assert.equal(textSlide.__codexTextBoxes[0].shrinkRisk, false);
const riskTextSlide = { added:[], addText(text, opts) { this.added.push({ text, opts }); } };
textHelpers.recordTextBoxMeta(
  riskTextSlide,
  '这是一段会被压缩到不可读的小字号中文正文，需要被元数据记录为风险。',
  '这是一段会被压缩到不可读的小字号中文正文，需要被元数据记录为风险。',
  { x:1.2, y:2.0, w:1.05, h:0.12, fontSize:7.4, fit:'shrink', typeRole:'body' },
  { x:1.2, y:2.0, w:1.05, h:0.12, fontSize:7.4, fit:'shrink', __finalFitStrategy:'shrink' },
  'body'
);
assert.equal(riskTextSlide.__codexTextBoxes[0].region, 'mainBody');
assert.equal(riskTextSlide.__codexTextBoxes[0].shrinkRisk, true);
assert.equal(riskTextSlide.__codexTextBoxes[0].readabilityRiskLevel, 'fail');
const folioSlide = { added:[], addText(text, opts) { this.added.push({ text, opts }); } };
assert.equal(textHelpers.addText(folioSlide, '03', { x:11.7, y:0.8, fontSize:12, align:'right', marker:true }), true);
assert.equal(textHelpers.addText(folioSlide, '04', { x:11.7, y:0.8, fontSize:12, align:'right' }), false);
assert.equal(folioSlide.added.length, 1);
assert.equal(textRects.length, 1);
assert.equal(CHART_COMPONENT_IDS.has('bar-chart'), true);
assert.deepEqual(plannedComponentsForSlide({
  componentPlan: { components:['proof-gallery', { id:'risk-register', required:false }] }
}).map(component => component.id), ['proof-gallery', 'risk-register']);
assert.deepEqual(plannedComponentsForSlide({
  componentPlan: { components:['gallery-grid', { id:'hero-kpis', required:false }] }
}).map(component => component.id), ['proof-gallery', 'kpi-strip']);
assert.deepEqual(plannedComponentsForSlideDirect({
  componentPlan: { components:['gallery-grid', { id:'hero-kpis', required:false }] }
}).map(component => component.id), ['proof-gallery', 'kpi-strip']);
assert.equal(reportBoardNeedsRightOverlayRail({
  type:'report-board',
  componentPlan: { components:[{ id:'gallery-grid', required:true }] }
}), true);
assert.equal(reportBoardNeedsRightOverlayRailDirect({
  type:'report-board',
  componentPlan: { components:[{ id:'gallery-grid', required:true }] }
}), true);
assert.equal(reportBoardNeedsRightOverlayRailDirect({
  type:'report-board',
  componentPlan: { components:[{ id:'gallery-grid', required:false }] }
}), false);
assert.equal(nativeVariantSuppressesChartMeta({ layoutVariant:'product-evidence-story' }), true);
assert.equal(nativeVariantSuppressesChartMeta({ layoutVariant:'product-evidence-story', chartSpec:{ version:'chartSpec/v1' } }), false);
assert.equal(nativeVariantSuppressesChartMetaDirect({ layoutVariant:'product-evidence-story' }), nativeVariantSuppressesChartMeta({ layoutVariant:'product-evidence-story' }));
assert.equal(isEnergyNativeRendererDirect({ industry:'energy-utility' }, 'energyArchitecture'), true);
assert.equal(energyNativeOwnedComponentIdsDirect().has('load-curve-band'), true);
assert.equal(nativeOwnedComponentIdsForDirect('closing', '').has('value-chain'), true);
const nativeComponentIdHelpers = createNativeComponentIdHelpers({ chartComponentIds: CHART_COMPONENT_IDS });
assert.equal(nativeComponentIdHelpers.nativeComponentIdsFor({ type:'metric-comparison' }).has('bar-chart'), true);
assert.equal(nativeComponentIdHelpers.nativeComponentIdsFor({ type:'product-showcase' }).has('product-matrix'), true);
assert.equal(nativeComponentIdHelpers.nativeComponentIdsFor({ type:'closing' }).has('decision-panel'), true);
assert.equal(nativeComponentIdHelpers.nativeComponentIdsFor({ type:'closing' }).has('source-note'), false);
assert.equal(nativeComponentIdHelpers.nativeComponentIdsFor({ type:'report-board' }).has('source-note'), false);
INDUSTRY_NATIVE_COMPONENTS.forEach(id => {
  assert.equal(
    NATIVE_EVIDENCE_COMPONENT_IDS.has(id),
    true,
    `industry native-owned component needs a nativeDrawnEvidenceFor path: ${id}`
  );
});
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
const overlayGuardHelpers = createOverlayRenderGuardHelpers({
  overlaySlotForComponent: overlayHelpers.overlaySlotForComponent,
  componentBlockedByContract: overlayHelpers.componentBlockedByContract,
  componentSlotConflicts: overlayHelpers.componentSlotConflicts,
  overlaySlotConflicts: overlayHelpers.overlaySlotConflicts
});
assert.equal(
  overlayGuardHelpers.guardOverlayRender('proof-gallery', new Set(), { ownedComponents:[], safeOverlayZones:{}, occupiedZones:[] }, []).blocked.mode,
  'blocked-unsafe-overlay'
);
assert.equal(
  overlayGuardHelpers.guardOverlayRender('proof-gallery', new Set(), {
    ownedComponents:[],
    occupiedZones:[{ id:'native', x:0, y:0, w:1, h:1, role:'native' }],
    safeOverlayZones:{ 'proof-gallery':{ id:'slot', x:0.2, y:0.2, w:0.2, h:0.2, role:'safe-overlay' } }
  }, []).blocked.mode,
  'blocked-native-zone-conflict'
);
assert.equal(
  overlayGuardHelpers.guardOverlayRender('proof-gallery', new Set(), {
    ownedComponents:[],
    occupiedZones:[],
    safeOverlayZones:{ 'proof-gallery':{ id:'slot', x:0.2, y:0.2, w:0.2, h:0.2, role:'safe-overlay' } }
  }, [{ id:'existing', x:0, y:0, w:1, h:1 }]).blocked.mode,
  'blocked-overlay-zone-conflict'
);
assert.equal(
  overlayGuardHelpers.guardOverlayRender('proof-gallery', new Set(['proof-gallery']), {
    ownedComponents:['proof-gallery'],
    occupiedZones:[{ id:'native', x:0, y:0, w:1, h:1, role:'native' }],
    safeOverlayZones:{ 'proof-gallery':{ id:'slot', x:0.2, y:0.2, w:0.2, h:0.2, role:'safe-overlay' } }
  }, [{ id:'existing', x:0, y:0, w:1, h:1 }]).blocked,
  null
);
const energyContract = overlayHelpers.nativeRendererContractFor({ industry:'energy-utility' }, { type:'architecture' }, 'energyArchitecture');
assert.ok(energyContract.ownedComponents.includes('load-curve-band'));
assert.ok(energyContract.occupiedZones.some(item => item.id === 'topology-board'));
const overlayRendererCalls = [];
const overlayRendererDeps = {
  chartComponentIds: new Set(['bar-chart']),
  colors: () => ({
    accent:'0066FF',
    body:'222222',
    captionOnImage:'FFFFFF',
    cyan:'00FFFF',
    darkLine:'334155',
    ink2:'0F172A',
    line:'CBD5E1',
    white:'FFFFFF'
  }),
  compactText: (text, maxChars) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars),
  componentRendererContext: slide => ({ slide, fixture:true }),
  itemBody: value => typeof value === 'string' ? '' : ((value && (value.body || value.note || value.text)) || ''),
  itemTitle: (value, fallback = '') => typeof value === 'string' ? value : ((value && (value.title || value.label || value.value)) || fallback),
  addCaptionBar: (...args) => overlayRendererCalls.push(['caption', args]),
  addLabel: (...args) => overlayRendererCalls.push(['label', args]),
  addRect: (...args) => overlayRendererCalls.push(['rect', args]),
  addSmartPhotoPanel: (...args) => overlayRendererCalls.push(['photo', args]),
  addText: (...args) => overlayRendererCalls.push(['text', args]),
  fileExists: file => file === '/tmp/fixture-image.png',
  mediaForRole: () => '/tmp/fixture-image.png',
  metricStrip: (slide, metrics, x, y, w, opts) => ({ rendered:true, bbox:{ x, y, w, h:opts.h }, itemCount:metrics.length }),
  nativeDrawnEvidenceRendererModule: 'fixture/native',
  overlaySlotForComponent: overlayHelpers.overlaySlotForComponent,
  componentBlockedByContract: overlayHelpers.componentBlockedByContract,
  componentSlotConflicts: overlayHelpers.componentSlotConflicts,
  overlaySlotConflicts: overlayHelpers.overlaySlotConflicts,
  panelFill: () => 'F8FAFC',
  processRail: (...args) => overlayRendererCalls.push(['process', args]),
  recordChartConsumption: (slide, spec, component, meta) => { slide.__chartRecorded = { spec, component, meta }; },
  renderChartSpec: (ctx, spec, box) => ({ rendered:true, bbox:box, rendererModule:'fixture/chart', componentId:'bar-chart' }),
  renderProofGallery: (ctx, items, opts) => ({ rendered:Boolean(items.length), bbox:opts, itemCount:items.length }),
  renderProductMatrix: (ctx, items, opts) => ({ rendered:Boolean(items.length), bbox:opts.bbox, itemCount:items.length, drawnCount:items.length, rendererModule:'components/product-matrix' }),
  renderRiskRegister: (ctx, rows, opts) => ({ rendered:Boolean(rows.length), bbox:opts, rowCount:rows.length }),
  renderValueChain: (ctx, points, opts) => ({ rendered:Boolean(points.length), bbox:opts, itemCount:points.length }),
  routeChartSpec: () => ({ kind:'bar', values:[1, 2] }),
  slideHasChartSpecIntent: slide => Boolean(slide.chartSpec),
  slideRenderedDark: () => false,
  slideRole: () => 'evidence',
  sourceNote: (...args) => overlayRendererCalls.push(['source', args]),
  zone: (id, x, y, w, h, role = 'native') => ({ id, x, y, w, h, role }),
  canvasWidth: () => 13.333,
  canvasHeight: () => 7.5
};
const overlayRenderer = createOverlayRenderer(overlayRendererDeps);
assert.equal(overlayRenderer.componentSourceNoteText({}, { source_note:'Source A' }), '');
assert.equal(overlayRenderer.componentSourceNoteText({ visibleSourceNotes:true }, { source_note:'Source A' }), 'Source A');
assert.equal(overlayRenderer.componentSourceNoteText({ sourceNotePolicy:'enabled' }, { source_note:'Source A' }), '');
assert.equal(overlayRenderer.componentSourceNoteText({ sourceNotePolicy:'yes' }, { source_note:'Source A' }), '');
assert.equal(overlayRenderer.componentSourceNoteText({ sourceNotePolicy:'show' }, { source_note:'Source A' }), 'Source A');
assert.equal(
  overlayRenderer.componentSourceNoteText({ visibleSourceNotes:true, sourceTracePolicy:{ visibleSourceNotes:false } }, { source_note:'Source A' }),
  ''
);
assert.equal(
  overlayRenderer.componentSourceNoteText({ visibleSourceNotes:true }, { sourceTrace:{ sourceNote:'Trace Source A' } }),
  'Trace Source A'
);
assert.equal(overlayRenderer.overlayMetricsForSlide({}, { title:'Revenue +12% YoY' })[0].value, '+12%');
assert.deepEqual(overlayRenderer.overlayPointsForSlide({ phases:[{ title:'A' }, { title:'B' }] }).map(item => item.title), ['A', 'B']);
assert.equal(overlayRenderer.overlayProofItemsForSlide({}, { rows:[['Risk', 'Action']] })[0].body, 'Action');
assert.deepEqual(overlayRenderer.overlayProductItemsForSlide({}, {
  products:[{ name:'Serum', scene:'Counter', efficacy:'Hydration', businessMeaning:'Repeat purchase' }]
})[0], {
  product:'Serum',
  scene:'Counter',
  benefit:'Hydration',
  businessMeaning:'Repeat purchase'
});
function proofGalleryCtx(ops) {
  return {
    slide:{},
    colors:{
      accent:'0066FF',
      body:'222222',
      captionOnImage:'FFFFFF',
      cyan:'00FFFF',
      darkLine:'334155',
      darkMuted:'94A3B8',
      ink:'0F172A',
      ink2:'111827',
      line:'CBD5E1',
      text:'111111',
      violet:'7C3AED'
    },
    addLabel:(...args) => ops.push(['label', args]),
    addRect:(...args) => ops.push(['rect', args]),
    addSmartPhotoPanel:(...args) => ops.push(['photo', args]),
    addText:(...args) => ops.push(['text', args]),
    compactText:(text, maxChars) => String(text || '').slice(0, maxChars),
    panelFill:() => 'F8FAFC'
  };
}
const proofGalleryOps = [];
const proofGalleryStory = renderProofGallery(proofGalleryCtx(proofGalleryOps), [
  { title:'Main proof', body:'Source-bound evidence' },
  { title:'Second proof', body:'Business evidence' }
], {
  x:1,
  y:2,
  w:5,
  h:1.6,
  images:['/tmp/fixture-image.png'],
  caption:'Caption A',
  sourceNote:'Source A'
});
assert.equal(proofGalleryStory.rendered, true);
assert.equal(proofGalleryStory.rendererMethod, 'story');
assert.equal(proofGalleryStory.imageCount, 1);
assert.ok(proofGalleryOps.some(op => op[0] === 'photo'));
assert.ok(proofGalleryOps.some(op => op[0] === 'label' && op[1][1] === 'CAPTION'));
assert.ok(proofGalleryOps.some(op => op[0] === 'text' && op[1][1] === 'Caption A'));
assert.ok(!proofGalleryOps.some(op => op[0] === 'text' && op[1][1] === 'Source A'));
const proofGalleryHiddenSourceOps = [];
renderProofGallery(proofGalleryCtx(proofGalleryHiddenSourceOps), [
  { title:'Main proof', sourceNote:'Item Source A' }
], {
  x:1,
  y:2,
  w:5,
  h:1.6,
  images:['/tmp/fixture-image.png'],
  sourceNote:'Source A'
});
assert.ok(!proofGalleryHiddenSourceOps.some(op => op[0] === 'text' && /Source A|Item Source A/.test(op[1][1])));
const proofGalleryVisibleSourceOps = [];
renderProofGallery(proofGalleryCtx(proofGalleryVisibleSourceOps), [
  { title:'Main proof', sourceNote:'Item Source A' }
], {
  x:1,
  y:2,
  w:5,
  h:1.6,
  images:['/tmp/fixture-image.png'],
  showSourceNote:true,
  sourceNote:'Source A'
});
assert.ok(proofGalleryVisibleSourceOps.some(op => op[0] === 'text' && op[1][1] === 'Source A'));
const blockedOverlay = overlayRenderer.renderOverlayComponent({}, {}, {}, 1, 'proof-gallery', new Set(), { ownedComponents:[], safeOverlayZones:{}, occupiedZones:[] }, []);
assert.equal(blockedOverlay.mode, 'blocked-unsafe-overlay');
const kpiOverlay = overlayRenderer.renderOverlayComponent({}, {}, { metrics:[{ label:'ARR', value:'42%' }] }, 1, 'kpi-strip', new Set(), {
  ownedComponents:[],
  occupiedZones:[],
  safeOverlayZones:{ 'kpi-strip':{ id:'kpi-strip-bottom-band', x:1, y:6, w:4, h:0.5, role:'safe-overlay' } }
}, []);
assert.equal(kpiOverlay.rendered, true);
assert.equal(kpiOverlay.mode, 'overlay');
assert.equal(kpiOverlay.itemCount, 1);
const proofGalleryOverlay = overlayRenderer.renderOverlayComponent({}, {}, {
  visual:{ image:'/tmp/fixture-image.png', caption:'Caption A' },
  cards:[{ title:'Proof A', body:'Evidence body' }]
}, 1, 'proof-gallery', new Set(), {
  ownedComponents:[],
  occupiedZones:[],
  safeOverlayZones:{ 'proof-gallery':{ id:'proof-gallery-story', x:1, y:2, w:5, h:1.6, role:'safe-overlay' } }
}, []);
assert.equal(proofGalleryOverlay.rendered, true);
assert.equal(proofGalleryOverlay.mode, 'overlay');
assert.equal(proofGalleryOverlay.itemCount, 1);
assert.equal(proofGalleryOverlay.bbox.images[0], '/tmp/fixture-image.png');
assert.equal(proofGalleryOverlay.bbox.caption, 'Caption A');
assert.equal(proofGalleryOverlay.bbox.showSourceNote, false);
assert.equal(proofGalleryOverlay.bbox.sourceNote, '');
const visibleProofGalleryOverlay = overlayRenderer.renderOverlayComponent({}, { visibleSourceNotes:true }, {
  sourceNote:'Source A',
  visual:{ image:'/tmp/fixture-image.png', caption:'Caption A' },
  cards:[{ title:'Proof A', body:'Evidence body' }]
}, 1, 'proof-gallery', new Set(), {
  ownedComponents:[],
  occupiedZones:[],
  safeOverlayZones:{ 'proof-gallery':{ id:'proof-gallery-story', x:1, y:2, w:5, h:1.6, role:'safe-overlay' } }
}, []);
assert.equal(visibleProofGalleryOverlay.bbox.showSourceNote, true);
assert.equal(visibleProofGalleryOverlay.bbox.sourceNote, 'Source A');
const productMatrixOverlay = overlayRenderer.renderOverlayComponent({}, {}, {
  products:[{ name:'Serum', scene:'Counter', efficacy:'Hydration', businessMeaning:'Repeat purchase' }]
}, 1, 'product-matrix', new Set(), {
  ownedComponents:[],
  occupiedZones:[],
  safeOverlayZones:{ 'product-matrix':{ id:'product-matrix-board', x:1, y:2, w:5, h:1.4, role:'safe-overlay' } }
}, []);
assert.equal(productMatrixOverlay.rendered, true);
assert.equal(productMatrixOverlay.mode, 'overlay');
assert.equal(productMatrixOverlay.itemCount, 1);
const directOverlayComponentRenderer = createOverlayComponentRenderer(Object.assign({}, overlayRendererDeps, {
  nativeRendererModule: 'fixture/native',
  componentSourceNoteText: overlayRenderer.componentSourceNoteText,
  overlayMetricsForSlide: overlayRenderer.overlayMetricsForSlide,
  overlayPointsForSlide: overlayRenderer.overlayPointsForSlide,
  overlayProductItemsForSlide: overlayRenderer.overlayProductItemsForSlide,
  overlayProofItemsForSlide: overlayRenderer.overlayProofItemsForSlide,
  guardOverlayRender: overlayGuardHelpers.guardOverlayRender,
  nativeDrawnEvidenceFor: overlayRenderer.nativeDrawnEvidenceFor
}));
const directKpiOverlay = directOverlayComponentRenderer.renderOverlayComponent({}, {}, { metrics:[{ label:'ARR', value:'42%' }] }, 1, 'metric-strip', new Set(), {
  ownedComponents:[],
  occupiedZones:[],
  safeOverlayZones:{ 'metric-strip':{ id:'metric-strip-bottom-band', x:1, y:6, w:4, h:0.5, role:'safe-overlay' } }
}, []);
assert.equal(directKpiOverlay.rendered, true);
assert.equal(directKpiOverlay.mode, 'overlay');
assert.equal(directKpiOverlay.itemCount, kpiOverlay.itemCount);
const chartSlideFixture = {};
const chartOverlay = overlayRenderer.renderOverlayComponent(chartSlideFixture, { slides:[{}] }, { chartSpec:{ kind:'bar' } }, 1, 'bar-chart', new Set(), {
  ownedComponents:[],
  occupiedZones:[],
  safeOverlayZones:{ 'bar-chart':{ id:'chart-overlay', x:1, y:1, w:3, h:2, role:'safe-overlay' } }
}, []);
assert.equal(chartOverlay.rendered, true);
assert.equal(chartSlideFixture.__chartRecorded.meta.plannedComponentId, 'bar-chart');
assert.equal(chartOverlay.bbox.showSourceNote, false);
const visibleChartSlideFixture = {};
const visibleChartOverlay = overlayRenderer.renderOverlayComponent(visibleChartSlideFixture, { visibleSourceNotes:true, slides:[{}] }, { chartSpec:{ kind:'bar' } }, 1, 'bar-chart', new Set(), {
  ownedComponents:[],
  occupiedZones:[],
  safeOverlayZones:{ 'bar-chart':{ id:'chart-overlay', x:1, y:1, w:3, h:2, role:'safe-overlay' } }
}, []);
assert.equal(visibleChartOverlay.bbox.showSourceNote, true);
const nativeEvidence = overlayRenderer.renderOverlayComponent({}, {}, { type:'architecture-dark', layers:[{ title:'Data' }] }, 1, 'value-chain', new Set(['value-chain']), {
  ownedComponents:['value-chain'],
  safeOverlayZones:{},
  occupiedZones:[{ id:'topology-board', x:1, y:1, w:4, h:3, role:'native' }]
}, []);
assert.equal(nativeEvidence.mode, 'native-renderer');
assert.equal(nativeEvidence.rendererModule, 'fixture/native');
const nativeEvidenceHelpers = createOverlayNativeEvidence({
  chartComponentIds: new Set(['bar-chart']),
  nativeRendererModule: 'fixture/native-helper',
  canvasWidth: () => 13.333,
  canvasHeight: () => 7.5,
  zone: (id, x, y, w, h, role = 'native') => ({ id, x, y, w, h, role }),
  slideHasChartSpecIntent: slide => Boolean(slide.chartSpec),
  componentSourceNoteText: () => 'Source A'
});
assert.equal(
  nativeEvidenceHelpers.evidenceZone({ occupiedZones:[{ id:'stage-native', x:0, y:0, w:13.333, h:7.5, role:'native' }] }, [/stage/]).id,
  'stage-native'
);
const chartNativeEvidence = nativeEvidenceHelpers.nativeDrawnEvidenceFor({}, {
  type:'metric-comparison',
  chartSpec:{ kind:'bar' },
  metrics:[{ label:'ARR', value:'42%' }]
}, 'bar-chart', {
  occupiedZones:[{ id:'chart-board', x:4, y:2, w:7, h:3, role:'native chart' }]
}, {});
assert.equal(chartNativeEvidence.rendererMethod, 'nativeDrawnEvidenceFor');
assert.equal(chartNativeEvidence.nativeSlot, 'chart-board');
assert.equal(chartNativeEvidence.drawnCount, 1);
assert.equal(chartNativeEvidence.rendererModule, 'fixture/native-helper');
assert.equal(
  nativeEvidenceHelpers.nativeDrawnEvidenceFor({}, { type:'report-board', sourceNote:'Source A' }, 'source-note', {
    safeOverlayZones:{ 'source-note':{ id:'source-note-footer', x:8, y:7, w:4, h:0.2, role:'safe-overlay' } }
  }, {}),
  null,
  'native evidence should not mark source-note consumed unless a native renderer actually draws it'
);
const energyCalls = [];
const energyCtx = {
  colors: () => ({
    accent:'0066FF',
    body:'222222',
    captionOnImage:'FFFFFF',
    cyan:'00FFFF',
    ink:'0F172A',
    ink2:'111827',
    muted:'64748B',
    text:'111111',
    violet:'7C3AED',
    white:'FFFFFF'
  }),
  canvasWidth: () => 13.333,
  canvasHeight: () => 7.5,
  addDarkBreathingCircle: (...args) => energyCalls.push(['darkCircle', args]),
  addEnergyLens: (...args) => energyCalls.push(['energyLens', args]),
  addHairline: (...args) => energyCalls.push(['hairline', args]),
  addLabel: (...args) => energyCalls.push(['label', args]),
  addNumber: (...args) => energyCalls.push(['number', args]),
  addPulseCurve: (...args) => energyCalls.push(['pulse', args]),
  addRect: (...args) => energyCalls.push(['rect', args]),
  addText: (...args) => energyCalls.push(['text', args]),
  addVisualPhotoPanel: () => false,
  footerText: () => 'Footer',
  glassPanel: (...args) => energyCalls.push(['glass', args]),
  hasEnergyCurveSemantics: () => true,
  lightCanvas: (...args) => energyCalls.push(['lightCanvas', args]),
  panelFill: () => 'F8FAFC',
  sectionKicker: (...args) => energyCalls.push(['sectionKicker', args]),
  slideWantsImage: () => false,
  stageCanvas: (...args) => energyCalls.push(['stageCanvas', args])
};
const energyRenderers = createEnergyIndustryRenderers(energyCtx);
[
  'energyDeploymentRadius',
  'energyCapabilityLoop',
  'energyProblemSplit',
  'energySituationEditorial',
  'energyToc',
  'energyValueSignal'
].forEach(name => assert.equal(typeof energyRenderers[name], 'function', `${name} should be exported by energy industry renderers`));
const deploymentSlide = { shapes:[], addShape(type, opts) { this.shapes.push({ type, opts }); } };
energyRenderers.energyDeploymentRadius(deploymentSlide, {}, {
  title:'区域推广',
  phases:[
    { title:'试点', body:'选择重点站点' },
    { title:'闭环', body:'验证告警处置' }
  ],
  note:'先验证再扩展'
}, 5);
assert.ok(energyCalls.some(([kind, args]) => kind === 'label' && args[1] === 'DEPLOYMENT RADIUS'));
assert.ok(deploymentSlide.shapes.some(shape => shape.type === 'ellipse'));
let directDeploymentFooterDark = null;
const directDeployment = createEnergyDeploymentRenderers(energyCtx, {
  addEnergyFooter: (_slide, _plan, dark) => {
    directDeploymentFooterDark = dark;
  }
});
const directDeploymentSlide = { shapes:[], addShape(type, opts) { this.shapes.push({ type, opts }); } };
const deploymentLabelBefore = energyCalls.filter(([kind, args]) => kind === 'label' && args[1] === 'DEPLOYMENT RADIUS').length;
directDeployment.energyDeploymentRadius(directDeploymentSlide, {}, {
  phases:[{ title:'试点', body:'选择重点站点' }]
}, 6);
assert.equal(directDeploymentFooterDark, true);
assert.ok(
  energyCalls.filter(([kind, args]) => kind === 'label' && args[1] === 'DEPLOYMENT RADIUS').length > deploymentLabelBefore
);
assert.ok(directDeploymentSlide.shapes.some(shape => shape.type === 'ellipse'));
const energySlide = { shapes:[], addShape(type, opts) { this.shapes.push({ type, opts }); } };
energyRenderers.energyToc(energySlide, {}, { title:'运行路径', items:['A', 'B'] }, 2);
assert.ok(energyCalls.some(([kind, args]) => kind === 'label' && args[1] === 'OPERATING SEQUENCE'));
assert.ok(energySlide.shapes.length > 0);
let directNavigationFooterDark = null;
const directNavigation = createEnergyNavigationRenderers(energyCtx, {
  addEnergyFooter: (_slide, _plan, dark) => {
    directNavigationFooterDark = dark;
  }
});
const directEnergySlide = { shapes:[], addShape(type, opts) { this.shapes.push({ type, opts }); } };
const directLabelCountBefore = energyCalls.filter(([kind, args]) => kind === 'label' && args[1] === 'OPERATING SEQUENCE').length;
directNavigation.energyToc(directEnergySlide, {}, { title:'运行路径', items:['A', 'B'] }, 2);
assert.equal(directNavigationFooterDark, true);
assert.ok(
  energyCalls.filter(([kind, args]) => kind === 'label' && args[1] === 'OPERATING SEQUENCE').length > directLabelCountBefore
);
assert.ok(directEnergySlide.shapes.length > 0);
const situationSlide = { shapes:[], addShape(type, opts) { this.shapes.push({ type, opts }); } };
energyRenderers.energySituationEditorial(situationSlide, {}, {
  title:'站点现状',
  left:['A', 'B'],
  cards:[
    { title:'设备', body:'统一接入' },
    { title:'告警', body:'闭环处置' }
  ]
}, 3);
assert.ok(energyCalls.some(([kind, args]) => kind === 'label' && args[1] === 'SITE READOUT'));
assert.equal(situationSlide.background.color, 'F7FAFD');
let directSituationFooterDark = null;
const directSituation = createEnergySituationRenderers(energyCtx, {
  addEnergyFooter: (_slide, _plan, dark) => {
    directSituationFooterDark = dark;
  }
});
const directSituationSlide = { shapes:[], addShape(type, opts) { this.shapes.push({ type, opts }); } };
const siteReadoutBefore = energyCalls.filter(([kind, args]) => kind === 'label' && args[1] === 'SITE READOUT').length;
directSituation.energySituationEditorial(directSituationSlide, {}, {
  title:'站点现状',
  left:['A'],
  cards:[{ title:'设备', body:'统一接入' }]
}, 4);
assert.equal(directSituationFooterDark, false);
assert.equal(directSituationSlide.background.color, 'F7FAFD');
assert.ok(
  energyCalls.filter(([kind, args]) => kind === 'label' && args[1] === 'SITE READOUT').length > siteReadoutBefore
);
const coverCalls = [];
const coverCtx = {
  colors: () => ({
    accent:'0066FF',
    body:'222222',
    captionOnImage:'FFFFFF',
    cyan:'00FFFF',
    ink:'0F172A',
    ink2:'111827',
    line:'CBD5E1',
    muted:'64748B',
    panelAlt:'F1F5F9',
    softBlue:'EFF6FF',
    text:'111111',
    violet:'7C3AED',
    white:'FFFFFF'
  }),
  canvasWidth: () => 13.333,
  canvasHeight: () => 7.5,
  fileExists: () => false,
  addArrowLine: (...args) => coverCalls.push(['arrow', args]),
  addDarkBreathingCircle: (...args) => coverCalls.push(['darkCircle', args]),
  addDeckMeta: (...args) => coverCalls.push(['deckMeta', args]),
  addEnergyLens: (...args) => coverCalls.push(['energyLens', args]),
  addEnergyMotionBackdrop: () => false,
  addEnergyPhotoBackdrop: (...args) => coverCalls.push(['energyPhoto', args]),
  addHairline: (...args) => coverCalls.push(['hairline', args]),
  addLabel: (...args) => coverCalls.push(['label', args]),
  addLightBreathingCircle: (...args) => coverCalls.push(['lightCircle', args]),
  addNumber: (...args) => coverCalls.push(['number', args]),
  addPhotoPanel: (...args) => coverCalls.push(['photo', args]),
  addPulseCurve: (...args) => coverCalls.push(['pulse', args]),
  addRect: (...args) => coverCalls.push(['rect', args]),
  addText: (...args) => coverCalls.push(['text', args]),
  addVisualPhotoBackdrop: () => false,
  copyFallback: (plan, key, fallback = '') => fallback || key,
  designForSlide: () => ({ wantsImage:false, imagePath:'', imageRole:'' }),
  footerText: () => 'Footer',
  genericShowcaseField: (...args) => coverCalls.push(['showcase', args]),
  industryProfile: () => ({ label:'DIGITAL', insight:'Insight', coverField:'generic' }),
  isCompanyIntroPlan: () => false,
  itemBody: value => (value && value.body) || '',
  itemTitle: value => (value && value.title) || '',
  lightCanvas: (...args) => coverCalls.push(['lightCanvas', args]),
  masterDark: (...args) => coverCalls.push(['masterDark', args]),
  metaDisabled: () => false,
  panelFill: () => 'FFFFFF',
  presentationSpec: () => ({ coverTone:'dark' }),
  profile: () => ({ palette:'fixture' }),
  profileFont: () => 'Fixture',
  stageCanvas: (...args) => coverCalls.push(['stageCanvas', args]),
  surfaceFill: () => 'FFFFFF',
  typeSize: (name, fallback) => fallback,
  typeToken: () => ({ breakAt:22 }),
  variantOf: () => ''
};
const coverRenderers = createCoverRenderers(coverCtx);
assert.equal(typeof coverRenderers.coverDark, 'function');
coverRenderers.coverDark({ addShape() {} }, { title:'Digital Operations Platform', date:'2026' }, { title:'Digital Operations Platform' });
assert.ok(coverCalls.some(([kind]) => kind === 'masterDark'));
assert.ok(coverCalls.some(([kind]) => kind === 'deckMeta'));
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
const topLevelProvenanceAssetDecision = renderMetaHelpers.assetDecisionForMeta({}, {
  image:'assets/top-level-proof.png',
  imageProvenance:[{ id:'slide-top-img', proofEligibility:'factual-proof', provenanceClass:'client-supplied', authorizationStatus:'licensed' }]
});
assert.equal(topLevelProvenanceAssetDecision.imageProvenanceCount, 1);
assert.equal(topLevelProvenanceAssetDecision.authorizationStatus, 'licensed');
assert.equal(topLevelProvenanceAssetDecision.authorizationStatusNormalized, 'cleared');
assert.equal(topLevelProvenanceAssetDecision.proofUse, 'factual-proof');
const blockedProvenanceAssetDecision = renderMetaHelpers.assetDecisionForMeta({}, {
  image:'assets/blocked-proof.png',
  sourceTrace:{
    assetAuthorizationStatus:'cleared',
    imageProvenance:[{ id:'blocked-img', proofEligibility:'factual-proof', provenanceClass:'client-supplied', authorizationStatus:'blocked' }]
  }
});
assert.equal(blockedProvenanceAssetDecision.authorizationStatus, 'blocked');
assert.equal(blockedProvenanceAssetDecision.authorizationStatusNormalized, 'blocked');
assert.equal(blockedProvenanceAssetDecision.riskLevel, 'high');
assert.equal(blockedProvenanceAssetDecision.reviewRequired, true);
const mergedTraceSlide = {
  image:'assets/merged-proof.png',
  proof:{ sourceTrace:{
    sourceIds:['proof-src'],
    sources:[{ id:'proof-src', page:1, excerpt:'proof excerpt' }]
  } },
  sourceTrace:{
    sourceIds:['slide-src'],
    sources:[{ id:'slide-src', page:2, excerpt:'slide excerpt' }],
    imageProvenance:[{ sourceId:'slide-img', proofEligibility:'factual-proof', provenanceClass:'client-supplied', authorizationStatus:'cleared' }],
    assetAuthorizationStatus:'cleared'
  }
};
const mergedTrace = renderMetaHelpers.sourceTraceForMeta(mergedTraceSlide);
assert.deepEqual([...mergedTrace.sourceIds].sort(), ['proof-src', 'slide-src']);
assert.equal(mergedTrace.imageProvenance.length, 1);
const mergedTraceAssetDecision = renderMetaHelpers.assetDecisionForMeta({}, mergedTraceSlide);
assert.equal(mergedTraceAssetDecision.imageProvenanceCount, 1);
assert.equal(mergedTraceAssetDecision.authorizationStatus, 'cleared');
assert.equal(mergedTraceAssetDecision.proofUse, 'factual-proof');
const defaultMediaMetaHelpers = createRenderMetaHelpers({
  chartConsumedFields: () => [],
  chartSpecToComponentId: () => '',
  cwd: () => '/repo',
  mediaForRole: (plan, slide, role, opts = {}) => opts.includeDefault === false ? '' : 'assets/default-industry.jpg',
  slideRole: () => 'content',
  visualRole: () => 'structure'
});
const defaultOnlyAssetDecision = defaultMediaMetaHelpers.assetDecisionForMeta({ industry:'manufacturing-operations' }, {
  title:'No explicit bound asset'
});
assert.equal(defaultOnlyAssetDecision.status, 'none');
assert.equal(defaultOnlyAssetDecision.boundAssetCount, 0);
assert.equal(defaultOnlyAssetDecision.defaultMediaCount, 1);
assert.deepEqual(defaultOnlyAssetDecision.defaultMediaRefs, ['assets/default-industry.jpg']);
assert.deepEqual(renderMetaHelpers.compactChartSpecForMeta({ kind:'bar', categories:['A'], sourceTrace:{ id:'s1' } }).componentId, 'bar-component');
assert.ok(chartConsumedFields({
  kind:'bar',
  sourceTrace:{ source_ids:'src-meta', sources:[{ id:'src-meta', page:1, excerpt:'Meta source excerpt.' }] }
}).includes('sourceTrace'));
const chartSlide = {};
renderMetaHelpers.recordChartConsumption(chartSlide, { requestedKind:'waterfall', kind:'bar', title:'Chart' }, { rendered:true, rendererModule:'fixture', componentId:'bar-chart' }, { mode:'overlay' });
assert.equal(chartSlide.__codexChartConsumption.degraded, true);
assert.equal(chartSlide.__codexChartConsumption.actualComponentId, 'bar-chart');
const context = createRendererContext({ colors: () => ({ accent: '000000' }) });
assert.equal(context.colors().accent, '000000');
assert.ok(RENDERER_CONTEXT_CONTRACT.text.includes('addText'));
assert.ok(RENDERER_COLOR_CONTRACT.cover.includes('accent'));
assert.deepEqual(missingRendererContextKeys(context, ['colors']), ['presentationSpec', 'panelFill', 'surfaceFill']);
assert.deepEqual(missingRendererColorTokens(context, ['cover']).slice(0, 2), ['cover.body', 'cover.captionOnImage']);
assert.throws(
  () => assertRendererContext({ colors: () => ({ accent:'000000' }) }, ['cover']),
  /cover.*missing helpers.*addArrowLine.*missing colors/s
);
assert.ok(RENDERER_CONTEXT_CONTRACT.closing.includes('addVisualPhotoBackdrop'));
assert.ok(RENDERER_CONTEXT_CONTRACT.closing.includes('copyPolicyList'));
assert.ok(RENDERER_CONTEXT_CONTRACT.business.includes('reportBoardNeedsRightOverlayRail'));
assert.ok(RENDERER_CONTEXT_CONTRACT.chapter.includes('stageCanvas'));
assert.ok(RENDERER_CONTEXT_CONTRACT.general.includes('masterLight'));
assert.ok(RENDERER_CONTEXT_CONTRACT.toc.includes('glassPanel'));
assert.ok(RENDERER_CONTEXT_CONTRACT.manifesto.includes('stageCanvas'));
assert.ok(RENDERER_CONTEXT_CONTRACT.profile.includes('EvidenceImageFrame'));
assert.ok(RENDERER_CONTEXT_CONTRACT.beauty.includes('genericShowcaseField'));
assert.ok(RENDERER_CONTEXT_CONTRACT.cover.includes('addDeckMeta'));
assert.ok(RENDERER_CONTEXT_CONTRACT.cover.includes('addNumber'));
assert.ok(RENDERER_CONTEXT_CONTRACT.financial.includes('renderChartSpec'));
assert.ok(RENDERER_CONTEXT_CONTRACT.financial.includes('componentRendererContext'));
assert.ok(RENDERER_CONTEXT_CONTRACT.financial.includes('variantOf'));
assert.ok(RENDERER_CONTEXT_CONTRACT.timeline.includes('addClockwiseLoopConnectors'));
assert.ok(RENDERER_CONTEXT_CONTRACT.architectureCore.includes('stageCanvas'));
assert.ok(RENDERER_COLOR_CONTRACT.architectureCore.includes('darkMuted'));
assert.ok(RENDERER_CONTEXT_CONTRACT.risk.includes('compactEvidenceCaption'));
assert.ok(RENDERER_CONTEXT_CONTRACT.risk.includes('variantOf'));
assert.ok(RENDERER_CONTEXT_CONTRACT.strategy.includes('industryProfile'));
assert.ok(RENDERER_CONTEXT_CONTRACT.evidenceGallery.includes('brandWorldBusinessProof'));
assert.ok(RENDERER_CONTEXT_CONTRACT.financialScorecard.includes('formatMetricDelta'));
['financial', 'beauty', 'business', 'chapter', 'cover', 'general', 'toc', 'manifesto', 'profile', 'evidenceGallery', 'closing', 'architecture', 'timeline', 'risk', 'strategy'].forEach(key => {
  assert.ok(Array.isArray(PAGE_FAMILY_MODULES[key]), `${key} page-family module boundary should be declared`);
  assert.ok(PAGE_FAMILY_MODULES[key].length > 0, `${key} page-family module should list routed types`);
});
[
  'financial',
  'beauty',
  'business',
  'chapter',
  'cover',
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
