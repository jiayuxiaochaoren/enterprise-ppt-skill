const {
  STRUCTURAL_TYPES,
  longestRun,
  pairStatus,
  routeIdForSlide,
  slideSurfaceDescriptor
} = require('./cross-industry-similarity-utils');

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
