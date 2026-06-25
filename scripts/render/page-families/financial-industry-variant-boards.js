const {
  createFinancialIndustryGenericBoards
} = require('./financial-industry-generic-boards');
const {
  createFinancialIndustryOperationalBoards
} = require('./financial-industry-operational-boards');

function createFinancialIndustryVariantBoardRenderer(ctx = {}) {
  const {
    renderAdoptionOrPatientFunnelBoard,
    renderDefaultIndustryReadoutBoard,
    renderMemberCohortLadderBoard,
    renderValuationSensitivityBoard
  } = createFinancialIndustryGenericBoards(ctx);
  const {
    renderDispatchMapBoard,
    renderRankingBoard,
    renderQualityHandoffBoard
  } = createFinancialIndustryOperationalBoards(ctx);

  return function renderFinancialIndustryVariantBoard(slide, s, variant, board) {
    if (['loss-pareto', 'issue-frequency-ranking', 'review-sentiment-ranking'].includes(variant)) {
      return renderRankingBoard(slide, s, board);
    }
    if (variant === 'valuation-sensitivity') {
      renderValuationSensitivityBoard(slide, s, board);
      return true;
    }
    if (variant === 'quality-handoff') {
      return renderQualityHandoffBoard(slide, s, board);
    }
    if (variant === 'member-cohort-ladder') {
      renderMemberCohortLadderBoard(slide, s, board);
      return true;
    }
    if (variant === 'dispatch-map') {
      return renderDispatchMapBoard(slide, s, board);
    }
    if (variant === 'adoption-funnel' || variant === 'patient-bottleneck') {
      renderAdoptionOrPatientFunnelBoard(slide, s, variant, board);
      return true;
    }
    renderDefaultIndustryReadoutBoard(slide, s, board);
    return true;
  };
}

module.exports = {
  createFinancialIndustryVariantBoardRenderer
};
