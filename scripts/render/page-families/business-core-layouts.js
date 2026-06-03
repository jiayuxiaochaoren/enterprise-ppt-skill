const {
  createBusinessComparisonRenderer
} = require('./business-comparison');
const {
  createBusinessExecutiveBlocksRenderer
} = require('./business-executive-blocks');

function createBusinessCoreLayoutRenderers(ctx = {}, deps = {}) {
  const comparisonSlide = createBusinessComparisonRenderer(ctx, deps);
  const executiveBlocks = createBusinessExecutiveBlocksRenderer(ctx, deps);

  return {
    comparisonSlide,
    executiveBlocks
  };
}

module.exports = {
  createBusinessCoreLayoutRenderers
};
