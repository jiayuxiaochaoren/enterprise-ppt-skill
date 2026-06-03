const {
  createHealthcareServiceScorecard
} = require('./financial-scorecard-healthcare-service');
const {
  createSaasAdoptionRevenueBoard
} = require('./financial-scorecard-saas-adoption');

function createFinancialScorecardServiceBoards(ctx = {}, deps = {}) {
  return {
    healthcareServiceScorecard: createHealthcareServiceScorecard(ctx, deps),
    saasAdoptionRevenueBoard: createSaasAdoptionRevenueBoard(ctx, deps)
  };
}

module.exports = {
  createFinancialScorecardServiceBoards
};
