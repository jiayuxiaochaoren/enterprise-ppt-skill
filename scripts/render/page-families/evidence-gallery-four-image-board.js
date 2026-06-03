const {
  createFourImageEvidenceBoardPanels
} = require('./evidence-gallery-four-image-board-panels');

function createFourImageEvidenceBoardRenderer(ctx = {}, deps = {}) {
  const {
    chooseEvidenceImageLayout
  } = ctx;
  const {
    drawFooter
  } = deps;
  const {
    drawGridEvidenceBoard,
    drawMosaicEvidenceBoard,
    drawStackedEvidenceColumns
  } = createFourImageEvidenceBoardPanels(ctx);

  return function renderFourImageEvidenceBoard(slide, plan, s, images = [], items = []) {
    if (images.length !== 4 || items.length > 4) return false;
    const layout = chooseEvidenceImageLayout(images, {
      role:'evidence',
      layout:s.galleryLayout || s.imageLayout,
      featured: !!s.heroImage
    });
    if (layout === 'vertical-strip' || layout === 'screenshot-board') {
      drawStackedEvidenceColumns(slide, s, images, items, layout);
      drawFooter(slide, plan);
      return true;
    }
    if (layout === 'mosaic-1-3') {
      drawMosaicEvidenceBoard(slide, s, images, items);
      drawFooter(slide, plan);
      return true;
    }
    drawGridEvidenceBoard(slide, s, images, items);
    drawFooter(slide, plan);
    return true;
  };
}

module.exports = {
  createFourImageEvidenceBoardRenderer
};
