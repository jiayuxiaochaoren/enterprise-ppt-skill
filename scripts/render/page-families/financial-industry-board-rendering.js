const {
  visibleSourceNotesEnabled
} = require('../../design/source-evidence');

function createFinancialIndustryBoardRenderer(ctx = {}, drawers = {}) {
  const {
    chartSpecToComponentId,
    componentRendererContext,
    recordChartConsumption,
    renderChartSpec,
    routeChartSpec
  } = ctx;
  const {
    drawChannelEfficiencyMatrix,
    drawIndustryWaterfall,
    drawMonthlyPulseTrend
  } = drawers;

  function renderRoutedChartSpec(slide, plan, s, idx, board) {
    const chartSpec = s.chartSpec || routeChartSpec(plan, s, {
      index:idx,
      total:(plan.slides || []).length
    });
    if (!chartSpec) return false;

    const result = renderChartSpec(componentRendererContext(slide), chartSpec, {
      x:board.x,
      y:board.y,
      w:board.w,
      h:board.h,
      noFrame:true,
      showTitle:false,
      compactHeader:true,
      showSourceNote:visibleSourceNotesEnabled(plan)
    });
    if (!result.rendered) return false;

    recordChartConsumption(slide, chartSpec, result, {
      plannedComponentId:chartSpecToComponentId(chartSpec),
      mode:'native-chart-spec'
    });
    return true;
  }

  function renderNativeChartBoard(slide, board, s, variant) {
    if (variant === 'waterfall-bridge') {
      drawIndustryWaterfall(slide, board, s);
      return true;
    }
    if (variant === 'monthly-pulse-trend') {
      drawMonthlyPulseTrend(slide, board, s);
      return true;
    }
    if (variant === 'channel-efficiency-matrix') {
      drawChannelEfficiencyMatrix(slide, board, s);
      return true;
    }
    return false;
  }

  return function renderFinancialIndustryBoard(slide, plan, s, idx, variant, board) {
    return renderNativeChartBoard(slide, board, s, variant)
      || renderRoutedChartSpec(slide, plan, s, idx, board);
  };
}

module.exports = {
  createFinancialIndustryBoardRenderer
};
