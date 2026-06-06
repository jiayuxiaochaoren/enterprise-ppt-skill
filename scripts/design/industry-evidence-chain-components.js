function hasStructuredField(s = {}, fields = []) {
  return fields.some(field => {
    const value = s[field];
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return value != null && String(value).trim() !== '';
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
  if (id === 'source-note') return evidenceChain.hasSourceEvidence;
  if (id === 'disclosure-footnote') return evidenceChain.hasSourceEvidence || hasStructuredField(slide, ['disclosure', 'assumptions']);
  if (id === 'caption-bar') return evidenceChain.hasCaptionEvidence || hasImages;
  if (id === 'hero-image') return hasImages || ['cover', 'cover-dark'].includes(type);
  if (id === 'proof-gallery') return hasImages || Array.isArray(slide.cards) || Array.isArray(slide.items);
  if (id === 'product-matrix') return productProofSignal;
  if (id === 'kpi-strip') return hasMetrics || ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type);
  if (id === 'quality-scorecard') return hasMetrics || hasStructuredField(slide, ['qualityScorecard', 'oee', 'oeeComponents']);
  if (id === 'adoption-funnel') return hasStructuredField(slide, ['adoptionFunnel', 'activationFunnel', 'cohortFunnel']) || /adoption-funnel/i.test(String(slide.layoutVariant || slide.variant || slide.proofObject || slide.proof_object || ''));
  if (id === 'risk-register') return hasRows || hasStructuredField(slide, ['riskRegister', 'riskMatrix', 'matrix']);
  if (id === 'governance-table') return hasRows || hasStructuredField(slide, ['responsibilities', 'owners', 'portfolio']);
  if (id === 'value-chain') return hasArchitecture || hasFlow || hasStructuredField(slide, ['drivers', 'actions', 'outcomes', 'bridge', 'portfolio']);
  if (id === 'workflow-rail') return hasFlow || hasArchitecture || hasStructuredField(slide, ['workflow', 'automationWorkflow']);
  if (id === 'patient-journey-band') return hasStructuredField(slide, ['journeyMap', 'serviceBlueprint', 'touchpoints', 'phases', 'metrics']);
  if (id === 'service-blueprint-lane') return hasStructuredField(slide, ['serviceBlueprint', 'touchpoints', 'journeyMap', 'handoffs', 'qualityHandoff']);
  if (id === 'prototype-frame') return hasImages || hasStructuredField(slide, ['prototype', 'prototypeFlow', 'visual']);
  if (id === 'permission-audit-tag') return hasRows || hasStructuredField(slide, ['permissionGovernance', 'permissions', 'auditLog', 'risks']);
  if (id === 'equipment-nameplate') return hasArchitecture || hasImages || hasStructuredField(slide, ['equipment', 'productionLine', 'topology', 'oee', 'metrics']);
  if (id === 'inspection-matrix') return hasFlow || hasRows || hasStructuredField(slide, ['inspectionMatrix', 'inspectionRecords', 'qualityHandoff']);
  if (id === 'site-evidence-frame') return hasImages || hasStructuredField(slide, ['siteEvidence', 'assetReadout', 'visual']);
  return true;
}

module.exports = {
  hasStructuredField,
  industryChainComponentAllowed
};
