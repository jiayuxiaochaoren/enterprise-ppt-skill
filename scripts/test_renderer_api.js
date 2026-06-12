const assert = require('assert/strict');
const { createChromeHelpers } = require('./render/chrome-helpers');
const { createRendererApi } = require('./render/renderer-api');
const { createRenderRuntime } = require('./render/render-runtime');
const {
  RENDERER_CONTEXT_CONTRACT,
  missingRendererContextKeys
} = require('./render/renderer-context');

const colors = {
  accent:'0066FF',
  body:'222222',
  captionOnImage:'FFFFFF',
  cyan:'00FFFF',
  darkLine:'334155',
  darkMuted:'94A3B8',
  ink:'0F172A',
  ink2:'111827',
  line:'CBD5E1',
  muted:'64748B',
  onAccent:'FFFFFF',
  panelAlt:'F1F5F9',
  paper:'F8FAFC',
  risk:'EF4444',
  softBlue:'EFF6FF',
  text:'111111',
  violet:'7C3AED',
  white:'FFFFFF'
};
let textHelpers;
const chromeHelpers = createChromeHelpers({
  FONT_STACK: { zh:'Fixture CJK', latin:'Fixture Latin', number:'Fixture Number' },
  MEDIA_ASSETS: {},
  canvasHeight: () => 7.5,
  canvasWidth: () => 13.333,
  colors: () => colors,
  compactEvidenceCaption: text => String(text || ''),
  containsCjk: text => /[\u4e00-\u9fff]/.test(text),
  copyPolicyText: (_plan, key, fallback = '') => fallback || key,
  design: () => ({
    palettes:{ fixture:{ presentation:{ panelFill:'FFFFFF', surfaceFill:'F8FAFC' } } },
    visualSystem:{ industryProfiles:{ 'energy-utility':{ layoutOverrides:{ toc:'energyToc' } } } },
    slideDesign: () => ({ role:'toc', wantsImage:false, imagePath:'', imageRole:'' })
  }),
  imageDimensions: () => ({ w:1200, h:800 }),
  itemBody: item => (item && item.body) || '',
  itemTitle: (item, fallback = '') => (item && item.title) || fallback,
  localizeMicrocopy: (_plan, text) => text,
  mediaForRole: () => '',
  normalizeTypographyOptions: (_plan, _text, opts) => opts,
  profile: () => ({ font:'Fixture CJK', palette:'fixture' }),
  renderKpiStrip: () => ({ rendered:true }),
  renderState: () => ({ plan:{ industry:'energy-utility' }, slide:{ type:'toc-clean' }, idx:2 }),
  resolveAssetPath: value => value,
  resolveTypeToken: (_plan, _name, opts) => opts.token || {},
  slideSemanticText: slideLike => slideLike.title || '',
  slideWantsImage: () => false,
  stripEllipsisText: text => text,
  textHelpers: () => textHelpers,
  visualIndustryId: id => id,
  visualRole: () => 'proof',
  zone: (id, x, y, w, h, role) => ({ id, x, y, w, h, role }),
  zoneBounds: bbox => bbox
});
textHelpers = {
  addText() { return true; },
  isPageFolioText: () => false,
  normalizePageFolioTextOptions: opts => opts,
  pageFolioRendered: () => false
};
const rendererApi = createRendererApi({
  chromeHelpers,
  colors: () => colors,
  canvasWidth: () => 13.333,
  canvasHeight: () => 7.5,
  copyPolicyList: () => [],
  compactEvidenceCaption: text => String(text || ''),
  chooseEvidenceImageLayout: () => ({}),
  chooseFourImageLayout: () => ({}),
  formatMetricDelta: value => String(value || ''),
  itemBody: item => (item && item.body) || '',
  itemBodyNoEllipsis: item => (item && item.body) || '',
  itemTitle: (item, fallback = '') => typeof item === 'string' ? item : ((item && item.title) || fallback),
  publicSlideNote: value => value || '',
  recordChartConsumption: () => {},
  reportBoardNeedsRightOverlayRail: () => false,
  routeChartSpec: () => null,
  renderChartSpec: () => ({ rendered:false }),
  chartSpecToComponentId: spec => spec && spec.kind || 'chart',
  variantOf: (slide, fallback = '') => slide.layoutVariant || slide.variant || fallback,
  galleryImages: () => [],
  mediaForRole: () => '',
  resolveAssetPath: value => value,
  slideWantsImage: () => false
});
const runtime = createRenderRuntime(rendererApi);
const context = runtime.getRendererContext();
assert.deepEqual(missingRendererContextKeys(context, Object.keys(RENDERER_CONTEXT_CONTRACT)), []);
assert.equal(runtime.industryRendererMatchFor({ industry:'energy-utility' }, { type:'toc-clean' }, 'toc-clean').rendererName, 'energyToc');
assert.equal(runtime.slideRenderRegistry().matchFor('unknown-type').matchKind, 'fallback');

console.log('renderer api factory ok');
