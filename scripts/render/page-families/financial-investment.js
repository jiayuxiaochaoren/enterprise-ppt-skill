const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createFinanceBridgeSlide
} = require('./financial-investment-bridge');
const {
  createPortfolioTableSlide
} = require('./financial-investment-portfolio-table');

function createFinancialInvestmentRenderers(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const deps = { drawFooter, drawLightPageHeader };
  const financeBridgeSlide = createFinanceBridgeSlide(ctx, deps);
  const portfolioTableSlide = createPortfolioTableSlide(ctx, deps);

  return {
    financeBridgeSlide,
    portfolioTableSlide
  };
}

module.exports = {
  createFinancialInvestmentRenderers
};
