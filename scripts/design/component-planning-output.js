const {
  routeComponentCapability
} = require('./route-component-capabilities');

function enrichComponentPlanOutput({
  componentCapabilityFor,
  effectiveComponentModesFor,
  filtered = [],
  plan = {},
  signals = {},
  slide = {}
} = {}) {
  const unknownComponents = [];
  const knownComponents = filtered
    .map(component => {
      const capability = componentCapabilityFor(component.id);
      if (!capability) {
        unknownComponents.push({ id: component.id, source: component.source || '', required: component.required !== false });
        return null;
      }
      const supportedModes = typeof effectiveComponentModesFor === 'function' ? effectiveComponentModesFor(component.id) : capability.supportedModes;
      const requestedModes = component.allowedModes || component.allowed_modes || component.supportedModes;
      const allowedModes = Array.isArray(requestedModes) && requestedModes.length ? requestedModes.filter(mode => supportedModes.includes(mode)) : supportedModes;
      return Object.assign({}, component, {
        supportedModes,
        allowedModes: allowedModes.length ? allowedModes : supportedModes,
        ownershipPolicy: capability.ownershipPolicy,
        componentFamily: capability.family,
        dataRequirements: component.dataRequirements || capability.dataRequirements || [],
        routeCapability: routeComponentCapability(component.id, { component, plan, slide, signals }),
        slotPolicy: component.slotPolicy || component.slot_policy || (supportedModes.includes('overlay') ? 'declared-safe-slot-required' : 'native-evidence-required'),
        repairPolicy: component.repairPolicy || component.repair_policy || (component.required === false ? 'optional-drop-allowed' : 'no-unplanned-repair'),
        priority: component.priority || (component.required === false ? 'optional' : 'required'),
        coverageRole: component.coverageRole || component.coverage_role || '',
        coveragePolicy: component.coveragePolicy || component.coverage_policy || null
      });
    })
    .filter(Boolean);
  return { knownComponents, unknownComponents };
}

module.exports = {
  enrichComponentPlanOutput
};
