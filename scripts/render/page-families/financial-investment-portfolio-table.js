const { createPortfolioAllocationSummary } = require('./financial-investment-portfolio-summary');
const { createPortfolioActionTableGrid } = require('./financial-investment-portfolio-table-grid');

function createPortfolioTableSlide(ctx = {}, deps = {}) {
  const { drawFooter, drawLightPageHeader } = deps;
  const { drawPortfolioActionTable } = createPortfolioActionTableGrid(ctx);
  const { drawPortfolioAllocationSummary } = createPortfolioAllocationSummary(ctx);

  return function portfolioTableSlide(slide, plan, s, idx) {
    const C = ctx.colors();
    const header = drawLightPageHeader(slide, {
      kicker:'PORTFOLIO ACTION TABLE',
      title:s.title || '组合分层与行动清单',
      titleY:1.06,
      titleW:5.9,
      titleH:0.36,
      titleSize:24,
      subtitle:s.subtitle || s.claim,
      subtitleY:1.54,
      subtitleW:7.0,
      subtitleSize:10.2,
      idx
    });

    const rows = (s.portfolio || s.allocations || s.rows || []).slice(0,5);
    const contentY = Math.max(2.10, Number(header && header.contentTop) || 2.10);
    const contentH = Math.max(3.46, 6.04 - contentY);
    const summary = { x:0.92, y:contentY, w:2.72, h:contentH };
    drawPortfolioAllocationSummary(slide, s, rows, summary);
    const table = { x:3.94, y:contentY, w:7.84, h:contentH };
    drawPortfolioActionTable(slide, rows, table);
    ctx.addText(slide, s.note || '配置比例、回收质量、风险等级和下一步动作放在同一坐标。', { x:0.94, y:6.42, w:8.6, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createPortfolioTableSlide
};
