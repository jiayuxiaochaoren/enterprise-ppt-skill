const {
  componentHasEvidence
} = require('../design/component-evidence-contracts');

function componentEvidenceFieldFindings({
  slideNo,
  chain = {},
  slide = {},
  planned = []
} = {}) {
  const findings = [];
  const plannedSet = new Set(planned);
  if (chain.chainId === 'saas-technology' && plannedSet.has('prototype-frame') && !componentHasEvidence('prototype-frame', slide, { strict:true })) {
    findings.push({
      slide: slideNo,
      level: 'review',
      type: 'prototypeEvidenceMissing',
      message: 'SaaS prototype-frame requires real screenshot/image/prototype screen evidence; do not draw a prototype shell from workflow text alone'
    });
  }
  if (chain.chainId === 'healthcare-operations' && plannedSet.has('service-blueprint-lane') && !componentHasEvidence('service-blueprint-lane', slide)) {
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
