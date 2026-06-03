const {
  assertRendererContext
} = require('../renderer-context');
const {
  createArchitectureBlueprintRenderer
} = require('./architecture-blueprint');
const {
  createArchitectureDarkRenderer
} = require('./architecture-dark');
const {
  createArchitectureHubSpokeRenderer
} = require('./architecture-hub-spoke');
const { createPageFamilyPrimitives } = require('./primitives');

function createArchitectureCoreRenderers(ctx = {}) {
  assertRendererContext(ctx, ['architectureCore'], { label:'architecture core renderer context' });
  const { drawDarkPageHeader, drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const architectureDark = createArchitectureDarkRenderer(ctx);
  const architectureBlueprint = createArchitectureBlueprintRenderer(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const architectureHubSpoke = createArchitectureHubSpokeRenderer(ctx, {
    drawDarkPageHeader,
    drawFooter
  });

  return {
    architectureBlueprint,
    architectureDark,
    architectureHubSpoke
  };
}

module.exports = {
  createArchitectureCoreRenderers
};
