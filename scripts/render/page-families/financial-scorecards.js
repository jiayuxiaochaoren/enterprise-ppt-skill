const {
  assertRendererContext
} = require('../renderer-context');
const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createFinancialScorecardPrimitives
} = require('./financial-scorecard-primitives');
const {
  createManufacturingOeeBoard
} = require('./financial-scorecard-manufacturing');
const {
  createRetailMemberGrowthBoard
} = require('./financial-scorecard-retail');
const {
  createFinancialScorecardServiceBoards
} = require('./financial-scorecard-service-boards');

function createFinancialScorecardRenderers(ctx = {}) {
  assertRendererContext(ctx, ['financialScorecard'], { label:'financial scorecard renderer context' });
  const { drawFooter } = createPageFamilyPrimitives(ctx);
  const { drawScorecardHeader } = createFinancialScorecardPrimitives(ctx);
  const {
    healthcareServiceScorecard,
    saasAdoptionRevenueBoard
  } = createFinancialScorecardServiceBoards(ctx, {
    drawFooter,
    drawScorecardHeader
  });
  const manufacturingOeeBoard = createManufacturingOeeBoard(ctx, {
    drawFooter,
    drawScorecardHeader
  });
  const retailMemberGrowthBoard = createRetailMemberGrowthBoard(ctx, {
    drawFooter,
    drawScorecardHeader
  });

  return {
    healthcareServiceScorecard,
    manufacturingOeeBoard,
    retailMemberGrowthBoard,
    saasAdoptionRevenueBoard
  };
}

module.exports = {
  createFinancialScorecardRenderers
};
