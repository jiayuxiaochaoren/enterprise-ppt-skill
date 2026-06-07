const {
  hasSourceEvidence,
  visibleSourceNotesEnabled
} = require('./source-evidence');

function hasValue(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return String(value).trim() !== '';
}

function hasFieldPath(source = {}, path = '') {
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length) return false;
  let current = source;
  for (const part of parts) {
    if (Array.isArray(current)) {
      current = current.map(item => item && item[part]).filter(hasValue);
      if (!current.length) return false;
      continue;
    }
    if (!current || typeof current !== 'object' || !hasValue(current[part])) return false;
    current = current[part];
  }
  return hasValue(current);
}

const IMAGE_FIELDS = ['image', 'images', 'visual.image', 'visual.images'];
const STRUCTURED_SOURCE_FIELDS = [
  'sourceTrace.sourceIds',
  'sourceTrace.source_ids',
  'sourceTrace.sources',
  'sourceTrace.metricSources',
  'proof.sourceTrace.sourceIds',
  'proof.sourceTrace.source_ids',
  'proof.sourceTrace.sources'
];
const VISIBLE_SOURCE_FIELDS = ['sourceNote', 'source_note', 'proof.sourceNote', 'proof.source'];

const COMPONENT_EVIDENCE_CONTRACTS = {
  'adoption-funnel': ['adoptionFunnel', 'activationFunnel', 'cohortFunnel', 'funnel', 'metrics'],
  'bar-chart': ['chartSpec', 'metrics', 'rows', 'series'],
  'caption-bar': [...IMAGE_FIELDS, ...STRUCTURED_SOURCE_FIELDS, 'caption', 'subtitle', 'claim', 'visual.caption', 'proof.explanation'],
  'chart-commentary-panel': ['claim', 'subtitle', 'note', 'businessLogic'],
  'commentary-panel': ['claim', 'note', 'businessLogic', 'decision'],
  'content-card-grid': ['cards', 'items', 'modules', 'values', 'sections'],
  'disclosure-footnote': [...VISIBLE_SOURCE_FIELDS, ...STRUCTURED_SOURCE_FIELDS, 'disclosure', 'assumptions'],
  'equipment-nameplate': ['equipment', 'equipmentNameplate', 'productionLine', 'topology', 'layers', 'metrics', ...STRUCTURED_SOURCE_FIELDS],
  'funnel-chart': ['chartSpec', 'funnel', 'steps'],
  'governance-table': ['rows', 'risks', 'controls', 'responsibilities', 'owners', 'governance', 'responsibilityLoop', 'portfolio'],
  'heatmap-chart': ['chartSpec', 'matrix', 'rows'],
  'hero-image': [...IMAGE_FIELDS, 'visual.mode', 'product'],
  'information-gap': ['chartSpec.informationGap', 'informationGap'],
  'inspection-matrix': ['inspectionMatrix', 'inspectionRecords', 'rows', 'controls', 'phases', 'steps', 'qualityHandoff'],
  'kpi-primary-metric': ['metrics'],
  'kpi-strip': ['metrics'],
  'line-chart': ['chartSpec', 'monthlyPulse', 'monthlyTrend', 'trend'],
  'matrix-chart': ['chartSpec', 'matrix', 'rows'],
  'navigation-sequence': ['items', 'sections'],
  'pareto-chart': ['chartSpec', 'pareto', 'rows'],
  'patient-journey-band': ['journeyMap', 'patientJourney', 'serviceBlueprint', 'touchpoints', 'handoffs', 'phases', 'metrics'],
  'permission-audit-tag': ['permissionGovernance', 'permissions', 'auditLog', 'risks', 'rows'],
  'process-rail': ['phases', 'actions', 'steps', 'timeline', 'milestones', 'loopItems', 'workflows'],
  'product-matrix': ['product', 'products', 'productStory', 'cards', ...IMAGE_FIELDS, ...STRUCTURED_SOURCE_FIELDS],
  'proof-gallery': [...IMAGE_FIELDS, 'cards', 'items', ...STRUCTURED_SOURCE_FIELDS],
  'proof-gallery-grid': [...IMAGE_FIELDS, 'cards', 'items', ...STRUCTURED_SOURCE_FIELDS],
  'prototype-frame': [
    ...IMAGE_FIELDS,
    'prototype',
    'prototypeFlow',
    'prototypeFlow.screenshot',
    'prototypeFlow.screen',
    'prototypeFlow.image',
    'prototypeFlow.images',
    'prototype.screenshot',
    'prototype.screen',
    'prototype.image',
    'prototype.images'
  ],
  'quality-scorecard': ['metrics', 'qualityScorecard', 'oee', 'oeeComponents', ...STRUCTURED_SOURCE_FIELDS],
  'risk-matrix': ['matrix', 'rows', 'risks', 'controls', 'riskRegister', 'riskMatrix'],
  'risk-register': ['rows', 'risks', 'controls', 'riskRegister', 'riskMatrix', 'matrix'],
  'scorecard': ['chartSpec', 'metrics'],
  'service-blueprint-lane': ['serviceBlueprint', 'touchpoints', 'journeyMap', 'handoffs', 'qualityHandoff'],
  'site-evidence-frame': ['siteEvidence', 'assetReadout', ...IMAGE_FIELDS, 'visual'],
  'source-note': [...VISIBLE_SOURCE_FIELDS, ...STRUCTURED_SOURCE_FIELDS],
  'system-rail': ['layers', 'architecture', 'systemMap', 'topology', 'capabilityMap', 'platformCapabilities', 'valueChain', 'capitals'],
  'table-with-commentary': ['rows', 'headers', 'table'],
  'value-chain': ['drivers', 'actions', 'outcomes', 'valueChain', 'layers', 'capitals', 'bridge', 'portfolio', 'phases', 'steps', 'timeline', 'milestones', 'touchpoints'],
  'waterfall-chart': ['chartSpec', 'bridge', 'waterfallBridge', 'targetBridge'],
  'workflow-rail': ['workflow', 'workflows', 'automationWorkflow', 'steps', 'phases', 'platformCapabilities', 'prototypeFlow']
};

const COMPONENT_STRICT_EVIDENCE_CONTRACTS = {
  'prototype-frame': [
    ...IMAGE_FIELDS,
    'prototypeFlow.screenshot',
    'prototypeFlow.screen',
    'prototypeFlow.image',
    'prototypeFlow.images',
    'prototype.screenshot',
    'prototype.screen',
    'prototype.image',
    'prototype.images'
  ]
};

const COMPONENT_DATA_REQUIREMENTS = Object.fromEntries(
  Object.entries(COMPONENT_EVIDENCE_CONTRACTS).map(([id, fields]) => [id, [fields.join('|')]])
);

const COMPONENT_EVIDENCE_SIGNAL_RULES = {
  'source-note': {
    allowFieldEvidence: false,
    requiresVisibleSource: true,
    sourceEvidence: true
  },
  'disclosure-footnote': {
    sourceEvidence: true
  },
  'caption-bar': {
    optionSignals: ['hasCaptionEvidence', 'hasImages']
  },
  'hero-image': {
    optionSignals: ['hasImages'],
    typeMatches: ['cover', 'cover-dark']
  },
  'product-matrix': {
    optionSignals: ['productProofSignal']
  },
  'kpi-primary-metric': {
    optionSignals: ['hasMetrics'],
    typeMatches: ['metric-comparison', 'industry-chart', 'finance-bridge']
  },
  'kpi-strip': {
    optionSignals: ['hasMetrics'],
    typeMatches: ['metric-comparison', 'industry-chart', 'finance-bridge']
  }
};

function componentEvidenceFieldsFor(id = '') {
  return COMPONENT_EVIDENCE_CONTRACTS[id] || [...IMAGE_FIELDS, ...STRUCTURED_SOURCE_FIELDS];
}

function componentEvidenceFieldsForMode(id = '', opts = {}) {
  if (opts.strict && COMPONENT_STRICT_EVIDENCE_CONTRACTS[id]) return COMPONENT_STRICT_EVIDENCE_CONTRACTS[id];
  return componentEvidenceFieldsFor(id);
}

function componentHasFieldEvidence(id = '', slide = {}, opts = {}) {
  return componentEvidenceFieldsForMode(id, opts).some(field => hasFieldPath(slide, field));
}

function componentHasSignalEvidence(rule = {}, slide = {}, options = {}) {
  if (rule.requiresVisibleSource && !visibleSourceNotesEnabled(options.plan || {}, options)) return false;
  if (rule.sourceEvidence && hasSourceEvidence(slide)) return true;
  if ((rule.optionSignals || []).some(flag => Boolean(options[flag]))) return true;
  const slideType = String(options.type || slide.type || '');
  if ((rule.typeMatches || []).includes(slideType)) return true;
  return false;
}

function componentHasEvidence(id = '', slide = {}, options = {}) {
  const rule = COMPONENT_EVIDENCE_SIGNAL_RULES[id] || {};
  if (rule.requiresVisibleSource && !visibleSourceNotesEnabled(options.plan || {}, options)) return false;
  if (componentHasSignalEvidence(rule, slide, options)) return true;
  if (rule.allowFieldEvidence === false) return false;
  return componentHasFieldEvidence(id, slide, options);
}

module.exports = {
  COMPONENT_DATA_REQUIREMENTS,
  COMPONENT_EVIDENCE_CONTRACTS,
  COMPONENT_EVIDENCE_SIGNAL_RULES,
  COMPONENT_STRICT_EVIDENCE_CONTRACTS,
  IMAGE_FIELDS,
  STRUCTURED_SOURCE_FIELDS,
  VISIBLE_SOURCE_FIELDS,
  componentEvidenceFieldsFor,
  componentEvidenceFieldsForMode,
  componentHasEvidence,
  componentHasFieldEvidence,
  componentHasSignalEvidence,
  hasFieldPath,
  hasValue
};
