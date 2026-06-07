const {
  normalizeComponentId
} = require('../component-id-normalization');

const VALID_COMPONENT_RENDER_PATHS = new Set(['native', 'overlay', 'suppressed-by-policy']);

const COMPONENT_RENDER_PATHS = {
  'adoption-funnel': ['native'],
  'caption-bar': ['native', 'overlay'],
  'chart-commentary-panel': ['native', 'overlay'],
  'commentary-panel': ['native', 'overlay'],
  'content-card-grid': ['native'],
  'decision-panel': ['native'],
  'disclosure-footnote': ['native'],
  'editorial-end-card': ['native'],
  'equipment-nameplate': ['native'],
  'governance-table': ['native'],
  'hero-image': ['native', 'overlay'],
  'inspection-matrix': ['native'],
  'kpi-primary-metric': ['native'],
  'kpi-strip': ['native', 'overlay'],
  'load-curve-band': ['native'],
  'metric-strip': ['native', 'overlay'],
  'navigation-sequence': ['native'],
  'page-number': ['native'],
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
  'section-kicker': ['native'],
  'service-blueprint-lane': ['native'],
  'site-evidence-frame': ['native'],
  'source-note': ['overlay', 'suppressed-by-policy'],
  'system-rail': ['native', 'overlay'],
  'value-chain': ['native'],
  'value-chain-connector': ['native'],
  'workflow-rail': ['native']
};

const NATIVE_EVIDENCE_COMPONENT_IDS = new Set(
  Object.entries(COMPONENT_RENDER_PATHS)
    .filter(([, paths]) => paths.includes('native'))
    .map(([id]) => id)
);

function componentRenderPathsFor(id = '') {
  return COMPONENT_RENDER_PATHS[normalizeComponentId(id)] || [];
}

function componentHasRenderPath(id = '', path = '') {
  const paths = componentRenderPathsFor(id);
  return path ? paths.includes(path) : paths.length > 0;
}

function componentRenderPathIssues(id = '') {
  const paths = componentRenderPathsFor(id);
  const issues = [];
  if (!paths.length) {
    issues.push(`${id} has no component render path`);
    return issues;
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
  COMPONENT_RENDER_PATHS,
  NATIVE_EVIDENCE_COMPONENT_IDS,
  VALID_COMPONENT_RENDER_PATHS,
  componentHasRenderPath,
  componentRenderPathIssues,
  componentRenderPathsFor
};
