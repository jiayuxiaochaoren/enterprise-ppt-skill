const assert = require('assert/strict');
const {
  normalizeDeckPlan
} = require('./design-system');
const {
  auditIndustryEvidenceChain
} = require('./qa/industry-evidence-chain-audit');
const {
  COMPONENT_EVIDENCE_SIGNAL_RULES,
  componentHasEvidence
} = require('./design/component-evidence-contracts');

assert.equal(COMPONENT_EVIDENCE_SIGNAL_RULES['source-note'].allowFieldEvidence, false);
assert.equal(componentHasEvidence('source-note', { sourceNote:'内部来源 A' }, { plan:{ visibleSourceNotes:false } }), false);
assert.equal(componentHasEvidence('source-note', { sourceNote:'内部来源 A' }, { plan:{ visibleSourceNotes:true } }), true);
assert.equal(componentHasEvidence('hero-image', { type:'cover' }), true);
assert.equal(componentHasEvidence('kpi-strip', { type:'metric-comparison' }), true);

const badSaasPrototypeClaim = {
  industry:'saas-technology',
  slides:[{
    type:'case-gallery',
    title:'SaaS 声明 prototype 但没有截图',
    proofObject:'prototype-flow',
    prototype:{ state:'审批流原型' },
    workflow:[{ title:'审批', body:'状态回写' }]
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badSaasPrototypeClaim, normalizeDeckPlan(badSaasPrototypeClaim)).findings.some(finding => finding.type === 'prototypeEvidenceMissing'),
  'QA should flag SaaS prototype-frame without screenshot/image evidence'
);

const badHealthcareHandoffClaim = {
  industry:'healthcare-operations',
  slides:[{
    type:'architecture',
    title:'医疗声明交接但缺少交接字段',
    proofObject:'service-blueprint',
    componentHints:['service-blueprint-lane'],
    claim:'交接流程已建立。'
  }]
};
assert.ok(
  auditIndustryEvidenceChain(badHealthcareHandoffClaim, normalizeDeckPlan(badHealthcareHandoffClaim)).findings.some(finding => finding.type === 'healthcareHandoffEvidenceMissing'),
  'QA should flag healthcare service-blueprint-lane without handoff fields'
);

console.log('industry evidence component contracts ok');
