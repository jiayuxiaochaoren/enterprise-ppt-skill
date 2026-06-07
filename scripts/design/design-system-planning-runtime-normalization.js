const {
  createDeckContextHelpers
} = require('./deck-context');
const {
  createDeckPlanNormalizationHelpers
} = require('./deck-plan-normalization');
const {
  createDeckRhythmHelpers
} = require('./deck-rhythm');
const {
  createSlideNormalizationHelpers
} = require('./slide-normalization');

function createPlanningNormalizationRuntime(deps = {}) {
  const {
    FONT_STACK,
    PALETTES,
    VISUAL_ROUTER,
    VISUAL_SYSTEM,
    acceptanceAudit,
    accentRoleFor,
    applyNarrativeMetadata,
    applyPlanAuthoredSourceTrace,
    auditDeckPlan,
    clampText,
    compactUnique,
    componentPlanFor,
    compositionAudit,
    compositionPlan,
    contentOverlapAudit,
    contentSignals,
    copyPolicyFor,
    copyPolicyList,
    copyPolicyText,
    dataGrammarVariant,
    deckNarrativeSummary,
    generatedAssetPolicy,
    generatedAssetPrompt,
    highValuePageFamilies,
    imageRefsForSlide,
    industryDesignDialect,
    industryKnowledgeAudit,
    industryVisualPolicy,
    languagePolicyFor,
    layoutEnergyFor,
    layoutVariantCompatibleWithType,
    localizeMicrocopy,
    normalizeTypographyOptions,
    paletteToColors,
    pickLayoutVariant,
    preferredProofObjectIdForTrace,
    proofObjectIdForSlide,
    recipeCompatibleWithSlideType,
    recommendSlideType,
    resolveStyleProfile,
    resolveTypeToken,
    rhythmTransitionFor,
    routeChartSpec,
    routeKey,
    scoreImageAsset,
    selectPaletteName,
    selectReferenceRecipe,
    semanticColorRolesFor,
    semanticFrame,
    semanticMeaning,
    sequenceSlidesByNarrative,
    slideDesign,
    slideHasChartIntent,
    themeIntentFor,
    typographyAudit,
    typographyFontSet,
    typographyProfileFor,
    visualAestheticModel,
    visualDensityFor
  } = deps;

  const {
    deriveMetricsFromSlide,
    normalizeSlide
  } = createSlideNormalizationHelpers({
    applyPlanAuthoredSourceTrace,
    clampText,
    compactUnique,
    componentPlanFor,
    compositionPlan,
    contentSignals,
    flattenText: deps.flattenText,
    generatedAssetPolicy,
    generatedAssetPrompt,
    highValuePageFamilies,
    layoutVariantCompatibleWithType,
    palettes: PALETTES,
    pickLayoutVariant,
    recipeCompatibleWithSlideType,
    recommendSlideType,
    routeChartSpec,
    semanticFrame,
    selectPaletteName,
    selectReferenceRecipe,
    slideDesign,
    slideHasChartIntent,
    visualSystem: VISUAL_SYSTEM
  });

  const {
    applyDataComponentDiversity,
    applyDeckRhythm,
    claimSpineForSlides
  } = createDeckRhythmHelpers({
    accentRoleFor,
    compactUnique,
    contentSignals,
    dataGrammarVariant,
    imageRefsForSlide,
    layoutEnergyFor,
    normalizeSlide,
    preferredProofObjectIdForTrace,
    proofObjectIdForSlide,
    rhythmTransitionFor,
    routeKey,
    semanticColorRolesFor,
    themeIntentFor,
    visualDensityFor
  });

  const { normalizeDeckPlan } = createDeckPlanNormalizationHelpers({
    applyDataComponentDiversity,
    applyDeckRhythm,
    applyNarrativeMetadata,
    claimSpineForSlides,
    deckNarrativeSummary,
    normalizeSlide,
    sequenceSlidesByNarrative
  });

  const { makeDeckContext } = createDeckContextHelpers({
    FONT_STACK,
    PALETTES,
    VISUAL_ROUTER,
    VISUAL_SYSTEM,
    acceptanceAudit,
    auditDeckPlan,
    compositionAudit,
    contentOverlapAudit,
    contentSignals,
    copyPolicyFor,
    copyPolicyList,
    copyPolicyText,
    generatedAssetPolicy,
    generatedAssetPrompt,
    industryDesignDialect,
    industryKnowledgeAudit,
    industryVisualPolicy,
    languagePolicyFor,
    localizeMicrocopy,
    normalizeDeckPlan,
    normalizeTypographyOptions,
    paletteToColors,
    recommendSlideType,
    resolveStyleProfile,
    resolveTypeToken,
    scoreImageAsset,
    selectPaletteName,
    selectReferenceRecipe,
    semanticFrame,
    semanticMeaning,
    slideDesign,
    typographyAudit,
    typographyFontSet,
    typographyProfileFor,
    visualAestheticModel
  });

  return {
    applyDataComponentDiversity,
    applyDeckRhythm,
    claimSpineForSlides,
    deriveMetricsFromSlide,
    makeDeckContext,
    normalizeDeckPlan,
    normalizeSlide
  };
}

module.exports = {
  createPlanningNormalizationRuntime
};
