const {
  createFinancialIndustryBoardRenderer
} = require('./financial-industry-board-rendering');
const {
  createFinancialIndustryChartDrawers
} = require('./financial-industry-charts');
const {
  createFinancialIndustryVariantBoardRenderer
} = require('./financial-industry-variant-boards');
const {
  industryChartVariantLabel
} = require('./financial-industry-chart-slide-data');
const {
  createFinancialIndustryChartSlidePanels
} = require('./financial-industry-chart-slide-panels');
const {
  createFinancialIndustryChartSlideShell
} = require('./financial-industry-chart-slide-shell');
const {
  createPageFamilyPrimitives
} = require('./primitives');

function createFinancialIndustryChartSlideRenderer(ctx = {}, helpers = {}) {
  const retailMemberGrowthBoard = helpers.retailMemberGrowthBoard || (() => false);
  const {
    variantOf
  } = ctx;
  const {
    drawChannelEfficiencyMatrix,
    drawIndustryWaterfall,
    drawMonthlyPulseTrend
  } = createFinancialIndustryChartDrawers(ctx);
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    drawBusinessLogicRow,
    drawChartBoardShell,
    drawProofObjectPanel
  } = createFinancialIndustryChartSlidePanels(ctx);
  const renderFinancialIndustryBoard = createFinancialIndustryBoardRenderer(ctx, {
    drawChannelEfficiencyMatrix,
    drawIndustryWaterfall,
    drawMonthlyPulseTrend
  });
  const renderIndustryVariantBoard = createFinancialIndustryVariantBoardRenderer(ctx);
  const renderIndustryChartSlideShell = createFinancialIndustryChartSlideShell(ctx, {
    drawBusinessLogicRow,
    drawChartBoardShell,
    drawFooter,
    drawLightPageHeader,
    drawProofObjectPanel,
    renderFinancialIndustryBoard,
    renderIndustryVariantBoard
  });

  return function industryChartSlide(slide, plan, s, idx) {
    const variant = variantOf(s, 'evidence-readout');
    if (variant === 'member-growth-board') return retailMemberGrowthBoard(slide, plan, s, idx);
    const variantLabel = industryChartVariantLabel(variant);
    return renderIndustryChartSlideShell(slide, plan, s, idx, variant, variantLabel);
  };
}

module.exports = {
  createFinancialIndustryChartSlideRenderer
};
