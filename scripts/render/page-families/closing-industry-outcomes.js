const {
  createClosingFinanceInvestmentDecisionRenderer
} = require('./closing-finance-investment-decision');
const {
  createClosingHealthcareQualityHandoffRenderer
} = require('./closing-healthcare-quality-handoff');
const {
  createClosingSaasAdoptionCloseRenderer
} = require('./closing-saas-adoption-close');

function createClosingIndustryOutcomeRenderers(ctx = {}, helpers = {}) {
  const closingFinanceInvestmentDecision = createClosingFinanceInvestmentDecisionRenderer(ctx, helpers);
  const closingHealthcareQualityHandoff = createClosingHealthcareQualityHandoffRenderer(ctx, helpers);
  const closingSaasAdoptionClose = createClosingSaasAdoptionCloseRenderer(ctx, helpers);

  return {
    closingFinanceInvestmentDecision,
    closingHealthcareQualityHandoff,
    closingSaasAdoptionClose
  };
}

module.exports = {
  createClosingIndustryOutcomeRenderers
};
