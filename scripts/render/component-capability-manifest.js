const {
  CAPABILITY_ROWS,
  CHART_COMPONENT_ID_LIST,
  COMPONENT_ALIASES,
  COMPONENT_DATA_REQUIREMENTS,
  COMPONENT_MANIFEST_VERSION
} = require('./component-capability-data');
const { auditComponentManifest } = require('./component-capability-audit');
const { normalizeComponentId } = require('./component-capability-normalization');
const {
  componentRenderPathsFor
} = require('./component-render-path-registry');

function capabilityFromRow(row = []) {
  const [id, supportedModes, family] = row;
  const overlayCapable = supportedModes.includes('overlay');
  return {
    id,
    aliases: Object.entries(COMPONENT_ALIASES).filter(([, target]) => target === id).map(([alias]) => alias),
    supportedModes,
    family,
    ownershipPolicy: overlayCapable ? 'native-or-overlay' : 'native-only',
    nativePolicy: supportedModes.includes('native') ? 'allowed' : 'disallowed',
    overlayPolicy: overlayCapable ? 'declared-safe-slot-required' : 'blocked',
    repairPolicy: 'no-unplanned-repair',
    dataRequirements: COMPONENT_DATA_REQUIREMENTS[id] || []
  };
}

const COMPONENT_CAPABILITIES = Object.fromEntries(
  CAPABILITY_ROWS.map(row => [row[0], capabilityFromRow(row)])
);

const CHART_COMPONENT_IDS = new Set(CHART_COMPONENT_ID_LIST);
const OVERLAY_PRONE_COMPONENT_IDS = Object.keys(COMPONENT_CAPABILITIES)
  .filter(id => (COMPONENT_CAPABILITIES[id].supportedModes || []).includes('overlay'));

function componentAliasTargetFor(id = '') {
  return COMPONENT_ALIASES[normalizeComponentId(id)] || '';
}

function canonicalComponentId(id = '', opts = {}) {
  const key = normalizeComponentId(id);
  const aliasTarget = componentAliasTargetFor(key);
  if (opts.preferAlias && aliasTarget) return aliasTarget;
  if (COMPONENT_CAPABILITIES[key]) return key;
  return aliasTarget || key;
}

function isComponentAlias(id = '') {
  const key = normalizeComponentId(id);
  return Boolean(COMPONENT_ALIASES[key] && !COMPONENT_CAPABILITIES[key]);
}

function componentCapabilityFor(id = '') {
  const key = normalizeComponentId(id);
  return COMPONENT_CAPABILITIES[key] || COMPONENT_CAPABILITIES[COMPONENT_ALIASES[key]] || null;
}

function effectiveComponentModesFor(id = '') {
  const capability = componentCapabilityFor(id);
  const capabilityModes = capability && Array.isArray(capability.supportedModes) ? capability.supportedModes : [];
  const renderModes = componentRenderPathsFor(id).filter(mode => mode === 'native' || mode === 'overlay');
  if (!renderModes.length) return capabilityModes;
  if (!capabilityModes.length) return renderModes;
  return capabilityModes.filter(mode => renderModes.includes(mode));
}

function hasComponentCapability(id = '') {
  return Boolean(componentCapabilityFor(id));
}

function componentManifestAudit(manifest = {}) {
  return auditComponentManifest(manifest, {
    aliases: COMPONENT_ALIASES,
    capabilities: COMPONENT_CAPABILITIES
  });
}

module.exports = {
  CAPABILITY_ROWS,
  CHART_COMPONENT_ID_LIST,
  CHART_COMPONENT_IDS,
  COMPONENT_ALIASES,
  COMPONENT_CAPABILITIES,
  COMPONENT_DATA_REQUIREMENTS,
  COMPONENT_MANIFEST_VERSION,
  OVERLAY_PRONE_COMPONENT_IDS,
  canonicalComponentId,
  componentAliasTargetFor,
  componentCapabilityFor,
  componentManifestAudit,
  effectiveComponentModesFor,
  hasComponentCapability,
  isComponentAlias,
  normalizeComponentId
};
