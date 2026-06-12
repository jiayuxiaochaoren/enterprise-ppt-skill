const { createPageFamilyPrimitives } = require('./primitives');
const {
  createFinanceMetricDashboard
} = require('./financial-results-dashboard');
const {
  createChartGridWithCommentary
} = require('./financial-results-chart-grid');
const {
  createFinancialKpiSnapshot
} = require('./financial-results-kpi-snapshot');
const {
  createQuarterlyResultsSummary
} = require('./financial-results-quarterly');

function createFinancialResultsRenderers(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);

  function drawResultsHeader(slide, s, idx, opts = {}) {
    return drawLightPageHeader(slide, {
      kicker:opts.kicker,
      title:s.title || opts.title,
      titleY:opts.titleY,
      titleW:opts.titleW,
      titleH:opts.titleH,
      titleSize:opts.titleSize,
      subtitle:s.claim || s.subtitle || opts.subtitle,
      subtitleY:opts.subtitleY,
      subtitleW:opts.subtitleW,
      subtitleH:0.20,
      subtitleSize:opts.subtitleSize,
      idx,
      pageNumber:'chrome'
    });
  }
  const quarterlyResultsSummary = createQuarterlyResultsSummary(ctx, {
    drawFooter,
    drawResultsHeader
  });
  const financeMetricDashboard = createFinanceMetricDashboard(ctx, {
    drawFooter,
    drawResultsHeader
  });
  const chartGridWithCommentary = createChartGridWithCommentary(ctx, {
    drawFooter,
    drawResultsHeader
  });
  const financialKpiSnapshot = createFinancialKpiSnapshot(ctx, {
    drawFooter,
    drawResultsHeader
  });

  return {
    chartGridWithCommentary,
    financeMetricDashboard,
    financialKpiSnapshot,
    quarterlyResultsSummary
  };
}

module.exports = {
  createFinancialResultsRenderers
};
