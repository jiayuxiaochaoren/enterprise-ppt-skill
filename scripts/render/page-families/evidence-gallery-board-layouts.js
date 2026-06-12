const {
  createFourImageEvidenceBoardRenderer
} = require('./evidence-gallery-four-image-board');
const {
  createGridEvidenceBoardRenderer
} = require('./evidence-gallery-grid-board');

function createCaseEvidenceBoardContentRenderer(ctx = {}, deps = {}) {
  const renderFourImageEvidenceBoard = createFourImageEvidenceBoardRenderer(ctx, deps);
  const renderGridEvidenceBoard = createGridEvidenceBoardRenderer(ctx, deps);
  return function renderCaseEvidenceBoardContent(slide, plan, s, images = [], items = []) {
    if (renderFourImageEvidenceBoard(slide, plan, s, images, items)) return;
    renderGridEvidenceBoard(slide, plan, s, images, items);
  };
}

module.exports = {
  createCaseEvidenceBoardContentRenderer
};
