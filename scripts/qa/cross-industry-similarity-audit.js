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

function bodyRhythm(deck = {}) {
  const slides = Array.isArray(deck.normalizedPlan && deck.normalizedPlan.slides)
    ? deck.normalizedPlan.slides
    : [];
  const bodySlides = slides.filter(slide => !STRUCTURAL_TYPES.has(String(slide.type || '')));
  const routeFamilies = bodySlides.map(routeIdForSlide).filter(Boolean);
  const compositions = bodySlides.map(slide => String((slide.compositionPlan || {}).composition || '')).filter(Boolean);
  const uniqueRouteFamilies = [...new Set(routeFamilies)];
  const uniqueCompositions = [...new Set(compositions)];
  const maxRouteFamilyRun = longestRun(routeFamilies);
  const maxCompositionRun = longestRun(compositions);
  const findings = [];
  if (maxRouteFamilyRun > 2) {
    findings.push({
      level: 'review',
      type: 'bodyRouteRunTooLong',
      message: `${deck.slug || deck.label || deck.industry || 'deck'} has ${maxRouteFamilyRun} consecutive body slides in the same route family`
    });
  }
  if (maxCompositionRun > 2) {
    findings.push({
      level: 'review',
      type: 'bodyCompositionRunTooLong',
      message: `${deck.slug || deck.label || deck.industry || 'deck'} has ${maxCompositionRun} consecutive body slides with the same composition`
    });
  }
  return {
    bodySlideCount: bodySlides.length,
    uniqueRouteFamilyCount: uniqueRouteFamilies.length,
    uniqueCompositionCount: uniqueCompositions.length,
    maxRouteFamilyRun,
    maxCompositionRun,
    routeFamilies,
    compositions,
    findings
  };
}

function auditCrossIndustrySimilarity(decks = [], options = {}) {
  const normalizedDecks = (decks || []).map(deck => {
    const slides = Array.isArray(deck.normalizedPlan && deck.normalizedPlan.slides)
      ? deck.normalizedPlan.slides
      : [];
    const coverIndex = slides.findIndex(slide => String(slide.type || '') === 'cover');
    const closingIndex = [...slides].reverse().findIndex(slide => String(slide.type || '') === 'closing');
    const closingResolvedIndex = closingIndex >= 0 ? slides.length - 1 - closingIndex : -1;
    const cover = coverIndex >= 0 ? slideSurfaceDescriptor(slides[coverIndex], coverIndex + 1, deck.previewDir) : null;
    const closing = closingResolvedIndex >= 0 ? slideSurfaceDescriptor(slides[closingResolvedIndex], closingResolvedIndex + 1, deck.previewDir) : null;
    const withinDeck = cover && closing
      ? pairStatus(cover, closing, { kind: 'cover-closing', withinDeck: true, maxHash: options.maxHash })
      : {
          kind: 'cover-closing',
          status: 'review',
          reasons: ['missingCoverOrClosing'],
          previewRisk: { similar: false, dist: null },
          metadata: {}
        };
    return Object.assign({}, deck, {
      cover,
      closing,
      withinDeck,
      bodyRhythm: bodyRhythm(deck)
    });
  });

  const findings = [];
  const coverPairs = [];
  const closingPairs = [];

  normalizedDecks.forEach(deck => {
    if (deck.withinDeck.status !== 'pass') {
      findings.push({
        level: deck.withinDeck.status === 'fail' ? 'fail' : 'review',
        type: 'coverClosingDiversity',
        deck: deck.slug,
        message: `${deck.slug} cover and closing are too close`,
        detail: deck.withinDeck
      });
    }
    (deck.bodyRhythm.findings || []).forEach(finding => findings.push(Object.assign({ deck: deck.slug }, finding)));
  });

  for (let i = 0; i < normalizedDecks.length; i++) {
    for (let j = i + 1; j < normalizedDecks.length; j++) {
      const left = normalizedDecks[i];
      const right = normalizedDecks[j];
      if (left.cover && right.cover) {
        const pair = {
          left: left.slug,
          right: right.slug,
          leftIndustry: left.industry,
          rightIndustry: right.industry,
          comparison: pairStatus(left.cover, right.cover, { kind: 'cover', maxHash: options.maxHash }),
          leftSurface: {
            slide: left.cover.slide,
            preview: left.cover.preview,
            renderFamilySelected: left.cover.renderFamilySelected,
            surfaceArchetype: left.cover.surfaceArchetype
          },
          rightSurface: {
            slide: right.cover.slide,
            preview: right.cover.preview,
            renderFamilySelected: right.cover.renderFamilySelected,
            surfaceArchetype: right.cover.surfaceArchetype
          }
        };
        coverPairs.push(pair);
        if (pair.comparison.status !== 'pass') {
          findings.push({
            level: pair.comparison.status === 'fail' ? 'fail' : 'review',
            type: 'crossIndustryCoverSimilarity',
            decks: [left.slug, right.slug],
            message: `${left.slug} and ${right.slug} covers are too similar`,
            detail: pair
          });
        }
      }
      if (left.closing && right.closing) {
        const pair = {
          left: left.slug,
          right: right.slug,
          leftIndustry: left.industry,
          rightIndustry: right.industry,
          comparison: pairStatus(left.closing, right.closing, { kind: 'closing', maxHash: options.maxHash }),
          leftSurface: {
            slide: left.closing.slide,
            preview: left.closing.preview,
            renderFamilySelected: left.closing.renderFamilySelected,
            surfaceArchetype: left.closing.surfaceArchetype
          },
          rightSurface: {
            slide: right.closing.slide,
            preview: right.closing.preview,
            renderFamilySelected: right.closing.renderFamilySelected,
            surfaceArchetype: right.closing.surfaceArchetype
          }
        };
        closingPairs.push(pair);
        if (pair.comparison.status !== 'pass') {
          findings.push({
            level: pair.comparison.status === 'fail' ? 'fail' : 'review',
            type: 'crossIndustryClosingSimilarity',
            decks: [left.slug, right.slug],
            message: `${left.slug} and ${right.slug} closings are too similar`,
            detail: pair
          });
        }
      }
    }
  }

  const failCount = findings.filter(finding => finding.level === 'fail').length;
  const reviewCount = findings.filter(finding => finding.level === 'review').length;

  return {
    version: 'cross-industry-similarity-audit/v1',
    status: failCount ? 'fail' : (reviewCount ? 'review' : 'pass'),
    failCount,
    reviewCount,
    summary: {
      deckCount: normalizedDecks.length,
      coverPairCount: coverPairs.length,
      closingPairCount: closingPairs.length
    },
    decks: normalizedDecks.map(deck => ({
      slug: deck.slug,
      label: deck.label,
      industry: deck.industry,
      cover: deck.cover,
      closing: deck.closing,
      withinDeck: deck.withinDeck,
      bodyRhythm: deck.bodyRhythm,
      formalValidation: deck.formalValidation || null
    })),
    coverPairs,
    closingPairs,
    findings
  };
}

module.exports = {
  auditCrossIndustrySimilarity,
  bodyRhythm,
  pairStatus,
  slideSurfaceDescriptor
};
