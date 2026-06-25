const fs = require('fs');
const path = require('path');
const {
  pngAnalysis,
  previewSimilarityRisk
} = require('./png-analysis');
const {
  slideNumberFromPreviewFile
} = require('./visual-preview-audit');

const STRUCTURAL_TYPES = new Set(['cover', 'closing', 'toc', 'toc-clean', 'chapter-divider']);

function previewFiles(previewDir = '') {
  if (!previewDir || !fs.existsSync(previewDir)) return [];
  return fs.readdirSync(previewDir)
    .filter(name => /\.png$/i.test(name))
    .sort()
    .map(name => path.join(previewDir, name));
}

function findPreviewForSlide(previewDir = '', slideNumber = 1) {
  const files = previewFiles(previewDir);
  if (!files.length) return '';
  const exact = files.find(file => slideNumberFromPreviewFile(file, 0) === slideNumber);
  return exact || files[slideNumber - 1] || files[0] || '';
}

function routeIdForSlide(slide = {}) {
  return String(
    slide.renderFamilySelected ||
    slide.render_family_selected ||
    (slide.layoutVariant || slide.variant ? `${slide.type || ''}:${slide.layoutVariant || slide.variant}` : slide.type || '')
  );
}

function longestRun(values = []) {
  let best = 0;
  let current = 0;
  let previous = null;
  (values || []).forEach(value => {
    if (!value) {
      previous = null;
      current = 0;
      return;
    }
    if (value === previous) current += 1;
    else current = 1;
    previous = value;
    if (current > best) best = current;
  });
  return best;
}

function slideSurfaceDescriptor(slide = {}, slideNumber = 1, previewDir = '') {
  const compositionPlan = slide.compositionPlan || {};
  const expression = compositionPlan.industryExpression || {};
  const preview = findPreviewForSlide(previewDir, slideNumber);
  return {
    slide: slideNumber,
    type: String(slide.type || ''),
    preview,
    previewInfo: preview ? pngAnalysis(preview) : null,
    layoutVariant: String(slide.layoutVariant || slide.variant || ''),
    renderFamilySelected: routeIdForSlide(slide),
    composition: String(compositionPlan.composition || ''),
    backgroundTone: String(compositionPlan.backgroundTone || ''),
    themeIntent: String(compositionPlan.themeIntent || slide.themeIntent || ''),
    accentRole: String(compositionPlan.accentRole || slide.accentRole || ''),
    coverStyle: String(slide.coverStyle || compositionPlan.coverStyle || ''),
    textureBackgroundPolicy: String(
      slide.textureBackgroundPolicy ||
      slide.texture_background_policy ||
      expression.textureBackgroundPolicy ||
      ''
    ),
    surfaceArchetype: String(
      slide.type === 'cover'
        ? (slide.coverArchetype || slide.cover_archetype || expression.coverArchetype || '')
        : (slide.closingArchetype || slide.closing_archetype || expression.closingArchetype || '')
    ),
    paletteTokenSet: expression.paletteTokenSet || null
  };
}

function sameMetadataSignals(left = {}, right = {}) {
  return {
    sameComposition: Boolean(left.composition && left.composition === right.composition),
    sameTone: Boolean(left.backgroundTone && left.backgroundTone === right.backgroundTone),
    sameIntent: Boolean(left.themeIntent && left.themeIntent === right.themeIntent),
    sameAccent: Boolean(left.accentRole && left.accentRole === right.accentRole),
    sameCoverStyle: Boolean(left.coverStyle && left.coverStyle === right.coverStyle),
    sameTexture: Boolean(left.textureBackgroundPolicy && left.textureBackgroundPolicy === right.textureBackgroundPolicy),
    sameArchetype: Boolean(left.surfaceArchetype && left.surfaceArchetype === right.surfaceArchetype),
    sameLayoutVariant: Boolean(left.layoutVariant && left.layoutVariant === right.layoutVariant),
    sameRenderFamily: Boolean(left.renderFamilySelected && left.renderFamilySelected === right.renderFamilySelected)
  };
}

function pairStatus(left = {}, right = {}, options = {}) {
  const kind = String(options.kind || 'cover');
  const withinDeck = options.withinDeck === true;
  const maxHash = options.maxHash == null ? 6 : Number(options.maxHash);
  const previewRisk = left.previewInfo && right.previewInfo
    ? previewSimilarityRisk(left.previewInfo, right.previewInfo, { maxHash })
    : { similar: false, dist: null };
  const metadata = sameMetadataSignals(left, right);
  const reasons = [];
  if (!left.preview || !right.preview) reasons.push('previewMissing');
  if (previewRisk.similar) reasons.push('previewSimilarity');
  if (metadata.sameComposition && metadata.sameTone && metadata.sameIntent) reasons.push('sameSkeletonSignals');
  if (metadata.sameArchetype) reasons.push('sameSurfaceArchetype');
  if (metadata.sameCoverStyle) reasons.push('sameCoverStyle');
  if (metadata.sameTexture) reasons.push('sameTextureBackground');

  let status = 'pass';
  if (withinDeck) {
    if (previewRisk.similar) status = 'fail';
    else if (
      (metadata.sameComposition && metadata.sameTone && metadata.sameIntent) ||
      metadata.sameArchetype ||
      metadata.sameCoverStyle
    ) status = 'review';
  } else if (
    previewRisk.similar &&
    (
      (metadata.sameComposition && metadata.sameTone && (metadata.sameIntent || metadata.sameAccent)) ||
      metadata.sameArchetype ||
      metadata.sameCoverStyle
    )
  ) {
    status = 'fail';
  } else if (
    previewRisk.similar ||
    (metadata.sameComposition && metadata.sameTone && metadata.sameIntent)
  ) {
    status = 'review';
  }

  return {
    kind,
    status,
    reasons,
    previewRisk,
    metadata
  };
}

module.exports = {
  STRUCTURAL_TYPES,
  longestRun,
  pairStatus,
  routeIdForSlide,
  slideSurfaceDescriptor
};
