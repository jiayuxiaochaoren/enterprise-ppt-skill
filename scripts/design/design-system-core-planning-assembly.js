const {
  createArtDirectionHelpers
} = require('./art-direction');
const {
  createCompositionPlanningHelpers
} = require('./composition-planning');
const {
  createCompositionStrategyHelpers
} = require('./composition-strategy');
const {
  createComponentPlanHelpers
} = require('./component-planning');

function createCorePlanningAssembly(deps = {}) {
  const {
    chartSpecToComponentId,
    compactUnique,
    componentCapabilityFor,
    contentSignals,
    dialectColorCarriersFor,
    dialectComponentsFor,
    effectiveComponentModesFor,
    flattenText,
    hasExplicitChartSignal,
    industryDesignDialect,
    industryPackFor,
    industryVisualPolicy,
    normalizeAssetRole,
    palettes,
    proofObjectIdForSlide,
    routeChartSpec,
    slideHasChartIntent,
    visualMedia = {},
    visualSystem
  } = deps;

  const slideRole = deps.slideRole || visualMedia.slideRole;
  const {
    accentRoleFor,
    deckArtDirection,
    explicitArtValue,
    layoutEnergyFor,
    rhythmTransitionFor,
    selectPaletteName,
    semanticColorRolesFor,
    themeIntentFor,
    visualDensityFor
  } = createArtDirectionHelpers({
    compactUnique,
    contentSignals,
    flattenText,
    industryDesignDialect,
    industryVisualPolicy,
    slideRole,
    visualSystem
  });

  const {
    backgroundToneFor,
    compositionNameFor,
    imageTreatmentFor,
    microComponentsFor,
    primaryColorUseFor,
    rhythmRoleFor,
    themeCoverageFor
  } = createCompositionStrategyHelpers({
    accentRoleFor,
    compactUnique,
    contentSignals,
    dialectColorCarriersFor,
    dialectComponentsFor,
    explicitArtValue,
    flattenText,
    industryDesignDialect,
    normalizeAssetRole,
    palettes,
    selectPaletteName,
    slideDesign: visualMedia.slideDesign,
    slideRole,
    slideWantsImage: visualMedia.slideWantsImage,
    themeIntentFor
  });

  const {
    compositionPlan,
    zonePlanFor
  } = createCompositionPlanningHelpers({
    accentRoleFor,
    backgroundToneFor,
    compactUnique,
    compositionNameFor,
    contentSignals,
    dialectComponentsFor,
    imageTreatmentFor,
    industryDesignDialect,
    industryPackFor,
    layoutEnergyFor,
    microComponentsFor,
    primaryColorUseFor,
    rhythmRoleFor,
    rhythmTransitionFor,
    semanticColorRolesFor,
    slideDesign: visualMedia.slideDesign,
    slideRole,
    themeCoverageFor,
    themeIntentFor,
    visualDensityFor
  });

  const {
    componentPlanFor
  } = createComponentPlanHelpers({
    chartSpecToComponentId,
    compactUnique,
    componentCapabilityFor,
    contentSignals,
    dialectComponentsFor,
    effectiveComponentModesFor,
    flattenText,
    hasExplicitChartSignal,
    industryDesignDialect,
    industryPackFor,
    proofObjectIdForSlide,
    routeChartSpec,
    slideHasChartIntent,
    themeIntentFor
  });

  return {
    accentRoleFor,
    componentPlanFor,
    compositionPlan,
    deckArtDirection,
    explicitArtValue,
    layoutEnergyFor,
    rhythmTransitionFor,
    selectPaletteName,
    semanticColorRolesFor,
    slideRole,
    themeIntentFor,
    visualDensityFor,
    zonePlanFor
  };
}

module.exports = {
  createCorePlanningAssembly
};
