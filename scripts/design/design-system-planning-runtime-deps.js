function pickNamed(source = {}, names = []) {
  return names.reduce((result, name) => {
    result[name] = source[name];
    return result;
  }, {});
}

const REFERENCE_RECIPE_DEP_NAMES = [
  'compactUnique', 'contentSignals', 'flattenText', 'highValuePageFamilies',
  'industryMatchIds', 'priorityPageFamilyRecipes', 'slideRole', 'textKeywords',
  'themeIntentFor'
];

const ASSET_GENERATION_DEP_NAMES = [
  'factualGeneratedAssetRisk', 'flattenText', 'industryVisualPolicy',
  'mediaForRole', 'resolveVisualMode', 'selectPaletteName', 'slideDesign',
  'slideRole'
];

const SLIDE_ROUTING_DEP_NAMES = [
  'contentSignals', 'flattenText', 'highValuePageFamilies',
  'industryChartVariant', 'industryPackFor', 'layoutVariantCompatibleWithType', 'semanticFrame',
  'staleIndustryChartRouteShouldYieldToProcess', 'themeIntentFor',
  'visualIndustryId'
];

const NORMALIZATION_DEP_NAMES = [
  'FONT_STACK', 'PALETTES', 'VISUAL_ROUTER', 'VISUAL_SYSTEM', 'acceptanceAudit',
  'accentRoleFor', 'applyNarrativeMetadata', 'applyPlanAuthoredSourceTrace',
  'auditDeckPlan', 'clampText', 'compactUnique', 'componentPlanFor',
  'compositionAudit', 'compositionPlan', 'contentOverlapAudit',
  'contentSignals', 'copyPolicyFor', 'copyPolicyList', 'copyPolicyText',
  'dataGrammarVariant', 'deckNarrativeSummary', 'flattenText',
  'highValuePageFamilies', 'imageRefsForSlide', 'industryDesignDialect',
  'industryKnowledgeAudit', 'industryPackFor', 'industryVisualPolicy', 'languagePolicyFor',
  'layoutEnergyFor', 'layoutVariantCompatibleWithType', 'localizeMicrocopy',
  'normalizeTypographyOptions', 'paletteToColors',
  'preferredProofObjectIdForTrace', 'proofObjectIdForSlide',
  'resolveStyleProfile', 'resolveTypeToken', 'rhythmTransitionFor',
  'routeChartSpec', 'routeKey', 'scoreImageAsset', 'selectPaletteName',
  'semanticColorRolesFor', 'semanticFrame', 'semanticMeaning',
  'sequenceSlidesByNarrative', 'slideDesign', 'slideHasChartIntent',
  'themeIntentFor', 'typographyAudit', 'typographyFontSet',
  'typographyProfileFor', 'visualAestheticModel', 'visualDensityFor'
];

function referenceLayoutLibraryFor(deps = {}) {
  return deps.referenceLayoutLibrary === undefined
    ? deps.REFERENCE_LAYOUT_LIBRARY
    : deps.referenceLayoutLibrary;
}

function referenceRecipeLibraryFor(deps = {}) {
  return deps.referenceRecipeLibrary === undefined
    ? deps.REFERENCE_RECIPE_LIBRARY
    : deps.referenceRecipeLibrary;
}

function referenceRecipeRuntimeDeps(deps = {}) {
  return Object.assign(pickNamed(deps, REFERENCE_RECIPE_DEP_NAMES), {
    referenceLayoutLibrary: referenceLayoutLibraryFor(deps),
    referenceRecipeLibrary: referenceRecipeLibraryFor(deps)
  });
}

function assetGenerationRuntimeDeps(deps = {}) {
  return Object.assign(pickNamed(deps, ASSET_GENERATION_DEP_NAMES), {
    generatedAssetPolicy: deps.generatedAssetPolicy,
    generatedAssetPrompt: deps.generatedAssetPrompt,
    referenceLayoutLibrary: referenceLayoutLibraryFor(deps)
  });
}

function slideRoutingRuntimeDeps(deps = {}, resolved = {}) {
  return Object.assign(pickNamed(deps, SLIDE_ROUTING_DEP_NAMES), {
    pickLayoutVariant: deps.pickLayoutVariant,
    recipeAutoRouteAllowed: deps.recipeAutoRouteAllowed,
    recommendSlideType: deps.recommendSlideType,
    selectReferenceRecipe: resolved.selectReferenceRecipe
  });
}

function normalizationRuntimeDeps(deps = {}, resolved = {}) {
  return Object.assign(pickNamed(deps, NORMALIZATION_DEP_NAMES), resolved);
}

function planningRuntimeExports(resolved = {}) {
  const {
    assetRuntime = {},
    normalizationRuntime = {},
    referenceRuntime = {},
    routingRuntime = {},
    selectReferenceRecipe
  } = resolved;
  return Object.assign({}, normalizationRuntime, {
    assetTargetContract: assetRuntime.assetTargetContract,
    generatedAssetPolicy: assetRuntime.generatedAssetPolicy,
    generatedAssetPrompt: assetRuntime.generatedAssetPrompt,
    generatedPromptAspectConflict: assetRuntime.generatedPromptAspectConflict,
    pickLayoutVariant: routingRuntime.pickLayoutVariant,
    recipeAutoRouteAllowed: routingRuntime.recipeAutoRouteAllowed,
    recipeCompatibleWithSlideType: referenceRuntime.recipeCompatibleWithSlideType,
    recommendSlideType: routingRuntime.recommendSlideType,
    referenceRecipeCandidates: referenceRuntime.referenceRecipeCandidates,
    selectReferenceRecipe
  });
}

module.exports = {
  assetGenerationRuntimeDeps,
  normalizationRuntimeDeps,
  planningRuntimeExports,
  referenceRecipeRuntimeDeps,
  slideRoutingRuntimeDeps
};
