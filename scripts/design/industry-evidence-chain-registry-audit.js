const {
  COMPONENT_EVIDENCE_CONTRACTS
} = require('./component-evidence-contracts');
const {
  coveragePolicyShapeIssues,
  normalizeStageCoveragePolicy
} = require('./industry-evidence-coverage');
const INDUSTRY_EVIDENCE_CHAINS = require('./industry-evidence-chain-definitions');
const {
  componentCapabilityFor
} = require('../render/component-capability-manifest');
const {
  componentHasRenderPath,
  componentRenderKindFor,
  componentRenderPathIssues
} = require('../render/component-render-path-registry');

function addFinding(findings, level, type, message, meta = {}) {
  findings.push(Object.assign({ level, type, message }, meta));
}

function auditStageCoveragePolicy(findings, chainId, stage = {}) {
  const rawPolicy = stage.coveragePolicy || stage.coverage_policy || stage.coverage;
  if (!rawPolicy) {
    addFinding(findings, 'fail', 'industryStageCoveragePolicyMissing', `${chainId}/${stage.id || 'unknown'} must declare coveragePolicy`, { chainId, stageId:stage.id || '' });
    return;
  }
  coveragePolicyShapeIssues(rawPolicy).forEach(issue => {
    addFinding(findings, 'fail', 'industryStageCoveragePolicyInvalid', `${chainId}/${stage.id || 'unknown'} ${issue}`, { chainId, stageId:stage.id || '' });
  });
  const stageComponents = new Set(stage.components || []);
  const policy = normalizeStageCoveragePolicy(stage);
  const bucketEntries = [
    ...((policy.requiredAll || []).map(id => [id, 'requiredAll'])),
    ...((policy.requiredWhenVisible || []).map(id => [id, 'requiredWhenVisible'])),
    ...((policy.requiredAny || []).map(id => [id, 'requiredAny'])),
    ...((policy.optional || []).map(id => [id, 'optional']))
  ];
  const policyComponents = new Set(bucketEntries.map(([id]) => id));
  const rolesByComponent = bucketEntries.reduce((out, [id, role]) => {
    out[id] = out[id] || [];
    out[id].push(role);
    return out;
  }, {});
  policyComponents.forEach(id => {
    if (!stageComponents.has(id)) {
      addFinding(findings, 'fail', 'industryStageCoveragePolicyComponentUnknown', `${chainId}/${stage.id || 'unknown'} coveragePolicy references ${id} outside stage.components`, { chainId, stageId:stage.id || '', componentId:id });
    }
  });
  stageComponents.forEach(id => {
    if (!policyComponents.has(id)) {
      addFinding(findings, 'fail', 'industryStageCoveragePolicyComponentUnclassified', `${chainId}/${stage.id || 'unknown'} component ${id} is not classified by coveragePolicy`, { chainId, stageId:stage.id || '', componentId:id });
    }
  });
  Object.entries(rolesByComponent).forEach(([id, roles]) => {
    if (new Set(roles).size !== roles.length || roles.length > 1) {
      addFinding(findings, 'fail', 'industryStageCoveragePolicyComponentDuplicated', `${chainId}/${stage.id || 'unknown'} component ${id} appears in multiple coveragePolicy buckets`, { chainId, stageId:stage.id || '', componentId:id });
    }
  });
  if (!policy.requiredAll.length && !policy.requiredAny.length && policy.minHits > 0) {
    addFinding(findings, 'fail', 'industryStageCoveragePolicyNoRequiredPath', `${chainId}/${stage.id || 'unknown'} has minHits without requiredAll or requiredAny`, { chainId, stageId:stage.id || '' });
  }
}

function auditIndustryEvidenceChainRegistry(chains = INDUSTRY_EVIDENCE_CHAINS) {
  const findings = [];
  const componentIds = new Set();
  Object.entries(chains || {}).forEach(([chainKey, chain]) => {
    if (!chain || typeof chain !== 'object') {
      addFinding(findings, 'fail', 'industryChainDefinitionInvalid', `${chainKey} must be an object`, { chainId:chainKey });
      return;
    }
    const chainId = chain.id || chainKey;
    if (chain.id !== chainKey) {
      addFinding(findings, 'fail', 'industryChainIdMismatch', `${chainKey} has mismatched id ${chain.id || 'missing'}`, { chainId:chainKey });
    }
    const stages = Array.isArray(chain.stages) ? chain.stages : [];
    const positions = stages.map(stage => stage && stage.position).filter(Boolean).sort();
    if (positions.join(',') !== '1,2,3') {
      addFinding(findings, 'fail', 'industryChainStagePositionsInvalid', `${chainId} must declare exactly stage positions 1,2,3`, { chainId });
    }
    (chain.avoidComponents || []).forEach(id => {
      if (!componentCapabilityFor(id)) {
        addFinding(findings, 'fail', 'industryAvoidComponentUnknown', `${chainId} avoidComponents references unknown component ${id}`, { chainId, componentId:id });
      }
    });
    stages.forEach(stage => {
      const stageId = stage && stage.id || '';
      if (!stageId) addFinding(findings, 'fail', 'industryStageIdMissing', `${chainId} has a stage without id`, { chainId });
      const components = Array.isArray(stage.components) ? stage.components : [];
      if (!components.length) addFinding(findings, 'fail', 'industryStageComponentsMissing', `${chainId}/${stageId || 'unknown'} must declare components`, { chainId, stageId });
      components.forEach(id => {
        componentIds.add(id);
        if (!componentCapabilityFor(id)) {
          addFinding(findings, 'fail', 'industryStageComponentUnknown', `${chainId}/${stageId || 'unknown'} references unknown component ${id}`, { chainId, stageId, componentId:id });
        }
        if (!COMPONENT_EVIDENCE_CONTRACTS[id]) {
          addFinding(findings, 'fail', 'industryStageComponentEvidenceContractMissing', `${chainId}/${stageId || 'unknown'} component ${id} has no evidence contract`, { chainId, stageId, componentId:id });
        }
        if (!componentHasRenderPath(id)) {
          addFinding(findings, 'fail', 'industryStageComponentRenderPathMissing', `${chainId}/${stageId || 'unknown'} component ${id} has no render path`, { chainId, stageId, componentId:id });
        } else {
          if (componentRenderKindFor(id) !== 'evidence') {
            addFinding(findings, 'fail', 'industryStageComponentRenderKindInvalid', `${chainId}/${stageId || 'unknown'} component ${id} render kind must be evidence`, { chainId, stageId, componentId:id });
          }
          componentRenderPathIssues(id).forEach(issue => {
            addFinding(findings, 'fail', 'industryStageComponentRenderPathInvalid', `${chainId}/${stageId || 'unknown'} ${issue}`, { chainId, stageId, componentId:id });
          });
        }
      });
      auditStageCoveragePolicy(findings, chainId, stage || {});
    });
  });
  const stageCount = Object.values(chains || {}).reduce((sum, chain) => sum + ((chain && chain.stages) || []).length, 0);
  const explicitCoveragePolicyCount = Object.values(chains || {})
    .flatMap(chain => (chain && chain.stages) || [])
    .filter(stage => stage.coveragePolicy || stage.coverage_policy || stage.coverage)
    .length;
  return {
    version: 'industry-evidence-chain-registry-audit/v1',
    status: findings.some(finding => finding.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    chainCount: Object.keys(chains || {}).length,
    stageCount,
    explicitCoveragePolicyCount,
    legacyCoveragePolicyCount: stageCount - explicitCoveragePolicyCount,
    componentCount: componentIds.size,
    findings
  };
}

module.exports = {
  auditIndustryEvidenceChainRegistry
};
