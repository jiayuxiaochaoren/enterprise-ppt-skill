const { renderMatrixChart } = require('./matrix-chart');

function renderHeatmapChart(ctx, spec = {}, opts = {}) {
  const result = renderMatrixChart(ctx, Object.assign({}, spec, { kind: 'heatmap' }), opts);
  return Object.assign({}, result, {
    rendererModule: result.rendered ? 'components/heatmap-chart' : result.rendererModule,
    componentId: 'heatmap-chart'
  });
}

module.exports = { renderHeatmapChart };
