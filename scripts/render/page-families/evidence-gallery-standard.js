const {
  createCaseEvidenceBoardRenderer
} = require('./evidence-gallery-board');
const {
  createCaseComparisonSlide
} = require('./evidence-gallery-comparison');
const {
  createEnergySiteComparisonSlide
} = require('./evidence-gallery-energy-site');
const {
  createCaseEvidenceHero
} = require('./evidence-gallery-hero');
const {
  createCaseGalleryRenderer
} = require('./evidence-gallery-case-gallery');
const {
  createPageFamilyPrimitives
} = require('./primitives');

function createEvidenceGalleryStandardRenderers(ctx = {}, externalRenderers = {}) {
  const {
    drawDarkPageHeader,
    drawDarkStageShell,
    drawFooter,
    drawLightPageHeader,
    drawMetricRow
  } = createPageFamilyPrimitives(ctx);
  const caseEvidenceBoard = createCaseEvidenceBoardRenderer(ctx);
  const caseEvidenceHero = createCaseEvidenceHero(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const caseComparisonSlide = createCaseComparisonSlide(ctx, {
    drawFooter,
    drawLightPageHeader,
    drawMetricRow
  });
  const energySiteComparisonSlide = createEnergySiteComparisonSlide(ctx, {
    drawDarkPageHeader,
    drawDarkStageShell,
    drawFooter
  });
  const caseGallery = createCaseGalleryRenderer(ctx, {
    drawFooter,
    drawLightPageHeader,
    variantRenderers:Object.assign({}, externalRenderers, {
      caseComparisonSlide,
      caseEvidenceBoard,
      caseEvidenceHero,
      energySiteComparisonSlide
    })
  });

  return {
    caseGallery,
    caseComparisonSlide,
    caseEvidenceBoard,
    caseEvidenceHero,
    energySiteComparisonSlide
  };
}

module.exports = {
  createEvidenceGalleryStandardRenderers
};
