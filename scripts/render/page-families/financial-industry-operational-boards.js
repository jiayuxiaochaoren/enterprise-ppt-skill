const {
  createDispatchMapBoardRenderer
} = require('./financial-industry-dispatch-map-board');
const {
  createDowntimeParetoBoardRenderer
} = require('./financial-industry-downtime-pareto-board');
const {
  createQualityHandoffBoardRenderer
} = require('./financial-industry-quality-handoff-board');

function createFinancialIndustryOperationalBoards(ctx = {}) {
  const { renderDispatchMapBoard } = createDispatchMapBoardRenderer(ctx);
  const { renderDowntimeParetoBoard } = createDowntimeParetoBoardRenderer(ctx);
  const { renderQualityHandoffBoard } = createQualityHandoffBoardRenderer(ctx);

  return {
    renderDispatchMapBoard,
    renderDowntimeParetoBoard,
    renderQualityHandoffBoard
  };
}

module.exports = {
  createFinancialIndustryOperationalBoards
};
