const {
  visibleSourceNotesEnabled
} = require('./source-evidence');
const {
  componentHasEvidence,
  hasFieldPath,
  hasValue
} = require('./component-evidence-contracts');

function hasStructuredField(s = {}, fields = []) {
  return fields.some(field => {
    if (field.includes('.')) return hasFieldPath(s, field);
    return hasValue(s[field]);
  });
}

function industryChainComponentAllowed(id = '', options = {}) {
  const {
    directImageCount = 0,
    evidenceChain = {},
    plan = {},
    productProofSignal = false,
    signals = {},
    slide = {},
    type = ''
  } = options;
  const hasImages = directImageCount > 0 || signals.imageCount > 0;
  const hasMetrics = signals.hasMetrics || Array.isArray(slide.metrics);
  const hasRows = Array.isArray(slide.rows) || Array.isArray(slide.risks) || Array.isArray(slide.controls);
  const hasFlow = hasStructuredField(slide, ['phases', 'actions', 'steps', 'timeline', 'milestones', 'loopItems', 'workflows']);
  const hasArchitecture = signals.hasArchitecture || hasStructuredField(slide, ['layers', 'architecture', 'systemMap', 'topology', 'capabilityMap', 'platformCapabilities', 'valueChain', 'capitals']);
  const chartEvidencePage = ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type) &&
    (hasStructuredField(slide, ['chartSpec', 'chart_spec']) || hasStructuredField(slide, ['chartKind', 'chart_kind']));
  const chartSpec = slide.chartSpec || slide.chart_spec || {};
  const chartRouteText = [
    slide.layoutVariant,
    slide.variant,
    slide.proofObject,
    slide.proof_object,
  ].filter(Boolean).join(' ');
  const beautyChartEvidencePage = chartEvidencePage &&
    ['beauty-consumer', 'brand-retail'].includes(plan.industry) &&
    /monthly-pulse-trend|channel-efficiency-matrix|member-cohort-ladder|social-funnel|review-sentiment-pareto|waterfall-bridge/i.test(chartRouteText);
  if (beautyChartEvidencePage && !hasImages && ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'].includes(id)) {
    return false;
  }
  if (id === 'source-note') return visibleSourceNotesEnabled(plan || {}, options) && evidenceChain.hasSourceEvidence;
  return componentHasEvidence(id, slide, Object.assign({}, options, {
    hasArchitecture,
    hasCaptionEvidence: evidenceChain.hasCaptionEvidence,
    hasFlow,
    hasImages,
    hasMetrics,
    hasRows,
    productProofSignal,
    type
  }));
}

module.exports = {
  hasStructuredField,
  industryChainComponentAllowed
};
