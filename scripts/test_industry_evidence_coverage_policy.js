const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  auditIndustryEvidenceChain
} = require('./qa/industry-evidence-chain-audit');
const {
  INDUSTRY_EVIDENCE_CHAINS,
  coverageStatusForComponents,
  industryEvidenceChainShapeIssues,
  normalizeStageCoveragePolicy
} = require('./design/industry-evidence-chain');

const ROOT = path.resolve(__dirname, '..');
const normalizedSamplePlan = normalizeDeckPlan(JSON.parse(fs.readFileSync(path.join(ROOT, 'examples', 'sample-deck-plan.json'), 'utf8')));
const normalizedSampleChainAudit = auditIndustryEvidenceChain(normalizedSamplePlan);
assert.equal(
  normalizedSampleChainAudit.findings.some(finding => finding.type === 'industryEvidenceComponentPartial'),
  false,
  'legacy flat stage components should be interpreted as requiredAny/minHits coverage, not all-or-nothing partial failure'
);

const legacyCoveragePolicy = normalizeStageCoveragePolicy({ components:['equipment-nameplate', 'site-evidence-frame', 'kpi-strip'] });
assert.deepEqual(legacyCoveragePolicy.requiredAny, ['equipment-nameplate', 'site-evidence-frame', 'kpi-strip']);
assert.equal(legacyCoveragePolicy.minHits, 1);
assert.equal(coverageStatusForComponents(legacyCoveragePolicy, ['equipment-nameplate']).status, 'pass');
assert.equal(coverageStatusForComponents(legacyCoveragePolicy, []).status, 'fail');

Object.values(INDUSTRY_EVIDENCE_CHAINS).forEach(chain => {
  (chain.stages || []).forEach(stage => {
    assert.ok(stage.coveragePolicy, `${chain.id}/${stage.id} should declare explicit coveragePolicy`);
    const policy = normalizeStageCoveragePolicy(stage);
    assert.equal(policy.legacyComponents.length, stage.components.length, `${chain.id}/${stage.id} should preserve legacy components for compatibility`);
    assert.equal(policy.minHits >= 0, true, `${chain.id}/${stage.id} minHits should be non-negative`);
  });
});

const broadRequiredAnyOnlyStages = [];
Object.values(INDUSTRY_EVIDENCE_CHAINS).forEach(chain => {
  (chain.stages || []).forEach(stage => {
    const policy = normalizeStageCoveragePolicy(stage);
    if (!policy.requiredAll.length && policy.requiredAny.length && policy.minHits <= 1) {
      broadRequiredAnyOnlyStages.push(`${chain.id}/${stage.id}`);
    }
  });
});
assert.deepEqual(
  broadRequiredAnyOnlyStages,
  [],
  'industry stage coveragePolicy should not rely on broad requiredAny/minHits:1 gating'
);

Object.values(INDUSTRY_EVIDENCE_CHAINS).forEach(chain => {
  (chain.stages || []).forEach(stage => {
    const policy = normalizeStageCoveragePolicy(stage);
    const legacyEquivalent = !policy.requiredAll.length &&
      !policy.optional.length &&
      policy.minHits === 1 &&
      policy.requiredAny.length === stage.components.length &&
      stage.components.every(id => policy.requiredAny.includes(id));
    assert.equal(
      legacyEquivalent,
      false,
      `${chain.id}/${stage.id} should not collapse back to legacy requiredAny/minHits:1 semantics`
    );
  });
});

{
  const malformedPolicyChain = {
    chainId:'energy-infrastructure',
    stageId:'safety-stability-claim',
    components:[],
    matchedFields:[],
    matchedProofObjects:[],
    coveragePolicy:{
      requiredAll:'equipment-nameplate',
      requiredAny:['kpi-strip', 12],
      optional:[{}],
      minHits:-1
    }
  };
  const issues = industryEvidenceChainShapeIssues(malformedPolicyChain);
  assert.ok(issues.some(issue => /coveragePolicy\.requiredAll/.test(issue)));
  assert.ok(issues.some(issue => /coveragePolicy\.requiredAny/.test(issue)));
  assert.ok(issues.some(issue => /coveragePolicy\.optional/.test(issue)));
  assert.ok(issues.some(issue => /coveragePolicy\.minHits/.test(issue)));
  const malformedPolicyAudit = auditIndustryEvidenceChain({
    industry:'energy-utility',
    slides:[{
      type:'case-gallery',
      title:'坏 coveragePolicy 不能被静默接受',
      proofObject:'site-evidence',
      siteEvidence:{ name:'A站' },
      componentPlan:{ industryEvidenceChain: malformedPolicyChain }
    }]
  });
  const invalidFinding = malformedPolicyAudit.findings.find(finding => finding.type === 'industryEvidenceChainInvalid');
  assert.ok(invalidFinding, 'malformed coveragePolicy should surface as invalid chain metadata');
  assert.match(invalidFinding.message, /coveragePolicy\.requiredAll/);
  assert.match(invalidFinding.message, /coveragePolicy\.minHits/);
}

{
  const energyStage = INDUSTRY_EVIDENCE_CHAINS['energy-infrastructure'].stages.find(stage => stage.id === 'safety-stability-claim');
  const originalCoveragePolicy = energyStage.coveragePolicy;
  try {
    energyStage.coveragePolicy = {
      requiredAll:['equipment-nameplate'],
      requiredAny:['site-evidence-frame', 'kpi-strip'],
      optional:['proof-gallery'],
      minHits:2
    };
    const coveragePlan = {
      industry:'energy-utility',
      slides:[{
        type:'case-gallery',
        title:'电站安全稳定证据',
        proofObject:'site-evidence',
        siteEvidence:{ name:'A站' },
        componentPlan:{ componentIds:['site-evidence-frame'], components:[{ id:'site-evidence-frame' }] }
      }]
    };
    const requiredAllAudit = auditIndustryEvidenceChain(coveragePlan, coveragePlan);
    assert.ok(
      requiredAllAudit.findings.some(finding => finding.type === 'industryEvidenceRequiredComponentMissing'),
      'coverage policy should fail when requiredAll components are missing'
    );
    assert.ok(
      requiredAllAudit.findings.some(finding => finding.type === 'industryEvidenceCoverageBelowMinimum'),
      'coverage policy should fail when minHits is not satisfied'
    );
    const requiredAnyPlan = JSON.parse(JSON.stringify(coveragePlan));
    requiredAnyPlan.slides[0].componentPlan = { componentIds:['equipment-nameplate'], components:[{ id:'equipment-nameplate' }] };
    const requiredAnyAudit = auditIndustryEvidenceChain(requiredAnyPlan, requiredAnyPlan);
    assert.ok(
      requiredAnyAudit.findings.some(finding => finding.type === 'industryEvidenceRequiredAnyMissing'),
      'coverage policy should fail when requiredAny has no hits'
    );
  } finally {
    energyStage.coveragePolicy = originalCoveragePolicy;
  }
}

console.log('industry evidence coverage policy ok');
