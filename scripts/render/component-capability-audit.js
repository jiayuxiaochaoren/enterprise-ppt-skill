const { COMPONENT_MANIFEST_VERSION } = require('./component-capability-data');
const { normalizeComponentId } = require('./component-capability-normalization');

function auditComponentManifest(manifest = {}, defaults = {}) {
  const capabilities = manifest.capabilities || defaults.capabilities || {};
  const aliases = manifest.aliases || defaults.aliases || {};
  const findings = [];
  Object.entries(capabilities).forEach(([id, capability]) => {
    if (id !== normalizeComponentId(id)) {
      findings.push({ level:'fail', type:'componentIdNotCanonical', message:`component id is not canonical kebab-case: ${id}` });
    }
    const modes = capability.supportedModes || [];
    if (!Array.isArray(modes) || !modes.length) {
      findings.push({ level:'fail', type:'componentSupportedModesMissing', message:`component ${id} must declare supportedModes` });
    }
    modes.forEach(mode => {
      if (!['native', 'overlay'].includes(mode)) {
        findings.push({ level:'fail', type:'componentSupportedModeInvalid', message:`component ${id} uses unsupported mode ${mode}` });
      }
    });
    if (!capability.ownershipPolicy || !capability.overlayPolicy || !capability.repairPolicy) {
      findings.push({ level:'fail', type:'componentPolicyMissing', message:`component ${id} must declare ownership, overlay, and repair policy` });
    }
  });
  Object.entries(aliases).forEach(([alias, target]) => {
    if (alias !== normalizeComponentId(alias)) {
      findings.push({ level:'fail', type:'componentAliasNotCanonical', message:`component alias is not canonical kebab-case: ${alias}` });
    }
    if (!capabilities[target]) {
      findings.push({ level:'fail', type:'componentAliasTargetMissing', message:`component alias ${alias} points to unknown component ${target}` });
    }
    if (aliases[target] && aliases[target] !== target) {
      findings.push({ level:'fail', type:'componentAliasChainInvalid', message:`component alias ${alias} points to another alias ${target}` });
    }
  });
  return {
    version:'component-capability-manifest-audit/v1',
    manifestVersion: COMPONENT_MANIFEST_VERSION,
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    componentCount: Object.keys(capabilities).length,
    aliasCount: Object.keys(aliases).length,
    findings
  };
}

module.exports = {
  auditComponentManifest
};
