const {
  createEnergySiteEvidenceGallery
} = require('./evidence-industry-energy-site');
const {
  createEvidenceIndustryFlowGalleries
} = require('./evidence-industry-flow-galleries');
const {
  createFinancePortfolioEvidenceGalleryRenderer
} = require('./evidence-industry-finance-portfolio');
const {
  createPageFamilyPrimitives
} = require('./primitives');

function createEvidenceIndustryRenderers(ctx = {}) {
  const {
    drawLightPageHeader
  } = createPageFamilyPrimitives(ctx);

  function drawEvidenceHeader(slide, s, idx, opts = {}) {
    return drawLightPageHeader(slide, {
      kicker:opts.kicker,
      title:s.title || opts.title,
      titleW:5.9,
      titleH:0.35,
      titleSize:23.5,
      subtitle:s.subtitle || s.intro || s.claim || opts.subtitle,
      subtitleW:opts.subtitleW,
      subtitleSize:9.4,
      idx
    });
  }
  const {
    healthcareTouchpointEvidenceGallery,
    saasPrototypeFlowGallery
  } = createEvidenceIndustryFlowGalleries(ctx, {
    drawEvidenceHeader
  });
  const energySiteEvidenceGallery = createEnergySiteEvidenceGallery(ctx, {
    drawEvidenceHeader
  });
  const financePortfolioEvidenceGallery = createFinancePortfolioEvidenceGalleryRenderer(ctx, {
    drawEvidenceHeader
  });

  return {
    energySiteEvidenceGallery,
    financePortfolioEvidenceGallery,
    healthcareTouchpointEvidenceGallery,
    saasPrototypeFlowGallery
  };
}

module.exports = {
  createEvidenceIndustryRenderers
};
