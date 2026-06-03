const family = 'financial';
const {
  createFinancialInvestmentRenderers
} = require('./financial-investment');
const {
  createFinancialIndustryRenderers
} = require('./financial-industry');
const {
  createFinancialResultsRenderers
} = require('./financial-results');
const {
  createFinancialScorecardRenderers
} = require('./financial-scorecards');
const {
  createMetricComparisonRenderer
} = require('./financial-metric-comparison');

const types = [
  'metric-comparison',
  'industry-chart',
  'finance-bridge',
  'portfolio-table'
];

function createFinancialRenderers(ctx = {}) {
  const {
    financeBridgeSlide,
    portfolioTableSlide
  } = createFinancialInvestmentRenderers(ctx);
  const {
    chartGridWithCommentary,
    financeMetricDashboard,
    financialKpiSnapshot,
    quarterlyResultsSummary
  } = createFinancialResultsRenderers(ctx);
  const {
    healthcareServiceScorecard,
    manufacturingOeeBoard,
    retailMemberGrowthBoard,
    saasAdoptionRevenueBoard
  } = createFinancialScorecardRenderers(ctx);
  const {
    industryChartSlide
  } = createFinancialIndustryRenderers(ctx, { retailMemberGrowthBoard });
  const metricComparison = createMetricComparisonRenderer(ctx, {
    chartGridWithCommentary,
    financeMetricDashboard,
    financialKpiSnapshot,
    healthcareServiceScorecard,
    manufacturingOeeBoard,
    quarterlyResultsSummary,
    retailMemberGrowthBoard,
    saasAdoptionRevenueBoard
  });

  return {
    financeBridgeSlide,
    portfolioTableSlide,
    industryChartSlide,
    metricComparison,
    chartGridWithCommentary,
    financeMetricDashboard,
    financialKpiSnapshot,
    quarterlyResultsSummary
  };
}

function entries(renderers = {}) {
  return [
    { types:['metric-comparison'], render:renderers.metricComparison, source:`page-family:${family}` },
    { types:['industry-chart'], render:renderers.industryChartSlide, source:`page-family:${family}` },
    { types:['finance-bridge'], render:renderers.financeBridgeSlide, source:`page-family:${family}` },
    { types:['portfolio-table'], render:renderers.portfolioTableSlide, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createFinancialRenderers,
  entries
};
