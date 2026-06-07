const { renderKpiStrip } = require('./kpi-strip');
const { renderProofGallery } = require('./proof-gallery');
const { renderProductMatrix } = require('./product-matrix');
const { renderRiskRegister } = require('./risk-register');
const { renderValueChain } = require('./value-chain');
const { renderBarChart } = require('./bar-chart');
const { renderChartSpec } = require('./chart-renderer');
const { renderFunnelChart } = require('./funnel-chart');
const { renderHeatmapChart } = require('./heatmap-chart');
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
const componentManifest = require('../render/component-capability-manifest');

module.exports = {
  CHART_COMPONENT_IDS: componentManifest.CHART_COMPONENT_IDS,
  COMPONENT_ALIASES: componentManifest.COMPONENT_ALIASES,
  COMPONENT_CAPABILITIES: componentManifest.COMPONENT_CAPABILITIES,
  COMPONENT_DATA_REQUIREMENTS: componentManifest.COMPONENT_DATA_REQUIREMENTS,
  COMPONENT_MANIFEST_VERSION: componentManifest.COMPONENT_MANIFEST_VERSION,
  OVERLAY_PRONE_COMPONENT_IDS: componentManifest.OVERLAY_PRONE_COMPONENT_IDS,
  canonicalComponentId: componentManifest.canonicalComponentId,
  componentAliasTargetFor: componentManifest.componentAliasTargetFor,
  componentCapabilityFor: componentManifest.componentCapabilityFor,
  componentManifestAudit: componentManifest.componentManifestAudit,
  effectiveComponentModesFor: componentManifest.effectiveComponentModesFor,
  hasComponentCapability: componentManifest.hasComponentCapability,
  isComponentAlias: componentManifest.isComponentAlias,
  normalizeComponentId: componentManifest.normalizeComponentId,
  renderBarChart,
  renderBeautyChannelStructure,
  renderBeautyEfficacyTable,
  renderBeautyMemberRepurchase,
  renderBeautyPriceBandMatrix,
  renderBeautyProofGallery,
  renderBeautyReviewSentiment,
  renderBeautySkuMatrix,
  renderBeautySocialFunnel,
  renderBeautySustainabilityMatrix,
  renderChartSpec,
  renderFunnelChart,
  renderHeatmapChart,
  renderKpiStrip,
  renderLineChart,
  renderMatrixChart,
  renderParetoChart,
  renderProofGallery,
  renderProductMatrix,
  renderRiskRegister,
  renderScorecard,
  renderTableWithCommentary,
  renderWaterfallChart,
  renderValueChain
};
