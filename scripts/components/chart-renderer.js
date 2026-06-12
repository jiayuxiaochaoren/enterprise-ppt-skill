const { chartSpecToComponentId } = require('../chart-spec');
const { renderBarChart } = require('./bar-chart');
const { renderFunnelChart } = require('./funnel-chart');
const { renderHeatmapChart } = require('./heatmap-chart');
const { renderInformationGap, sourceText } = require('./chart-layout');
const { renderKpiStrip } = require('./kpi-strip');
const { renderLineChart } = require('./line-chart');
const { renderMatrixChart } = require('./matrix-chart');
const { renderParetoChart } = require('./pareto-chart');
const { renderScorecard } = require('./scorecard');
const { renderTableWithCommentary } = require('./table-with-commentary');
const { renderWaterfallChart } = require('./waterfall-chart');
const {
  renderBeautyChannelStructure,
  renderBeautyEfficacyTable,
  renderBeautyMemberRepurchase,
  renderBeautyPriceBandMatrix,
  renderBeautyProofGallery,
  renderBeautyReviewSentiment,
  renderBeautySkuMatrix,
  renderBeautySocialFunnel,
  renderBeautySustainabilityMatrix
} = require('./beauty-charts');

function kpiMetricsFromSpec(spec = {}) {
  return (spec.series || []).flatMap(series => series.values || []).map(value => ({
    label: value.category,
    value: value.rawValue != null ? value.rawValue : value.value,
    note: value.note,
    unit: value.unit || spec.unit
  }));
}

function renderChartSpec(ctx, spec = {}, opts = {}) {
  if (!spec) return { rendered: false, reason: 'missing chart spec' };
  if (spec.kind === 'informationGap') return renderInformationGap(ctx, spec, opts);
  const componentId = chartSpecToComponentId(spec);
  const byComponent = {
    'beauty-sku-matrix': renderBeautySkuMatrix,
    'beauty-price-band-matrix': renderBeautyPriceBandMatrix,
    'beauty-efficacy-table': renderBeautyEfficacyTable,
    'beauty-proof-gallery': renderBeautyProofGallery,
    'beauty-channel-structure': renderBeautyChannelStructure,
    'beauty-member-repurchase': renderBeautyMemberRepurchase,
    'beauty-social-funnel': renderBeautySocialFunnel,
    'beauty-review-sentiment': renderBeautyReviewSentiment,
    'beauty-sustainability-matrix': renderBeautySustainabilityMatrix
  };
  if (byComponent[componentId]) return byComponent[componentId](ctx, spec, opts);
  if (spec.kind === 'kpi') {
    const metrics = kpiMetricsFromSpec(spec);
    return Object.assign(renderKpiStrip(ctx, metrics, Object.assign({}, opts, { sourceNote: sourceText(spec, opts) })), {
      componentId: 'kpi-strip',
      rendererModule: 'components/kpi-strip'
    });
  }
  if (spec.kind === 'bar') return renderBarChart(ctx, spec, opts);
  if (spec.kind === 'line') return renderLineChart(ctx, spec, opts);
  if (spec.kind === 'waterfall') return renderWaterfallChart(ctx, spec, opts);
  if (spec.kind === 'funnel') return renderFunnelChart(ctx, spec, opts);
  if (spec.kind === 'matrix') return renderMatrixChart(ctx, spec, opts);
  if (spec.kind === 'heatmap') return renderHeatmapChart(ctx, spec, opts);
  if (spec.kind === 'pareto') return renderParetoChart(ctx, spec, opts);
  if (spec.kind === 'scorecard') return renderScorecard(ctx, spec, opts);
  if (spec.kind === 'table') return renderTableWithCommentary(ctx, spec, opts);
  return renderInformationGap(ctx, Object.assign({}, spec, {
    kind: 'informationGap',
    requestedKind: spec.kind,
    informationGap: { reason: `No renderer for chart kind ${spec.kind}`, missingFields: [] }
  }), opts);
}

module.exports = { renderChartSpec };
