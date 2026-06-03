const {
  assertRendererContext
} = require('../renderer-context');
const {
  createMaterialityMatrixBoard
} = require('./risk-board-materiality-layout');
const {
  createGuidanceAndRiskBoardRenderer
} = require('./risk-board-guidance-layout');
const {
  createGovernanceTableEditorialRenderer
} = require('./risk-board-governance-table');

function createRiskBoardGovernanceLayoutRenderers(ctx = {}, helpers = {}) {
  assertRendererContext(ctx, ['risk'], { label:'risk board governance renderer context' });
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const materialityMatrixBoard = createMaterialityMatrixBoard(ctx, {
    drawRiskBoardFooter,
    drawRiskLightHeader
  });
  const guidanceAndRiskBoard = createGuidanceAndRiskBoardRenderer(ctx, {
    drawRiskBoardFooter,
    drawRiskLightHeader
  });
  const governanceTableEditorial = createGovernanceTableEditorialRenderer(ctx, {
    drawRiskBoardFooter,
    drawRiskLightHeader
  });

  return {
    governanceTableEditorial,
    guidanceAndRiskBoard,
    materialityMatrixBoard
  };
}

module.exports = {
  createRiskBoardGovernanceLayoutRenderers
};
