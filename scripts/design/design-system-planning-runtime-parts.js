const {
  createAssetGenerationHelpers
} = require('./asset-generation');
const {
  createReferenceRecipeHelpers
} = require('./reference-recipes');
const {
  createSlideRoutingHelpers
} = require('./slide-routing');

function createPlanningReferenceRecipeRuntime(deps = {}) {
  const {
    compactUnique,
    contentSignals,
    flattenText,
    highValuePageFamilies,
    industryMatchIds,
    priorityPageFamilyRecipes,
    referenceLayoutLibrary,
    referenceRecipeLibrary,
    slideRole,
    textKeywords,
    themeIntentFor
  } = deps;
  return createReferenceRecipeHelpers({
    compactUnique,
    contentSignals,
    flattenText,
    highValuePageFamilies,
    industryMatchIds,
    priorityPageFamilyRecipes,
    referenceLayoutLibrary,
    referenceRecipeLibrary,
    slideRole,
    textKeywords,
    themeIntentFor
  });
}

function createPlanningAssetGenerationRuntime(deps = {}) {
  const {
    factualGeneratedAssetRisk,
    flattenText,
    generatedAssetPolicy: generatedAssetPolicyOverride,
    generatedAssetPrompt: generatedAssetPromptOverride,
    industryVisualPolicy,
    mediaForRole,
    referenceLayoutLibrary,
    resolveVisualMode,
    selectPaletteName,
    slideDesign,
    slideRole
  } = deps;
  if (generatedAssetPolicyOverride && generatedAssetPromptOverride) {
    return {
      generatedAssetPolicy: generatedAssetPolicyOverride,
      generatedAssetPrompt: generatedAssetPromptOverride
    };
  }
  return createAssetGenerationHelpers({
    factualGeneratedAssetRisk,
    flattenText,
    industryVisualPolicy,
    mediaForRole,
    referenceLayoutLibrary,
    resolveVisualMode,
    selectPaletteName,
    slideDesign,
    slideRole
  });
}

function createPlanningSlideRoutingRuntime(deps = {}) {
  const {
    contentSignals,
    flattenText,
    highValuePageFamilies,
    industryChartVariant,
    layoutVariantCompatibleWithType,
    pickLayoutVariant,
    recipeAutoRouteAllowed,
    recommendSlideType,
    selectReferenceRecipe,
    semanticFrame,
    staleIndustryChartRouteShouldYieldToProcess,
    themeIntentFor,
    visualIndustryId
  } = deps;
  if (recommendSlideType) {
    return {
      pickLayoutVariant,
      recipeAutoRouteAllowed,
      recommendSlideType
    };
  }
  return createSlideRoutingHelpers({
    contentSignals,
    flattenText,
    highValuePageFamilies,
    industryChartVariant,
    layoutVariantCompatibleWithType,
    selectReferenceRecipe,
    semanticFrame,
    staleIndustryChartRouteShouldYieldToProcess,
    themeIntentFor,
    visualIndustryId
  });
}

module.exports = {
  createPlanningAssetGenerationRuntime,
  createPlanningReferenceRecipeRuntime,
  createPlanningSlideRoutingRuntime
};
