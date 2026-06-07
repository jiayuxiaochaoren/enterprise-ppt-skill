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
  if (id === 'source-note') return visibleSourceNotesEnabled(options.plan || {}, options) && evidenceChain.hasSourceEvidence;
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
