const SPLIT_FULL_HEIGHT = Object.freeze({
  role: 'split',
  slot: { w: 4.25, h: 7.5 },
  fitPolicy: 'cover'
});

const WIDE_BACKGROUND = Object.freeze({
  role: 'background',
  slot: { w: 13.333, h: 7.5 },
  fitPolicy: 'cover'
});

const SHOWCASE_PANEL = Object.freeze({
  role: 'showcase',
  slot: { w: 5.38, h: 3.4 },
  fitPolicy: 'cover'
});

const EVIDENCE_FRAME = Object.freeze({
  role: 'evidence',
  slot: { w: 4.36, h: 2.4 },
  fitPolicy: 'cover'
});

const GALLERY_TILE = Object.freeze({
  role: 'gallery',
  slot: { w: 4.34, h: 2.68 },
  fitPolicy: 'cover'
});

const PANORAMIC_EVIDENCE_TILE = Object.freeze({
  role: 'gallery',
  slot: { w: 3.36, h: 1.04 },
  fitPolicy: 'cover'
});

const PROFILE_EVIDENCE_BAND = Object.freeze({
  role: 'evidence',
  slot: { w: 3.36, h: 1.28 },
  fitPolicy: 'cover'
});

const IMAGE_SLOT_TARGETS_BY_TYPE = Object.freeze({
  'company-profile-spread': Object.assign({}, PROFILE_EVIDENCE_BAND, { targetSource: 'renderer-slot:company-profile-spread-evidence-band' }),
  'executive-blocks': Object.assign({}, SPLIT_FULL_HEIGHT, { targetSource: 'renderer-slot:executive-blocks' }),
  'quote-proof': Object.assign({}, SPLIT_FULL_HEIGHT, { targetSource: 'renderer-slot:quote-proof' }),
  manifesto: Object.assign({}, SPLIT_FULL_HEIGHT, { targetSource: 'renderer-slot:manifesto' }),
  cover: Object.assign({}, WIDE_BACKGROUND, { targetSource: 'renderer-slot:cover' }),
  'cover-dark': Object.assign({}, WIDE_BACKGROUND, { targetSource: 'renderer-slot:cover-dark' }),
  'product-showcase': Object.assign({}, SHOWCASE_PANEL, { targetSource: 'renderer-slot:product-showcase' }),
  'two-column-clean': Object.assign({}, EVIDENCE_FRAME, { targetSource: 'renderer-slot:two-column-clean' }),
  'case-gallery': Object.assign({}, GALLERY_TILE, { targetSource: 'renderer-slot:case-gallery' }),
  gallery: Object.assign({}, GALLERY_TILE, { targetSource: 'renderer-slot:gallery' })
});

const IMAGE_SLOT_TARGETS_BY_VARIANT = Object.freeze({
  'split-full-height': Object.assign({}, SPLIT_FULL_HEIGHT, { targetSource: 'renderer-slot:split-full-height' }),
  'side-panel': Object.assign({}, SPLIT_FULL_HEIGHT, { targetSource: 'renderer-slot:side-panel' }),
  'hero-panel': Object.assign({}, SHOWCASE_PANEL, { targetSource: 'renderer-slot:hero-panel' }),
  'evidence-frame': Object.assign({}, EVIDENCE_FRAME, { targetSource: 'renderer-slot:evidence-frame' }),
  'evidence-board': Object.assign({}, PANORAMIC_EVIDENCE_TILE, { targetSource: 'renderer-slot:evidence-board-panoramic-tile' }),
  'consumer-proof-photo-grid': Object.assign({}, GALLERY_TILE, { targetSource: 'renderer-slot:consumer-proof-photo-grid' }),
  'case-gallery': Object.assign({}, GALLERY_TILE, { targetSource: 'renderer-slot:case-gallery' })
});

function lower(value = '') {
  return String(value || '').trim().toLowerCase();
}

function cloneTarget(target) {
  return target ? {
    role: target.role,
    slot: Object.assign({}, target.slot),
    fitPolicy: target.fitPolicy,
    targetSource: target.targetSource
  } : null;
}

function imageSlotTargetForSlide(slide = {}) {
  const type = lower(slide.type);
  const variant = lower(slide.layoutVariant || slide.variant || slide.proofObject || slide.proof_object);
  if (IMAGE_SLOT_TARGETS_BY_VARIANT[variant]) return cloneTarget(IMAGE_SLOT_TARGETS_BY_VARIANT[variant]);
  if (IMAGE_SLOT_TARGETS_BY_TYPE[type]) return cloneTarget(IMAGE_SLOT_TARGETS_BY_TYPE[type]);

  const slotKind = lower(
    slide.imageSlotKind ||
    slide.imageSlot ||
    slide.rendererImageSlot ||
    (slide.visual && (slide.visual.slotKind || slide.visual.rendererSlot))
  );
  if (IMAGE_SLOT_TARGETS_BY_VARIANT[slotKind]) return cloneTarget(IMAGE_SLOT_TARGETS_BY_VARIANT[slotKind]);

  return null;
}

module.exports = {
  EVIDENCE_FRAME,
  GALLERY_TILE,
  IMAGE_SLOT_TARGETS_BY_TYPE,
  IMAGE_SLOT_TARGETS_BY_VARIANT,
  PANORAMIC_EVIDENCE_TILE,
  PROFILE_EVIDENCE_BAND,
  SHOWCASE_PANEL,
  SPLIT_FULL_HEIGHT,
  WIDE_BACKGROUND,
  imageSlotTargetForSlide
};
