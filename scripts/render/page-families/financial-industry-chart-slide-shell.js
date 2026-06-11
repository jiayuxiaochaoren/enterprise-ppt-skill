function createFinancialIndustryChartSlideShell(ctx = {}, deps = {}) {
  const {
    drawBusinessLogicRow,
    drawChartBoardShell,
    drawFooter,
    drawLightPageHeader,
    drawProofObjectPanel,
    renderFinancialIndustryBoard,
    renderIndustryVariantBoard
  } = deps;

  return function renderIndustryChartSlideShell(slide, plan, s, idx, variant, variantLabel) {
    const title = s.title || '行业证据读数';
    const longTitle = String(title || '').replace(/\s+/g, '').length > 20;
    drawLightPageHeader(slide, {
      kicker:variantLabel,
      title,
      titleY:1.06,
      titleW:longTitle ? 8.60 : 5.9,
      titleH:longTitle ? 0.58 : 0.36,
      titleSize:longTitle ? 20.5 : 24,
      subtitle:s.subtitle || s.claim,
      subtitleY:longTitle ? 1.72 : 1.54,
      subtitleW:longTitle ? 8.90 : 7.0,
      subtitleSize:longTitle ? 9.4 : 10.2,
      idx
    });

    const logicItems = Array.isArray((s.businessLogic || s.business_logic || s.diagnosticChain || s.diagnostic_chain))
      ? []
      : Object.values(s.businessLogic || s.business_logic || s.diagnosticChain || s.diagnostic_chain || {}).filter(Boolean);
    const hasLogic = logicItems.length >= 2;
    const side = { x:0.92, y:2.10, w:2.62, h:hasLogic ? 4.42 : 3.96 };
    const board = { x:3.92, y:2.10, w:7.76, h:hasLogic ? 3.52 : 3.96 };
    const logicZone = hasLogic ? { x:3.92, y:5.78, w:7.76, h:0.74 } : null;
    drawProofObjectPanel(slide, s, side, variantLabel);
    drawChartBoardShell(slide, board);

    if (renderFinancialIndustryBoard(slide, plan, s, idx, variant, board)) {
      // chartSpec/v1 or native chart renderer owns the board.
    } else {
      renderIndustryVariantBoard(slide, s, variant, board);
    }
    drawBusinessLogicRow(slide, s, logicZone);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createFinancialIndustryChartSlideShell
};
