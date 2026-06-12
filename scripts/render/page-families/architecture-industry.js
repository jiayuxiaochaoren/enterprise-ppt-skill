const { createPageFamilyPrimitives } = require('./primitives');
const {
  createArchitectureManufacturingTopology
} = require('./architecture-manufacturing-topology');
const {
  createArchitectureServiceBlueprint
} = require('./architecture-service-blueprint');
const {
  createArchitectureSaasCapabilityMap
} = require('./architecture-saas-capability-map');

function createArchitectureIndustryRenderers(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const architectureManufacturingTopology = createArchitectureManufacturingTopology(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const architectureServiceBlueprint = createArchitectureServiceBlueprint(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const architectureSaasCapabilityMap = createArchitectureSaasCapabilityMap(ctx, {
    drawFooter,
    drawLightPageHeader
  });

  return {
    architectureManufacturingTopology,
    architectureSaasCapabilityMap,
    architectureServiceBlueprint
  };
}

module.exports = {
  createArchitectureIndustryRenderers
};
