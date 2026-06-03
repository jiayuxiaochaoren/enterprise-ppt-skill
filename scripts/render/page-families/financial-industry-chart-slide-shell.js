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
    drawLightPageHeader(slide, {
      kicker:variantLabel,
      title:s.title || '行业证据读数',
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

    const side = { x:0.92, y:2.10, w:2.62, h:3.96 };
    const board = { x:3.92, y:2.10, w:7.76, h:3.96 };
    drawProofObjectPanel(slide, s, side, variantLabel);
    drawChartBoardShell(slide, board);

    if (renderFinancialIndustryBoard(slide, plan, s, idx, variant, board)) {
      // chartSpec/v1 or native chart renderer owns the board.
    } else {
      renderIndustryVariantBoard(slide, s, variant, board);
    }
    drawBusinessLogicRow(slide, s);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createFinancialIndustryChartSlideShell
};
