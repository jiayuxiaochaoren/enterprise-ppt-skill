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
    const header = drawResultsHeader(slide, s, idx, {
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
    const contentY = Math.max(2.06, Number(header && header.contentTop) || 2.06);
    const metrics = (s.metrics || []).slice(0, 4);
    const logic = s.businessLogic || {};
    const period = s.period || s.quarter || 'Quarter';

    const contentH = Math.max(3.44, 5.92 - contentY);
    const periodBox = { x:0.92, y:contentY, w:2.46, h:contentH };
    drawQuarterlyPeriodPanel(slide, s, logic, period, periodBox);
    const table = { x:3.82, y:contentY, w:4.22, h:contentH };
    drawQuarterlyMetricsTable(slide, metrics, table);
    const action = { x:8.46, y:contentY, w:2.96, h:contentH };
    drawQuarterlyActionRail(slide, s, logic, action);
    addText(slide, s.note || '季度结果摘要需要同时回答结果、原因和下一步。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createQuarterlyResultsSummary
};
