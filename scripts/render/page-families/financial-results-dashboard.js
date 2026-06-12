const {
  createDashboardManagementReadout
} = require('./financial-results-dashboard-management');
const {
  createDashboardPrimaryReturnPanel
} = require('./financial-results-dashboard-primary');
const {
  createDashboardReturnRiskPanel
} = require('./financial-results-dashboard-return-risk');

function createFinanceMetricDashboard(ctx = {}, deps = {}) {
  const {
    addText,
  } = ctx;
  const C = ctx.colors();
  const {
    drawFooter,
    drawResultsHeader
  } = deps;
  const { drawDashboardManagementReadout } = createDashboardManagementReadout(ctx);
  const { drawDashboardPrimaryReturnPanel } = createDashboardPrimaryReturnPanel(ctx);
  const { drawDashboardReturnRiskPanel } = createDashboardReturnRiskPanel(ctx);

  return function financeMetricDashboard(slide, plan, s, idx) {
    drawResultsHeader(slide, s, idx, {
      kicker:'PORTFOLIO DASHBOARD',
      title:'组合表现复盘',
      titleY:1.06,
      titleW:5.9,
      titleH:0.36,
      titleSize:24,
      subtitle:'把回报、现金回收和风险暴露放在同一张投委会复盘页。',
      subtitleY:1.54,
      subtitleW:7.0,
      subtitleSize:10.2
    });

    const metrics = (s.metrics || []).slice(0,4);
    const primary = metrics[0] || { label:'组合 IRR', value:'—', note:'需要结合估值、现金回收和退出窗口一起判断。' };
    const panel = { x:0.92, y:2.08, w:3.10, h:3.94 };
    drawDashboardPrimaryReturnPanel(slide, primary, panel);

    const chart = { x:4.46, y:2.10, w:3.16, h:3.86 };
    drawDashboardReturnRiskPanel(slide, metrics, chart);

    const table = { x:8.08, y:2.10, w:3.64, h:3.86 };
    drawDashboardManagementReadout(slide, metrics, table);
    addText(slide, s.note || 'DPI 与估值修复是当前最重要的复盘信号。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createFinanceMetricDashboard
};
