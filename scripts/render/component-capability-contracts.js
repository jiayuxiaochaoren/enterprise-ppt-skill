const COMPONENT_ALIASES = {
  'basket-metric-strip': 'kpi-strip',
  'brand-proof-caption': 'caption-bar',
  'brand-world-hero': 'hero-image',
  'business-proof-rail': 'value-chain',
  'chart-commentary': 'chart-commentary-panel',
  'commentary': 'commentary-panel',
  'commentary-card': 'commentary-panel',
  'control-tag': 'risk-register',
  'gallery-grid': 'proof-gallery',
  'hero-kpi': 'kpi-strip',
  'hero-kpi-strip': 'kpi-strip',
  'hero-kpis': 'kpi-strip',
  'image-gallery': 'proof-gallery',
  'large-product-frame': 'hero-image',
  'luxury-caption-bar': 'caption-bar',
  'member-ladder': 'kpi-strip',
  'metric-strip': 'kpi-strip',
  'primary-kpi': 'kpi-primary-metric',
  'product-grid': 'product-matrix',
  'product-proof-callout': 'product-matrix',
  'product-story-caption': 'caption-bar',
  'proof-gallery-grid': 'proof-gallery',
  'risk-board': 'risk-register',
  'source-caption': 'caption-bar',
  'value-chain-connector': 'value-chain'
};

const {
  COMPONENT_DATA_REQUIREMENTS: COMPONENT_EVIDENCE_DATA_REQUIREMENTS
} = require('../design/component-evidence-contracts');

const COMPONENT_DATA_REQUIREMENTS = Object.assign({}, COMPONENT_EVIDENCE_DATA_REQUIREMENTS, {
  'beauty-channel-structure': ['chartSpec|channelStructure|channelEfficiency'],
  'beauty-efficacy-table': ['chartSpec|rows|products'],
  'beauty-member-repurchase': ['chartSpec|metrics|memberCohorts'],
  'beauty-price-band-matrix': ['chartSpec|products|priceBands'],
  'beauty-proof-gallery': ['images|visual.images|cards'],
  'beauty-review-sentiment': ['chartSpec|reviews|sentiment'],
  'beauty-sku-matrix': ['chartSpec|products|productStory'],
  'beauty-social-funnel': ['chartSpec|funnel|socialFunnel'],
  'beauty-sustainability-matrix': ['chartSpec|rows|sustainability']
});

Object.entries(COMPONENT_ALIASES).forEach(([alias, target]) => {
  if (!COMPONENT_DATA_REQUIREMENTS[alias] && COMPONENT_DATA_REQUIREMENTS[target]) {
    COMPONENT_DATA_REQUIREMENTS[alias] = COMPONENT_DATA_REQUIREMENTS[target];
  }
});

const CHART_COMPONENT_ID_LIST = [
  'bar-chart',
  'beauty-channel-structure',
  'beauty-efficacy-table',
  'beauty-member-repurchase',
  'beauty-price-band-matrix',
  'beauty-proof-gallery',
  'beauty-review-sentiment',
  'beauty-sku-matrix',
  'beauty-social-funnel',
  'beauty-sustainability-matrix',
  'funnel-chart',
  'heatmap-chart',
  'information-gap',
  'line-chart',
  'matrix-chart',
  'pareto-chart',
  'scorecard',
  'table-with-commentary',
  'waterfall-chart'
];

module.exports = {
  CHART_COMPONENT_ID_LIST,
  COMPONENT_ALIASES,
  COMPONENT_DATA_REQUIREMENTS
};
