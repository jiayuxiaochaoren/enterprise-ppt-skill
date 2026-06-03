const {
  createFinancialIndustryChartSlideRenderer
} = require('./financial-industry-chart-slide');

function createFinancialIndustryRenderers(ctx = {}, helpers = {}) {
  const industryChartSlide = createFinancialIndustryChartSlideRenderer(ctx, helpers);

  return {
    industryChartSlide
  };
}

module.exports = {
  createFinancialIndustryRenderers
};
