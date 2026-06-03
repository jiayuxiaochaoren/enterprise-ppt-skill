const {
  createFinancialResultsChartCards
} = require('./financial-results-chart-grid-cards');
const {
  createFinancialResultsCommentaryRail
} = require('./financial-results-commentary-rail');

function createChartGridWithCommentary(ctx = {}, helpers = {}) {
  const {
    drawFooter,
    drawResultsHeader
  } = helpers;
  const C = ctx.colors();
  const {
    addText,
  } = ctx;
  const { drawFinancialResultsChartCards } = createFinancialResultsChartCards(ctx);
  const { drawFinancialResultsCommentaryRail } = createFinancialResultsCommentaryRail(ctx);

  return function chartGridWithCommentary(slide, plan, s, idx) {
    drawResultsHeader(slide, s, idx, {
      kicker:'CHART GRID WITH COMMENTARY',
      title:'经营读数与评论',
      titleY:1.05,
      titleW:6.2,
      titleH:0.34,
      titleSize:24,
      subtitle:'趋势图和评论区必须绑定到同一经营动作。',
      subtitleY:1.50,
      subtitleW:7.0,
      subtitleSize:10.0
    });
    const metrics = (s.metrics || []).slice(0, 3);
    drawFinancialResultsChartCards(slide, metrics);

    drawFinancialResultsCommentaryRail(slide, s);
    addText(slide, s.note || '图表评论区必须解释数据为什么改变下一步动作。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createChartGridWithCommentary
};
