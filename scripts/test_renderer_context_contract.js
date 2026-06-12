const assert = require('assert/strict');
const {
  RENDERER_COLOR_CONTRACT,
  RENDERER_CONTEXT_CONTRACT,
  createAuditedRendererContext,
  familyRendererContextGroups,
  flattenRendererContextContract,
  missingRendererContextKeys
} = require('./render/renderer-context');
const {
  BASE_RENDERER_CONTEXT_CONTRACT
} = require('./render/context/base-contracts');
const {
  RENDERER_FAMILY_CONTEXT_CONTRACT
} = require('./render/context/family-contracts');
const {
  RENDERER_FOUNDATION_FAMILY_CONTEXT_CONTRACT
} = require('./render/context/family-foundation-contracts');
const {
  RENDERER_COMMERCIAL_FAMILY_CONTEXT_CONTRACT
} = require('./render/context/family-commercial-contracts');
const {
  RENDERER_EXTENDED_FAMILY_CONTEXT_CONTRACT
} = require('./render/context/family-extended-contracts');
const {
  RENDERER_COLOR_CONTRACT: DIRECT_RENDERER_COLOR_CONTRACT
} = require('./render/context/color-contracts');

function createFixtureContext() {
  const colors = {
    accent:'2563EB',
    body:'1F2937',
    captionOnImage:'FFFFFF',
    cyan:'06B6D4',
    darkMuted:'94A3B8',
    ink:'0F172A',
    ink2:'111827',
    line:'CBD5E1',
    muted:'64748B',
    panelAlt:'F1F5F9',
    risk:'EF4444',
    softBlue:'EFF6FF',
    text:'111827',
    violet:'7C3AED',
    white:'FFFFFF'
  };
  const fallbackFn = () => {};
  return new Proxy({
    colors: () => colors,
    canvasHeight: () => 7.5,
    canvasWidth: () => 13.333,
    panelFill: () => 'FFFFFF',
    presentationSpec: () => ({}),
    surfaceFill: () => 'F8FAFC'
  }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return fallbackFn;
    }
  });
}

const ctx = createFixtureContext();
assert.deepEqual(
  RENDERER_CONTEXT_CONTRACT,
  Object.assign({}, BASE_RENDERER_CONTEXT_CONTRACT, RENDERER_FAMILY_CONTEXT_CONTRACT)
);
assert.deepEqual(RENDERER_COLOR_CONTRACT, DIRECT_RENDERER_COLOR_CONTRACT);
assert.ok(RENDERER_FOUNDATION_FAMILY_CONTEXT_CONTRACT.business.includes('reportBoardNeedsRightOverlayRail'));
assert.ok(RENDERER_COMMERCIAL_FAMILY_CONTEXT_CONTRACT.closing.includes('addVisualPhotoBackdrop'));
assert.ok(RENDERER_EXTENDED_FAMILY_CONTEXT_CONTRACT.evidenceGallery.includes('brandWorldBusinessProof'));
assert.deepEqual(missingRendererContextKeys(ctx, Object.keys(RENDERER_CONTEXT_CONTRACT)), []);
assert.ok(familyRendererContextGroups().includes('closing'));

const audit = createAuditedRendererContext(ctx);
audit.context.addText();
audit.context.panelFill();
assert.deepEqual(audit.accessedKeys(), ['addText', 'panelFill']);
audit.reset();
assert.deepEqual(audit.accessedKeys(), []);

const familyKeys = flattenRendererContextContract(['closing', 'risk', 'evidenceGallery']);
assert.ok(familyKeys.includes('addText'));
assert.ok(familyKeys.includes('galleryImages'));
assert.ok(familyKeys.includes('ContactBlock'));

console.log('renderer context contract ok');
