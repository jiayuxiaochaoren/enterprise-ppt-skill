const assert = require('assert/strict');
const {
  createClosingCoreRenderers
} = require('./render/page-families/closing-core');
const {
  createClosingStandardRenderers
} = require('./render/page-families/closing-standard');
const {
  createRiskBoardRenderers
} = require('./render/page-families/risk-boards');
const {
  createRiskBoardLayoutRenderers
} = require('./render/page-families/risk-board-layouts');
const {
  createEvidenceGalleryCoreRenderers
} = require('./render/page-families/evidence-gallery-core');
const {
  createEvidenceGalleryLayoutRenderers
} = require('./render/page-families/evidence-gallery-layouts');
const {
  createPageFamilyPrimitives
} = require('./render/page-families/primitives');
const {
  PAGE_FAMILY_PRIMITIVE_GROUPS,
  P2_PAGE_FAMILY_PRIMITIVE_TARGETS,
  primitiveGroupIds,
  requiredPageFamilyPrimitiveExports
} = require('./render/page-families/primitive-contract');
const {
  createAuditedRendererContext,
  flattenRendererContextContract
} = require('./render/renderer-context');

function createFixtureContext() {
  const colors = {
    accent:'2563EB',
    body:'1F2937',
    captionOnImage:'FFFFFF',
    cyan:'06B6D4',
    darkLine:'334155',
    darkMuted:'94A3B8',
    ink:'0F172A',
    ink2:'111827',
    line:'CBD5E1',
    muted:'64748B',
    onAccent:'FFFFFF',
    panelAlt:'F1F5F9',
    risk:'EF4444',
    softBlue:'EFF6FF',
    text:'111827',
    violet:'7C3AED',
    white:'FFFFFF'
  };
  const fallbackFn = (_a, _b, fallback) => fallback || '';
  const target = {
    activePlan: () => ({}),
    colors: () => colors,
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    copyFallback: (_plan, _key, fallback = '') => fallback,
    copyPolicyList: () => [],
    designForSlide: () => ({ wantsImage:false, imagePath:'' }),
    fileExists: () => false,
    footerText: () => '',
    galleryImages: () => [],
    isCompanyIntroPlan: () => false,
    itemBody: item => (item && item.body) || '',
    itemTitle: (item, fallback = '') => (item && item.title) || fallback,
    mediaForRole: () => '',
    metaDisabled: () => false,
    panelFill: () => 'FFFFFF',
    presentationSpec: () => ({}),
    profileFont: () => 'Fixture',
    resolveAssetPath: value => value,
    smartPhotoFit: () => 'cover',
    surfaceFill: () => 'F8FAFC',
    typeSize: (_name, fallback = 12) => fallback,
    variantOf: (_slide, fallback = '') => fallback
  };
  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      return fallbackFn;
    }
  });
}

function sortedKeys(value) {
  return Object.keys(value).sort();
}

const ctx = createFixtureContext();
const closingStandard = createClosingStandardRenderers(ctx, {
  closingActions: () => [],
  closingMeta: () => ''
});
const closingCore = createClosingCoreRenderers(ctx);
assert.ok(sortedKeys(closingCore).includes('closingAdaptive'));
assert.ok(sortedKeys(closingCore).includes('premiumClosingAnchor'));
assert.ok(sortedKeys(closingCore).includes('closingFinanceInvestmentDecision'));
assert.ok(sortedKeys(closingStandard).every(key => sortedKeys(closingCore).includes(key)));

assert.deepEqual(sortedKeys(createRiskBoardRenderers(ctx)), sortedKeys(createRiskBoardLayoutRenderers(ctx)));
assert.deepEqual(sortedKeys(createEvidenceGalleryCoreRenderers(ctx)), sortedKeys(createEvidenceGalleryLayoutRenderers(ctx)));

const audit = createAuditedRendererContext(ctx);
createClosingCoreRenderers(audit.context);
createRiskBoardRenderers(audit.context);
createEvidenceGalleryCoreRenderers(audit.context);
const allowed = new Set(flattenRendererContextContract(['closing', 'risk', 'evidenceGallery']));
const extraAccesses = audit.accessedKeys().filter(key => !allowed.has(key));
assert.deepEqual(extraAccesses, []);

const primitiveOps = [];
const primitives = createPageFamilyPrimitives({
  colors: () => ({
    accent:'2563EB',
    body:'1F2937',
    cyan:'06B6D4',
    darkMuted:'94A3B8',
    line:'CBD5E1',
    muted:'64748B',
    text:'111827'
  }),
  addEvidenceCaptionStack: (...args) => primitiveOps.push(['addEvidenceCaptionStack', args]),
  addRect: (...args) => primitiveOps.push(['addRect', args]),
    addNumber: (...args) => primitiveOps.push(['addNumber', args]),
    addSmartPhotoPanel: (...args) => primitiveOps.push(['addSmartPhotoPanel', args]),
    addText: (...args) => primitiveOps.push(['addText', args]),
    genericShowcaseField: (...args) => primitiveOps.push(['genericShowcaseField', args]),
    lightCanvas: (...args) => primitiveOps.push(['lightCanvas', args]),
    footerText: () => 'Fixture footer',
    panelFill: () => 'FFFFFF'
});
assert.deepEqual(sortedKeys(primitives), requiredPageFamilyPrimitiveExports());
assert.deepEqual(primitiveGroupIds(), ['header', 'footer', 'metrics', 'evidence']);
PAGE_FAMILY_PRIMITIVE_GROUPS.forEach(group => {
  assert.ok(group.exports.length > 0, `${group.id} should declare primitive exports`);
  group.exports.forEach(name => assert.equal(typeof primitives[name], 'function', `${name} should be exposed by primitive facade`));
});
P2_PAGE_FAMILY_PRIMITIVE_TARGETS.forEach(name => {
  assert.equal(typeof primitives[name], 'function', `${name} should be covered by P2 primitive targets`);
});
primitives.drawFooter({}, {}, { color:'738297' });
assert.equal(primitiveOps[0][1][1], 'Fixture footer');
assert.equal(primitiveOps[0][1][2].x, 0.82);
assert.equal(primitiveOps[0][1][2].color, '738297');
assert.equal(primitiveOps[0][1][2].y, 7.05);
assert.equal(primitiveOps[0][1][2].fontSize, 7.8);
primitives.drawTextPageNumber({}, 4, { color:'111827' });
primitives.drawNumberPageNumber({}, 5, { color:'2563EB' });
primitives.drawLightCanvasShell({});
primitives.drawRiskBoardFooter({}, {}, { dark:true });
primitives.drawMetricCard({}, { value:'7', label:'Direct' }, { x:0.4, y:1.2, w:1.4, h:0.42 }, { accent:'06B6D4' });
primitives.drawMetricRow({}, [
  { value:'42%', label:'Impact' },
  { value:'3x', label:'Reuse' }
], { x:1, y:2, w:3.2, h:0.5 }, { gap:0.2 });
primitives.drawCaptionStack({}, { title:'Caption proof', body:'Source-bound caption' }, 'Fallback', { x:0.5, y:2.7, w:2.0, h:0.5 }, { accent:'2563EB' });
primitives.drawEvidencePanel({}, { title:'Panel proof', body:'Evidence body' }, { x:3.5, y:2.8, w:2.2, h:0.8 }, { accent:'06B6D4' });
const missingImageResult = primitives.drawImagePanel({}, '', { x:6, y:2.8, w:1.2, h:0.7 }, { placeholder:'NO IMAGE' });
primitives.drawEvidenceBoard({}, [
  { title:'Proof', body:'Source-bound' }
], [
  { x:1, y:3, w:2, h:1 }
], {
  images:['proof.png'],
  imageBoxFor: box => ({ x:box.x + 0.1, y:box.y + 0.1, w:0.8, h:0.6 })
});
assert(primitiveOps.some(op => op[0] === 'addText' && op[1][1] === '04'), 'text page number should be zero-padded');
assert(primitiveOps.some(op => op[0] === 'addNumber' && op[1][1] === '05'), 'number page number should be zero-padded');
assert(primitiveOps.some(op => op[0] === 'lightCanvas'), 'light canvas shell should preserve canvas helper path');
assert(primitiveOps.some(op => op[0] === 'addText' && op[1][2].color === '94A3B8'), 'dark risk footer should use dark muted color');
assert(primitiveOps.some(op => op[0] === 'addNumber' && op[1][1] === '7'), 'metric card should draw direct metric value');
assert.equal(primitiveOps.filter(op => op[0] === 'addNumber' && /42%|3x/.test(op[1][1])).length, 2, 'metric row should draw metric values');
assert(primitiveOps.some(op => op[0] === 'addEvidenceCaptionStack' && op[1][2] === 'Fallback'), 'caption stack should delegate direct caption rendering');
assert(primitiveOps.some(op => op[0] === 'addEvidenceCaptionStack' && op[1][2] === '证据'), 'evidence panel should delegate caption rendering');
assert.equal(missingImageResult, false, 'image panel should report fallback path when no image is bound');
assert(primitiveOps.some(op => op[0] === 'genericShowcaseField' && op[1][5] === 'NO IMAGE'), 'image panel should draw showcase placeholder when image is missing');
assert(primitiveOps.some(op => op[0] === 'addEvidenceCaptionStack' && op[1][2] === '证据'), 'evidence board should delegate captions');
assert(primitiveOps.some(op => op[0] === 'addSmartPhotoPanel' && op[1][1] === 'proof.png'), 'evidence board should draw image panels');

const primitiveHeaderOps = [];
const headerPrimitives = createPageFamilyPrimitives({
  colors: () => ({ accent:'2563EB', darkMuted:'94A3B8', muted:'64748B', text:'111827', white:'FFFFFF' }),
  addNumber: (...args) => primitiveHeaderOps.push(['addNumber', args]),
  addText: (...args) => primitiveHeaderOps.push(['addText', args]),
  lightCanvas: (...args) => primitiveHeaderOps.push(['lightCanvas', args]),
  PageNumber: (...args) => primitiveHeaderOps.push(['PageNumber', args]),
  sectionKicker: (...args) => primitiveHeaderOps.push(['sectionKicker', args]),
  stageCanvas: (...args) => primitiveHeaderOps.push(['stageCanvas', args])
});
headerPrimitives.drawLightPageHeader({}, {
  kicker:'HEADER',
  title:'Title',
  subtitle:'Subtitle',
  idx:3,
  pageNumber:'chrome'
});
headerPrimitives.drawDarkPageHeader({}, {
  kicker:'DARK',
  title:'Dark Title',
  subtitle:'Dark Subtitle',
  idx:6,
  pageNumberMethod:'text'
});
assert(primitiveHeaderOps.some(op => op[0] === 'PageNumber' && op[1][1] === 3));
assert(primitiveHeaderOps.some(op => op[0] === 'stageCanvas'), 'dark page header should preserve stage canvas path');
assert(primitiveHeaderOps.some(op => op[0] === 'addText' && op[1][1] === '06'), 'dark text page number should use text path');
assert(!primitiveHeaderOps.some(op => op[0] === 'addNumber'), 'chrome/text page number checks should avoid number helper path');

console.log('page family splits ok');
