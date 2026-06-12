const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createCaseEvidenceBoardContentRenderer
} = require('./evidence-gallery-board-layouts');

function createCaseEvidenceBoardRenderer(ctx = {}) {
  const {
    galleryImages,
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = createPageFamilyPrimitives(ctx);
  const renderCaseEvidenceBoardContent = createCaseEvidenceBoardContentRenderer(ctx, {
    drawFooter
  });

  return function caseEvidenceBoard(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'EVIDENCE BOARD',
      title:s.title || '案例证据板',
      titleSize:23.5,
      subtitle:s.subtitle || s.intro,
      subtitleW:6.0,
      subtitleSize:9.2,
      idx
    });
    const images = galleryImages(plan, s);
    const items = s.items || s.cards || [];
    renderCaseEvidenceBoardContent(slide, plan, s, images, items);
  };
}

module.exports = {
  createCaseEvidenceBoardRenderer
};
