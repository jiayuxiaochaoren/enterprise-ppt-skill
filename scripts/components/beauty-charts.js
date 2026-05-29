const { renderBarChart } = require('./bar-chart');
const { renderFunnelChart } = require('./funnel-chart');
const { renderLineChart } = require('./line-chart');
const { renderMatrixChart } = require('./matrix-chart');
const { renderParetoChart } = require('./pareto-chart');
const { renderScorecard } = require('./scorecard');
const { renderTableWithCommentary } = require('./table-with-commentary');

function withBeauty(result, componentId, template) {
  return Object.assign({}, result, {
    rendererModule: result.rendered ? `components/beauty-charts/${template}` : result.rendererModule,
    componentId,
    industryTemplate: template
  });
}

function renderBeautySkuMatrix(ctx, spec, opts) {
  return withBeauty(renderMatrixChart(ctx, spec, opts), 'beauty-sku-matrix', 'sku-matrix');
}

function renderBeautyPriceBandMatrix(ctx, spec, opts) {
  return withBeauty(renderMatrixChart(ctx, spec, opts), 'beauty-price-band-matrix', 'price-band-matrix');
}

function renderBeautyEfficacyTable(ctx, spec, opts) {
  return withBeauty(renderTableWithCommentary(ctx, spec, opts), 'beauty-efficacy-table', 'efficacy-evidence-table');
}

function renderBeautyProofGallery(ctx, spec, opts) {
  return withBeauty(renderTableWithCommentary(ctx, spec, opts), 'beauty-proof-gallery', 'texture-ingredient-proof-gallery');
}

function renderBeautyChannelStructure(ctx, spec, opts) {
  const result = spec.kind === 'matrix'
    ? renderMatrixChart(ctx, spec, opts)
    : renderBarChart(ctx, spec, opts);
  return withBeauty(result, 'beauty-channel-structure', 'channel-structure');
}

function renderBeautyMemberRepurchase(ctx, spec, opts) {
  const result = spec.kind === 'line'
    ? renderLineChart(ctx, spec, opts)
    : renderScorecard(ctx, spec, opts);
  return withBeauty(result, 'beauty-member-repurchase', 'member-repurchase');
}

function renderBeautySocialFunnel(ctx, spec, opts) {
  return withBeauty(renderFunnelChart(ctx, spec, opts), 'beauty-social-funnel', 'social-funnel');
}

function renderBeautyReviewSentiment(ctx, spec, opts) {
  return withBeauty(renderParetoChart(ctx, spec, opts), 'beauty-review-sentiment', 'review-sentiment');
}

function renderBeautySustainabilityMatrix(ctx, spec, opts) {
  return withBeauty(renderMatrixChart(ctx, spec, opts), 'beauty-sustainability-matrix', 'packaging-sustainability-matrix');
}

module.exports = {
  renderBeautyChannelStructure,
  renderBeautyEfficacyTable,
  renderBeautyMemberRepurchase,
  renderBeautyPriceBandMatrix,
  renderBeautyProofGallery,
  renderBeautyReviewSentiment,
  renderBeautySkuMatrix,
  renderBeautySocialFunnel,
  renderBeautySustainabilityMatrix
};
