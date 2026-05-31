const family = 'architecture';
const {
  createArchitectureCoreRenderers
} = require('./architecture-core');
const {
  createArchitectureEnergyRenderers
} = require('./architecture-energy');
const {
  createArchitectureIndustryRenderers
} = require('./architecture-industry');

const types = [
  'architecture',
  'architecture-dark'
];

function createArchitectureRenderers(ctx = {}) {
  const {
    architectureBlueprint,
    architectureDark,
    architectureHubSpoke
  } = createArchitectureCoreRenderers(ctx);
  const {
    energyArchitecture
  } = createArchitectureEnergyRenderers(ctx);
  const {
    architectureManufacturingTopology,
    architectureSaasCapabilityMap,
    architectureServiceBlueprint
  } = createArchitectureIndustryRenderers(ctx);

  function architectureAdaptive(slide, plan, s, idx) {
    const variant = ctx.variantOf(s, 'layer-stack');
    if (variant === 'energy-topology') return energyArchitecture(slide, plan, s, idx);
    if (variant === 'service-blueprint') return architectureServiceBlueprint(slide, plan, s, idx);
    if (variant === 'platform-capability-map') return architectureSaasCapabilityMap(slide, plan, s, idx);
    if (variant === 'production-topology') return architectureManufacturingTopology(slide, plan, s, idx);
    if (variant === 'blueprint-stack') return architectureBlueprint(slide, plan, s, idx);
    if (variant === 'hub-spoke') return architectureHubSpoke(slide, plan, s, idx);
    return architectureDark(slide, plan, s, idx);
  }

  return {
    architectureAdaptive,
    architectureBlueprint,
    architectureDark,
    architectureHubSpoke,
    architectureManufacturingTopology,
    architectureSaasCapabilityMap,
    architectureServiceBlueprint,
    energyArchitecture
  };
}

function entries(renderers = {}) {
  return [
    { types:['architecture', 'architecture-dark'], render:renderers.architectureAdaptive, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createArchitectureRenderers,
  entries
};
