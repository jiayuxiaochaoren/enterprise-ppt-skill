const {
  createGridEvidenceBoard
} = require('./evidence-gallery-grid-evidence-board');
const {
  createMosaicEvidenceBoard
} = require('./evidence-gallery-mosaic-board');
const {
  createStackedEvidenceColumns
} = require('./evidence-gallery-stacked-columns');

function createFourImageEvidenceBoardPanels(ctx = {}) {
  const { drawGridEvidenceBoard } = createGridEvidenceBoard(ctx);
  const { drawMosaicEvidenceBoard } = createMosaicEvidenceBoard(ctx);
  const { drawStackedEvidenceColumns } = createStackedEvidenceColumns(ctx);
  return {
    drawGridEvidenceBoard,
    drawMosaicEvidenceBoard,
    drawStackedEvidenceColumns
  };
}

module.exports = {
  createFourImageEvidenceBoardPanels
};
