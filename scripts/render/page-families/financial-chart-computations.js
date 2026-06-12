const channelComputations = require('./financial-chart-channel-computations');
const trendComputations = require('./financial-chart-trend-computations');
const waterfallComputations = require('./financial-chart-waterfall-computations');

module.exports = Object.assign({},
  channelComputations,
  trendComputations,
  waterfallComputations
);
