const {
  createChannelEfficiencyMatrixDrawer
} = require('./financial-industry-channel-efficiency');
const {
  createMonthlyPulseTrendDrawer
} = require('./financial-industry-monthly-trend');
const {
  createIndustryWaterfallDrawer
} = require('./financial-industry-waterfall');

function createFinancialIndustryChartDrawers(ctx = {}) {
  return {
    drawChannelEfficiencyMatrix: createChannelEfficiencyMatrixDrawer(ctx),
    drawIndustryWaterfall: createIndustryWaterfallDrawer(ctx),
    drawMonthlyPulseTrend: createMonthlyPulseTrendDrawer(ctx)
  };
}

module.exports = {
  createFinancialIndustryChartDrawers
};
