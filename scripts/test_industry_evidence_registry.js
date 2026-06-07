const assert = require('assert/strict');
const {
  auditIndustryEvidenceChainRegistry
} = require('./design/industry-evidence-chain-registry-audit');
const chains = require('./design/industry-evidence-chain-definitions');
const {
  NATIVE_EVIDENCE_COMPONENT_IDS,
  componentRenderKindFor,
  componentRenderPathsFor
} = require('./render/component-render-path-registry');
const {
  CHART_COMPONENT_ID_LIST
} = require('./render/component-capability-contracts');

const registryAudit = auditIndustryEvidenceChainRegistry();
assert.equal(registryAudit.version, 'industry-evidence-chain-registry-audit/v1');
assert.equal(registryAudit.status, 'pass', registryAudit.findings.map(finding => finding.message).join('; '));
assert.equal(registryAudit.stageCount, 27);
assert.equal(registryAudit.explicitCoveragePolicyCount, 27);
assert.equal(registryAudit.legacyCoveragePolicyCount, 0);
assert.equal(registryAudit.findings.length, 0);
assert.deepEqual(componentRenderPathsFor('source-note'), ['overlay', 'suppressed-by-policy']);
assert.deepEqual(componentRenderPathsFor('Source Note'), ['overlay', 'suppressed-by-policy']);
assert.equal(componentRenderKindFor('source-note'), 'evidence');
assert.equal(componentRenderKindFor('page-number'), 'chrome');
assert.equal(componentRenderKindFor('value-chain-connector'), 'utility');
assert.equal(componentRenderKindFor('contact-block'), 'utility');
['campaign-to-member-rail', 'launch-rhythm-strip', 'editorial-index'].forEach(id => {
  assert.deepEqual(componentRenderPathsFor(id), ['native'], `${id} should declare a native utility render path`);
  assert.equal(componentRenderKindFor(id), 'utility', `${id} should be utility render kind`);
  assert.equal(NATIVE_EVIDENCE_COMPONENT_IDS.has(id), false, `${id} should not be native evidence`);
});
assert.equal(NATIVE_EVIDENCE_COMPONENT_IDS.has('source-note'), false);
assert.equal(NATIVE_EVIDENCE_COMPONENT_IDS.has('page-number'), false);
assert.equal(NATIVE_EVIDENCE_COMPONENT_IDS.has('contact-block'), false);
assert.equal(componentRenderPathsFor('caption-bar').includes('native'), true);
assert.deepEqual(componentRenderPathsFor('value-chain'), ['native', 'overlay']);
CHART_COMPONENT_ID_LIST.forEach(id => {
  assert.deepEqual(componentRenderPathsFor(id), ['native', 'overlay'], `${id} should declare native and overlay render paths`);
  assert.equal(componentRenderKindFor(id), 'evidence', `${id} should be evidence render kind`);
  assert.equal(NATIVE_EVIDENCE_COMPONENT_IDS.has(id), true, `${id} should be part of native evidence components`);
});

const missingPolicyChains = JSON.parse(JSON.stringify(chains));
delete missingPolicyChains['energy-infrastructure'].stages[0].coveragePolicy;
const missingPolicyAudit = auditIndustryEvidenceChainRegistry(missingPolicyChains);
assert.ok(
  missingPolicyAudit.findings.some(finding => finding.type === 'industryStageCoveragePolicyMissing'),
  'definition audit should flag stages without explicit coveragePolicy'
);

const invalidPolicyChains = JSON.parse(JSON.stringify(chains));
invalidPolicyChains['energy-infrastructure'].stages[0].coveragePolicy = {
  requiredAll:'equipment-nameplate',
  minHits:-1
};
const invalidPolicyAudit = auditIndustryEvidenceChainRegistry(invalidPolicyChains);
assert.ok(
  invalidPolicyAudit.findings.some(finding => finding.type === 'industryStageCoveragePolicyInvalid' && /requiredAll/.test(finding.message)),
  'definition audit should flag malformed coveragePolicy arrays'
);
assert.ok(
  invalidPolicyAudit.findings.some(finding => finding.type === 'industryStageCoveragePolicyInvalid' && /minHits/.test(finding.message)),
  'definition audit should flag malformed coveragePolicy minHits'
);

const unknownComponentChains = JSON.parse(JSON.stringify(chains));
unknownComponentChains['energy-infrastructure'].stages[0].components.push('unknown-proof-widget');
unknownComponentChains['energy-infrastructure'].stages[0].coveragePolicy.optional.push('unknown-proof-widget');
const unknownComponentAudit = auditIndustryEvidenceChainRegistry(unknownComponentChains);
assert.ok(
  unknownComponentAudit.findings.some(finding => finding.type === 'industryStageComponentUnknown' && finding.componentId === 'unknown-proof-widget'),
  'definition audit should flag unknown stage components'
);
assert.ok(
  unknownComponentAudit.findings.some(finding => finding.type === 'industryStageComponentEvidenceContractMissing' && finding.componentId === 'unknown-proof-widget'),
  'definition audit should flag missing evidence contracts'
);
assert.ok(
  unknownComponentAudit.findings.some(finding => finding.type === 'industryStageComponentRenderPathMissing' && finding.componentId === 'unknown-proof-widget'),
  'definition audit should flag missing render paths'
);

const unclassifiedPolicyChains = JSON.parse(JSON.stringify(chains));
unclassifiedPolicyChains['energy-infrastructure'].stages[0].coveragePolicy = {
  requiredAll:['equipment-nameplate'],
  minHits:1
};
const unclassifiedPolicyAudit = auditIndustryEvidenceChainRegistry(unclassifiedPolicyChains);
assert.ok(
  unclassifiedPolicyAudit.findings.some(finding => finding.type === 'industryStageCoveragePolicyComponentUnclassified' && finding.componentId === 'site-evidence-frame'),
  'definition audit should flag stage components that are omitted from coveragePolicy buckets'
);

const invalidAvoidChains = JSON.parse(JSON.stringify(chains));
invalidAvoidChains['energy-infrastructure'].avoidComponents.push('unknown-avoid-widget');
const invalidAvoidAudit = auditIndustryEvidenceChainRegistry(invalidAvoidChains);
assert.ok(
  invalidAvoidAudit.findings.some(finding => finding.type === 'industryAvoidComponentUnknown' && finding.componentId === 'unknown-avoid-widget'),
  'definition audit should flag invalid avoidComponents entries'
);

console.log('industry evidence registry ok');
