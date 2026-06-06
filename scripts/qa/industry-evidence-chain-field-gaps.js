function componentEvidenceFieldFindings({
  hasFieldPath,
  slideNo,
  chain = {},
  slide = {},
  planned = []
} = {}) {
  const findings = [];
  const plannedSet = new Set(planned);
  const hasAny = fields => fields.some(field => hasFieldPath(slide, field));
  if (chain.chainId === 'saas-technology' && plannedSet.has('prototype-frame') && !hasAny([
    'images',
    'visual.image',
    'visual.images',
    'prototypeFlow.screenshot',
    'prototypeFlow.screen',
    'prototypeFlow.image',
    'prototypeFlow.images',
    'prototype.screenshot',
    'prototype.screen',
    'prototype.image',
    'prototype.images'
  ])) {
    findings.push({
      slide: slideNo,
      level: 'review',
      type: 'prototypeEvidenceMissing',
      message: 'SaaS prototype-frame requires real screenshot/image/prototype screen evidence; do not draw a prototype shell from workflow text alone'
    });
  }
  if (chain.chainId === 'healthcare-operations' && plannedSet.has('service-blueprint-lane') && !hasAny([
    'serviceBlueprint',
    'touchpoints',
    'handoffs',
    'qualityHandoff',
    'journeyMap'
  ])) {
    findings.push({
      slide: slideNo,
      level: 'review',
      type: 'healthcareHandoffEvidenceMissing',
      message: 'healthcare service-blueprint-lane requires service blueprint, touchpoint, handoff, or quality handoff fields'
    });
  }
  return findings;
}

module.exports = {
  componentEvidenceFieldFindings
};
