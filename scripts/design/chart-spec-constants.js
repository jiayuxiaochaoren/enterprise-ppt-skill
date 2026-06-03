const CHART_SPEC_VERSION = 'chartSpec/v1';

const GENERIC_KINDS = [
  'kpi',
  'bar',
  'line',
  'waterfall',
  'funnel',
  'matrix',
  'heatmap',
  'pareto',
  'table',
  'scorecard',
  'informationGap'
];

const CHART_COMPONENTS = {
  kpi: 'kpi-strip',
  bar: 'bar-chart',
  line: 'line-chart',
  waterfall: 'waterfall-chart',
  funnel: 'funnel-chart',
  matrix: 'matrix-chart',
  heatmap: 'heatmap-chart',
  pareto: 'pareto-chart',
  table: 'table-with-commentary',
  scorecard: 'scorecard',
  informationGap: 'information-gap'
};
const KNOWN_CHART_KINDS = new Set(GENERIC_KINDS);

const BEAUTY_TEMPLATE_COMPONENTS = {
  'sku-matrix': 'beauty-sku-matrix',
  'price-band-matrix': 'beauty-price-band-matrix',
  'efficacy-evidence-table': 'beauty-efficacy-table',
  'texture-ingredient-proof-gallery': 'beauty-proof-gallery',
  'channel-structure': 'beauty-channel-structure',
  'member-repurchase': 'beauty-member-repurchase',
  'social-funnel': 'beauty-social-funnel',
  'review-sentiment': 'beauty-review-sentiment',
  'packaging-sustainability-matrix': 'beauty-sustainability-matrix'
};

const CHART_FIELD_KEYS = {
  waterfall: ['waterfallBridge', 'targetBridge', 'bridge'],
  line: ['monthlyPulse', 'monthlyTrend', 'trend', 'seriesTrend', 'repurchaseTrend'],
  funnel: ['funnel', 'adoptionFunnel', 'activationFunnel', 'cohortFunnel', 'socialFunnel'],
  pareto: ['pareto', 'downtimePareto', 'lossPareto', 'oeeLosses', 'reviewSentiment'],
  matrix: ['matrix', 'skuMatrix', 'priceBandMatrix', 'priceBands', 'channelEfficiency', 'mediaEfficiency', 'scatter', 'channels', 'packagingMatrix', 'sustainabilityMatrix'],
  heatmap: ['heatmap', 'valuationSensitivity', 'sensitivity', 'exitScenarios', 'irrSensitivity'],
  bar: ['bars', 'barData', 'channelStructure', 'channelMix', 'segments'],
  scorecard: ['scorecard', 'memberCohorts', 'cohorts', 'rfmLadder', 'metrics'],
  table: ['rows', 'tableRows', 'efficacyTable', 'proofTable'],
  kpi: ['metrics']
};

const BODY_EXEMPT_TYPES = new Set(['cover', 'cover-dark', 'toc', 'toc-clean', 'chapter-divider', 'closing', 'closing-dark']);
const NON_CHART_DATA_COMPONENT_RE = /proof-gallery|evidence-gallery|campaign-proof-gallery|risk-register|value-chain|product-matrix|proof-photo|gallery|caption|governance-table|process|story|hero|image/i;
const CHART_DATA_COMPONENT_RE = /chart|kpi|metric|scorecard|trend|line|bar|waterfall|bridge|funnel|matrix|heatmap|pareto|table|scatter|bubble|score|cohort|channel|regional-scorecard|monthly|pulse|repurchase|sentiment/i;
const NON_CHART_VARIANT_RE = /brand-world|product-evidence|consumer-proof|sustainability-proof|proof-photo|gallery|lookbook|story|governance-table|value-creation-process|beauty-brand-editorial|premium-closing|cover|closing/i;
const CHART_VARIANT_RE = /chart|kpi|scorecard|member-growth|regional-scorecard|financial-kpi|quarterly-results|waterfall|funnel|matrix|pareto|trend|bridge|channel-mix|channel-structure/i;

module.exports = {
  BEAUTY_TEMPLATE_COMPONENTS,
  BODY_EXEMPT_TYPES,
  CHART_COMPONENTS,
  CHART_DATA_COMPONENT_RE,
  CHART_FIELD_KEYS,
  CHART_SPEC_VERSION,
  CHART_VARIANT_RE,
  GENERIC_KINDS,
  KNOWN_CHART_KINDS,
  NON_CHART_DATA_COMPONENT_RE,
  NON_CHART_VARIANT_RE
};
