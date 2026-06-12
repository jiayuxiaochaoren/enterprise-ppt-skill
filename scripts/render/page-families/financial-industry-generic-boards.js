const {
  createAdoptionOrPatientFunnelBoard
} = require('./financial-industry-funnel-board');
const {
  createDefaultIndustryReadoutBoard
} = require('./financial-industry-default-readout');
const {
  createMemberCohortLadderBoard
} = require('./financial-industry-cohort-board');
const {
  createValuationSensitivityBoard
} = require('./financial-industry-valuation-board');

function createFinancialIndustryGenericBoards(ctx = {}) {
  const { renderAdoptionOrPatientFunnelBoard } = createAdoptionOrPatientFunnelBoard(ctx);
  const { renderDefaultIndustryReadoutBoard } = createDefaultIndustryReadoutBoard(ctx);
  const { renderMemberCohortLadderBoard } = createMemberCohortLadderBoard(ctx);
  const { renderValuationSensitivityBoard } = createValuationSensitivityBoard(ctx);

  return {
    renderAdoptionOrPatientFunnelBoard,
    renderDefaultIndustryReadoutBoard,
    renderMemberCohortLadderBoard,
    renderValuationSensitivityBoard
  };
}

module.exports = {
  createFinancialIndustryGenericBoards
};
