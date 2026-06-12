const {
  createIndustryPolicyHelpers
} = require('./design-system-policy');
const {
  createVisualMediaHelpers
} = require('./visual-media');
const {
  createCoreRuntimeAssembly
} = require('./design-system-core-runtime-assembly');

function createDesignSystemCoreRuntime(deps = {}) {
  const {
    assetDir,
    assetRoleNeedsImage,
    compactUnique,
    flattenText,
    industryDesignDialects,
    mediaAssets,
    normalizeAssetRole,
    visualIndustryId,
    visualRouter,
    visualSystem
  } = deps;

  let slideRole;
  const {
    dialectColorCarriersFor,
    dialectComponentsFor,
    industryDesignDialect,
    industryVisualPolicy
  } = createIndustryPolicyHelpers({
    compactUnique,
    flattenText,
    getSlideRole: slide => slideRole(slide),
    industryDesignDialects,
    visualIndustryId,
    visualRouter
  });

  const visualMedia = createVisualMediaHelpers({
    assetDir,
    assetRoleNeedsImage,
    industryVisualPolicy,
    mediaAssets,
    normalizeAssetRole,
    visualRouter,
    visualSystem
  });
  slideRole = visualMedia.slideRole;

  const {
    accentRoleFor,
    aestheticSlideScore,
    componentPlanFor,
    compositionPlan,
    deckArtDirection,
    explicitArtValue,
    hasCommercialLogicChain,
    industryKnowledgeAudit,
    industryKnowledgeProfile,
    layoutEnergyFor,
    narrative,
    rhythmTransitionFor,
    selectPaletteName,
    semantic,
    semanticColorRolesFor,
    themeIntentFor,
    visualAestheticModel,
    visualDensityFor,
    zonePlanFor
  } = createCoreRuntimeAssembly(Object.assign({}, deps, {
    dialectColorCarriersFor,
    dialectComponentsFor,
    industryDesignDialect,
    industryVisualPolicy,
    slideRole,
    visualMedia
  }));

  return Object.assign({}, visualMedia, semantic, narrative, {
    accentRoleFor,
    aestheticSlideScore,
    componentPlanFor,
    compositionPlan,
    deckArtDirection,
    dialectColorCarriersFor,
    dialectComponentsFor,
    explicitArtValue,
    hasCommercialLogicChain,
    industryDesignDialect,
    industryKnowledgeAudit,
    industryKnowledgeProfile,
    industryVisualPolicy,
    layoutEnergyFor,
    rhythmTransitionFor,
    selectPaletteName,
    semanticColorRolesFor,
    themeIntentFor,
    visualAestheticModel,
    visualDensityFor,
    zonePlanFor
  });
}

module.exports = {
  createDesignSystemCoreRuntime
};
