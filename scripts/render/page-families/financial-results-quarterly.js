const {
  createQuarterlyActionRail
} = require('./financial-results-quarterly-action');
const {
  createQuarterlyMetricsTable
} = require('./financial-results-quarterly-metrics');
const {
  createQuarterlyPeriodPanel
} = require('./financial-results-quarterly-period');

function createQuarterlyResultsSummary(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addText
  } = ctx;
  const {
    drawFooter,
    drawResultsHeader
  } = deps;
  const { drawQuarterlyActionRail } = createQuarterlyActionRail(ctx);
  const { drawQuarterlyMetricsTable } = createQuarterlyMetricsTable(ctx);
  const { drawQuarterlyPeriodPanel } = createQuarterlyPeriodPanel(ctx);

  return function quarterlyResultsSummary(slide, plan, s, idx) {
    drawResultsHeader(slide, s, idx, {
      kicker:'QUARTERLY RESULTS SUMMARY',
      title:'季度结果摘要',
      titleY:1.05,
      titleW:6.5,
      titleH:0.34,
      titleSize:23.0,
      subtitle:'季度页同时呈现结果、差异解释和管理动作。',
      subtitleY:1.50,
      subtitleW:7.0,
      subtitleSize:10.0
    });
    const metrics = (s.metrics || []).slice(0, 4);
    const logic = s.businessLogic || {};
    const period = s.period || s.quarter || 'Quarter';

    const periodBox = { x:0.92, y:2.06, w:2.46, h:3.86 };
    drawQuarterlyPeriodPanel(slide, s, logic, period, periodBox);
    const table = { x:3.82, y:2.06, w:4.22, h:3.86 };
    drawQuarterlyMetricsTable(slide, metrics, table);
    const action = { x:8.46, y:2.06, w:2.96, h:3.86 };
    drawQuarterlyActionRail(slide, s, logic, action);
    addText(slide, s.note || '季度结果摘要需要同时回答结果、原因和下一步。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createQuarterlyResultsSummary
};
