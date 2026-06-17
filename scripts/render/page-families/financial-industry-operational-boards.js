const {
  createDispatchMapBoardRenderer
} = require('./financial-industry-dispatch-map-board');
const {
  createIndustryRankingBoardRenderer
} = require('./financial-industry-ranking-board');
const {
  createQualityHandoffBoardRenderer
} = require('./financial-industry-quality-handoff-board');

function createFinancialIndustryOperationalBoards(ctx = {}) {
  const { renderDispatchMapBoard } = createDispatchMapBoardRenderer(ctx);
  const { renderRankingBoard } = createIndustryRankingBoardRenderer(ctx);
  const { renderQualityHandoffBoard } = createQualityHandoffBoardRenderer(ctx);

  return {
    renderDispatchMapBoard,
    renderRankingBoard,
    renderQualityHandoffBoard
  };
}

module.exports = {
  createFinancialIndustryOperationalBoards
};
