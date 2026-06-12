const {
  createPlanningAssetGenerationRuntime,
  createPlanningReferenceRecipeRuntime,
  createPlanningSlideRoutingRuntime
} = require('./design-system-planning-runtime-parts');
const {
  createPlanningNormalizationRuntime
} = require('./design-system-planning-runtime-normalization');
const {
  assetGenerationRuntimeDeps,
  normalizationRuntimeDeps,
  planningRuntimeExports,
  referenceRecipeRuntimeDeps,
  slideRoutingRuntimeDeps
} = require('./design-system-planning-runtime-deps');

function createPlanningRuntimeAssembly(deps = {}) {
  const referenceRuntime = createPlanningReferenceRecipeRuntime(referenceRecipeRuntimeDeps(deps));
  const assetRuntime = createPlanningAssetGenerationRuntime(assetGenerationRuntimeDeps(deps));
  const selectReferenceRecipe = deps.selectReferenceRecipe || referenceRuntime.selectReferenceRecipe;
  const routingRuntime = createPlanningSlideRoutingRuntime(slideRoutingRuntimeDeps(deps, {
    selectReferenceRecipe
  }));
  const normalizationRuntime = createPlanningNormalizationRuntime(normalizationRuntimeDeps(deps, {
    generatedAssetPolicy: assetRuntime.generatedAssetPolicy,
    generatedAssetPrompt: assetRuntime.generatedAssetPrompt,
    pickLayoutVariant: routingRuntime.pickLayoutVariant,
    recipeCompatibleWithSlideType: referenceRuntime.recipeCompatibleWithSlideType,
    recommendSlideType: routingRuntime.recommendSlideType,
    selectReferenceRecipe
  }));

  return planningRuntimeExports({
    assetRuntime,
    normalizationRuntime,
    referenceRuntime,
    routingRuntime,
    selectReferenceRecipe
  });
}

module.exports = {
  createPlanningRuntimeAssembly
};
