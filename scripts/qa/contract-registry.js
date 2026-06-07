const {
  MATRIX_VERSION,
  QUALITY_SEVERITY_MATRIX
} = require('./quality-severity-matrix');

const RENDER_META_SCHEMA_CONTRACT = {
  version: 'render-meta-schema-contract/v1',
  schema: 'render-meta/v1',
  slideArrays: [
    'plannedComponents',
    'unknownComponents',
    'drawnComponents',
    'consumedComponents',
    'missingRequiredComponents',
    'textBoxes'
  ],
  rendererMatchFields: [
    'requestedType',
    'matchedType',
    'matchKind',
    'rendererId',
    'rendererName',
    'source'
  ],
  renderRouteFields: [
    'version',
    'family',
    'requestedType',
    'renderer',
    'componentPlan',
    'assetPolicy'
  ],
  plannedComponentFields: [
    'id',
    'allowedModes',
    'slotPolicy',
    'repairPolicy',
    'priority'
  ],
  drawnComponentFields: [
    'id',
    'nativeSlot',
    'bbox',
    'rendererMethod'
  ],
  consumedNativeEvidenceFields: [
    'nativeSlot',
    'bbox',
    'rendererMethod'
  ],
  assetDecisionFields: [
    'status',
    'mode',
    'action',
    'reason',
    'riskLevel',
    'originalRole',
    'resolvedRole',
    'authorizationStatus',
    'authorizationStatusNormalized',
    'provenanceClass',
    'proofEligibility',
    'boundAssetCount'
  ],
  allowedRendererMatchKinds: [
    'exact',
    'alias',
    'fallback',
    'industry-override'
  ]
};

const HARDENING_CONTRACT_EVIDENCE = Object.freeze([
  {
    id: 'asset-facade',
    label: 'Asset facade',
    supportKind: 'facade',
    facadeFiles: ['scripts/assets/resolution-facade.js'],
    ruleModuleFiles: ['scripts/assets/decision-gate.js', 'scripts/assets/prompt-planner.js', 'scripts/assets/binder.js'],
    fixtureTests: ['scripts/test_asset_decision_gate.js']
  },
  {
    id: 'render-route',
    label: 'renderRoute',
    supportKind: 'rule module',
    ruleModuleFiles: ['scripts/render/render-route.js'],
    runnerFiles: ['scripts/generate_pptx.js'],
    fixtureTests: ['scripts/test_routing.js', 'scripts/test_render_meta_schema.js']
  },
  {
    id: 'schema-registry',
    label: 'Schema registry',
    supportKind: 'registry',
    registryFiles: ['scripts/qa/contract-registry.js'],
    ruleModuleFiles: ['scripts/qa/render-meta-schema-rules.js', 'scripts/qa/render-meta-schema-audit.js'],
    fixtureTests: ['scripts/test_render_meta_schema.js', 'scripts/test_render_meta_audits.js']
  },
  {
    id: 'visual-qa-runner',
    label: 'Visual QA runner',
    supportKind: 'runner',
    facadeFiles: ['scripts/visual_qa.js'],
    runnerFiles: ['scripts/qa/visual-qa-runner.js'],
    ruleModuleFiles: ['scripts/qa/visual-qa-cli.js'],
    fixtureTests: ['scripts/test_visual_qa_baseline.js', 'scripts/test_visual_qa_render_counts.js']
  },
  {
    id: 'text-policy',
    label: 'Text policy',
    supportKind: 'rule module',
    ruleModuleFiles: ['scripts/render/text-meta.js', 'scripts/render/text-readability-policy.js', 'scripts/render/text-box-meta.js'],
    fixtureTests: ['scripts/test_typography_system.js', 'scripts/test_visual_qa_content_coverage.js']
  },
  {
    id: 'region-contract',
    label: 'Region contract',
    supportKind: 'registry',
    registryFiles: ['scripts/qa/visual-region-contract.js'],
    ruleModuleFiles: ['scripts/qa/screenshot-baseline-region-rules.js', 'scripts/qa/visual-slide-regions.js'],
    fixtureTests: ['scripts/test_visual_qa_baseline.js', 'scripts/test_visual_qa_content_coverage.js']
  }
]);

function severityMatrixRows() {
  return Object.keys(QUALITY_SEVERITY_MATRIX).sort().map(type => {
    const entry = QUALITY_SEVERITY_MATRIX[type];
    return {
      type,
      category: entry.category,
      draft: entry.levels.draft || 'review',
      formal: entry.levels.formal || entry.levels.draft || 'review',
      delivery: entry.levels.delivery || entry.levels.formal || entry.levels.draft || 'review',
      reason: entry.reason,
      source: entry.source
    };
  });
}

module.exports = {
  HARDENING_CONTRACT_EVIDENCE,
  MATRIX_VERSION,
  QUALITY_SEVERITY_MATRIX,
  RENDER_META_SCHEMA_CONTRACT,
  severityMatrixRows
};
