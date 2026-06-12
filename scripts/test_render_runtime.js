const assert = require('assert/strict');
const { createRenderRuntime } = require('./render/render-runtime');
const { RENDERER_CONTEXT_CONTRACT } = require('./render/renderer-context');

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
  tertiary:'7C3AED',
  text:'111111',
  violet:'7C3AED',
  white:'FFFFFF'
};
const noop = () => {};
const baseApi = {};
Object.values(RENDERER_CONTEXT_CONTRACT).flat().forEach(key => {
  baseApi[key] = noop;
});
Object.assign(baseApi, {
  colors: () => colors,
  canvasWidth: () => 13.333,
  canvasHeight: () => 7.5,
  fileExists: () => false,
  activePlan: () => ({ industry:'energy-utility' }),
  compactEvidenceCaption: text => String(text || ''),
  componentRendererContext: slide => ({ slide }),
  copyFallback: (_plan, key, fallback = '') => fallback || key,
  copyPolicyList: () => [],
  designForSlide: () => ({ role:'toc', wantsImage:false, imagePath:'', imageRole:'' }),
  footerText: () => 'Footer',
  formatMetricDelta: value => String(value || ''),
  galleryImages: () => [],
  imageAspect: () => 1.5,
  imagePathFromItem: () => '',
  industryProfile: () => ({ label:'Energy', layoutOverrides:{ toc:'energyToc' } }),
  isCompanyIntroPlan: () => false,
  isVisualIndustry: () => false,
  itemBody: value => (value && value.body) || '',
  itemBodyNoEllipsis: value => (value && value.body) || '',
  itemTitle: (value, fallback = '') => typeof value === 'string' ? value : ((value && value.title) || fallback),
  mediaForRole: () => '',
  metaDisabled: () => false,
  panelFill: () => 'FFFFFF',
  presentationSpec: () => ({}),
  profile: () => ({ font:'Fixture' }),
  profileFont: () => 'Fixture',
  publicSlideNote: value => value || '',
  recordChartConsumption: noop,
  renderChartSpec: () => ({ rendered:false }),
  reportBoardNeedsRightOverlayRail: () => false,
  resolveAssetPath: value => value,
  routeChartSpec: () => null,
  slideWantsImage: () => false,
  smartPhotoFit: () => 'cover',
  surfaceFill: () => 'F8FAFC',
  typeSize: (_name, fallback) => fallback,
  typeToken: (_name, fallback) => fallback || {},
  variantOf: (slide, fallback = '') => slide.layoutVariant || slide.variant || fallback
});
['addRect', 'addText', 'addLabel', 'addNumber', 'addHairline', 'addArrowLine', 'addPhotoPanel', 'addSmartPhotoPanel', 'addDarkBreathingCircle', 'addLightBreathingCircle', 'addPulseCurve', 'addVisualPhotoPanel', 'addVisualPhotoBackdrop', 'PageNumber', 'lightCanvas', 'stageCanvas', 'masterDark', 'masterLight', 'sectionKicker', 'glassPanel', 'genericShowcaseField', 'ContactBlock', 'EvidenceImageFrame', 'MetricStrip', 'addEnergyLens', 'addEnergyMotionBackdrop', 'addEnergyPhotoBackdrop', 'addDeckMeta', 'addClockwiseLoopConnectors', 'addArrowBetweenRects', 'addEvidenceCaptionStack', 'addEquipmentNameplate'].forEach(key => {
  baseApi[key] = noop;
});

const runtime = createRenderRuntime(baseApi);
const registry = runtime.slideRenderRegistry();

assert.equal(registry.matchFor('metric-comparison').rendererId, 'metric-comparison');
assert.equal(registry.matchFor('metric-comparison').source, 'page-family:financial');
assert.equal(registry.matchFor('executive-blocks').source, 'page-family:business');
assert.equal(registry.matchFor('unknown-type').matchKind, 'fallback');
assert.equal(registry.matchFor('unknown-type').rendererName, 'fallbackBulletsSlide');
const industryMatch = runtime.industryRendererMatchFor({ industry:'energy-utility' }, { type:'toc-clean' }, 'toc-clean');
assert.equal(industryMatch.matchKind, 'industry-override');
assert.equal(industryMatch.source, 'industry-layout-override');
assert.equal(industryMatch.rendererName, 'energyToc');
assert.equal(typeof runtime.getRendererContext().brandWorldBusinessProof, 'function');
assert.equal(typeof runtime.getFamilyRenderers().fallbackBulletsSlide, 'function');

console.log('render runtime assembly ok');
