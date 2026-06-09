const {
  normalizeComponentId
} = require('../component-id-normalization');
const {
  CAPABILITY_ROWS
} = require('./component-capability-rows');

const VALID_COMPONENT_RENDER_PATHS = new Set(['native', 'overlay', 'suppressed-by-policy']);
const VALID_COMPONENT_RENDER_KINDS = new Set(['evidence', 'chrome', 'utility']);

const COMPONENT_RENDER_KIND_BY_CAPABILITY_FAMILY = {
  caption: 'evidence',
  chart: 'evidence',
  chrome: 'chrome',
  closing: 'utility',
  commentary: 'evidence',
  content: 'utility',
  flow: 'utility',
  governance: 'evidence',
  metric: 'evidence',
  'native-decoration': 'utility',
  product: 'evidence',
  source: 'evidence',
  table: 'evidence',
  visual: 'evidence'
};

const COMPONENT_RENDER_PATH_DEFAULTS = Object.fromEntries(
  CAPABILITY_ROWS.map(([id, supportedModes = []]) => [
    id,
    supportedModes.filter(mode => VALID_COMPONENT_RENDER_PATHS.has(mode))
  ])
);

const COMPONENT_RENDER_KIND_DEFAULTS = Object.fromEntries(
  CAPABILITY_ROWS.map(([id, , family]) => [
    id,
    COMPONENT_RENDER_KIND_BY_CAPABILITY_FAMILY[family] || 'utility'
  ])
);

const COMPONENT_RENDER_PATH_OVERRIDES = {
  'adoption-funnel': ['native'],
  'bar-chart': ['native', 'overlay'],
  'beauty-channel-structure': ['native', 'overlay'],
  'beauty-efficacy-table': ['native', 'overlay'],
  'beauty-member-repurchase': ['native', 'overlay'],
  'beauty-price-band-matrix': ['native', 'overlay'],
  'beauty-proof-gallery': ['native', 'overlay'],
  'beauty-review-sentiment': ['native', 'overlay'],
  'beauty-sku-matrix': ['native', 'overlay'],
  'beauty-social-funnel': ['native', 'overlay'],
  'beauty-sustainability-matrix': ['native', 'overlay'],
  'caption-bar': ['native', 'overlay'],
  'chart-commentary-panel': ['native', 'overlay'],
  'commentary-panel': ['native', 'overlay'],
  'contact-block': ['native'],
  'content-card-grid': ['native'],
  'campaign-to-member-rail': ['native'],
  'decision-panel': ['native'],
  'disclosure-footnote': ['native'],
  'editorial-index': ['native'],
  'editorial-end-card': ['native'],
  'equipment-nameplate': ['native'],
  'funnel-chart': ['native', 'overlay'],
  'governance-table': ['native'],
  'heatmap-chart': ['native', 'overlay'],
  'hero-image': ['native', 'overlay'],
  'information-gap': ['native', 'overlay'],
  'inspection-matrix': ['native'],
  'kpi-primary-metric': ['native'],
  'kpi-strip': ['native', 'overlay'],
  'load-curve-band': ['native'],
  'launch-rhythm-strip': ['native'],
  'line-chart': ['native', 'overlay'],
  'matrix-chart': ['native', 'overlay'],
  'metric-strip': ['native', 'overlay'],
  'navigation-sequence': ['native'],
  'page-number': ['native'],
  'pareto-chart': ['native', 'overlay'],
  'patient-journey-band': ['native'],
  'permission-audit-tag': ['native'],
  'process-rail': ['native', 'overlay'],
  'product-matrix': ['native', 'overlay'],
  'proof-gallery': ['native', 'overlay'],
  'proof-gallery-grid': ['native', 'overlay'],
  'prototype-frame': ['native'],
  'quality-scorecard': ['native'],
  'risk-matrix': ['native', 'overlay'],
  'risk-register': ['native', 'overlay'],
  'scorecard': ['native', 'overlay'],
  'section-kicker': ['native'],
  'service-blueprint-lane': ['native'],
  'site-evidence-frame': ['native'],
  'source-note': ['overlay', 'suppressed-by-policy'],
  'system-rail': ['native', 'overlay'],
  'table-with-commentary': ['native', 'overlay'],
  'value-chain': ['native', 'overlay'],
  'value-chain-connector': ['native', 'overlay'],
  'waterfall-chart': ['native', 'overlay'],
  'workflow-rail': ['native']
};

const COMPONENT_RENDER_PATHS = Object.assign({}, COMPONENT_RENDER_PATH_DEFAULTS, COMPONENT_RENDER_PATH_OVERRIDES);

const COMPONENT_RENDER_KIND_OVERRIDES = {
  'adoption-funnel': 'evidence',
  'bar-chart': 'evidence',
  'beauty-channel-structure': 'evidence',
  'beauty-efficacy-table': 'evidence',
  'beauty-member-repurchase': 'evidence',
  'beauty-price-band-matrix': 'evidence',
  'beauty-proof-gallery': 'evidence',
  'beauty-review-sentiment': 'evidence',
  'beauty-sku-matrix': 'evidence',
  'beauty-social-funnel': 'evidence',
  'beauty-sustainability-matrix': 'evidence',
  'caption-bar': 'evidence',
  'chart-commentary-panel': 'evidence',
  'commentary-panel': 'evidence',
  'contact-block': 'utility',
  'content-card-grid': 'utility',
  'campaign-to-member-rail': 'utility',
  'decision-panel': 'utility',
  'disclosure-footnote': 'evidence',
  'editorial-index': 'utility',
  'editorial-end-card': 'utility',
  'equipment-nameplate': 'evidence',
  'funnel-chart': 'evidence',
  'governance-table': 'evidence',
  'heatmap-chart': 'evidence',
  'hero-image': 'evidence',
  'information-gap': 'evidence',
  'inspection-matrix': 'evidence',
  'kpi-primary-metric': 'evidence',
  'kpi-strip': 'evidence',
  'load-curve-band': 'utility',
  'launch-rhythm-strip': 'utility',
  'line-chart': 'evidence',
  'matrix-chart': 'evidence',
  'metric-strip': 'evidence',
  'navigation-sequence': 'chrome',
  'page-number': 'chrome',
  'pareto-chart': 'evidence',
  'patient-journey-band': 'evidence',
  'permission-audit-tag': 'evidence',
  'process-rail': 'utility',
  'product-matrix': 'evidence',
  'proof-gallery': 'evidence',
  'proof-gallery-grid': 'evidence',
  'prototype-frame': 'evidence',
  'quality-scorecard': 'evidence',
  'risk-matrix': 'evidence',
  'risk-register': 'evidence',
  'scorecard': 'evidence',
  'section-kicker': 'chrome',
  'service-blueprint-lane': 'evidence',
  'site-evidence-frame': 'evidence',
  'source-note': 'evidence',
  'system-rail': 'utility',
  'table-with-commentary': 'evidence',
  'value-chain': 'evidence',
  'value-chain-connector': 'utility',
  'waterfall-chart': 'evidence',
  'workflow-rail': 'evidence'
};

const COMPONENT_RENDER_PATH_KINDS = Object.assign({}, COMPONENT_RENDER_KIND_DEFAULTS, COMPONENT_RENDER_KIND_OVERRIDES);

const NATIVE_EVIDENCE_COMPONENT_IDS = new Set(
  Object.entries(COMPONENT_RENDER_PATH_OVERRIDES)
    .filter(([id, paths]) => paths.includes('native') && COMPONENT_RENDER_PATH_KINDS[id] === 'evidence')
    .map(([id]) => id)
);

function componentRenderPathsFor(id = '') {
  return COMPONENT_RENDER_PATHS[normalizeComponentId(id)] || [];
}

function componentHasRenderPath(id = '', path = '') {
  const paths = componentRenderPathsFor(id);
  return path ? paths.includes(path) : paths.length > 0;
}

function componentRenderKindFor(id = '') {
  return COMPONENT_RENDER_PATH_KINDS[normalizeComponentId(id)] || '';
}

function componentRenderPathIssues(id = '') {
  const key = normalizeComponentId(id);
  const paths = componentRenderPathsFor(key);
  const kind = componentRenderKindFor(key);
  const issues = [];
  if (!paths.length) {
    issues.push(`${id} has no component render path`);
    return issues;
  }
  if (!kind) {
    issues.push(`${id} has no component render kind`);
  } else if (!VALID_COMPONENT_RENDER_KINDS.has(kind)) {
    issues.push(`${id} render kind ${kind} is not one of evidence, chrome, utility`);
  }
  paths.forEach(path => {
    if (!VALID_COMPONENT_RENDER_PATHS.has(path)) {
      issues.push(`${id} render path ${path} is not one of native, overlay, suppressed-by-policy`);
    }
  });
  if (new Set(paths).size !== paths.length) {
    issues.push(`${id} render paths must not contain duplicates`);
  }
  return issues;
}

module.exports = {
  COMPONENT_RENDER_PATH_KINDS,
  COMPONENT_RENDER_PATHS,
  NATIVE_EVIDENCE_COMPONENT_IDS,
  VALID_COMPONENT_RENDER_KINDS,
  VALID_COMPONENT_RENDER_PATHS,
  componentHasRenderPath,
  componentRenderKindFor,
  componentRenderPathIssues,
  componentRenderPathsFor
};
