const {
  createContentOverlapHelpers
} = require('./content-overlap');
const {
  createContentSignalHelpers
} = require('./content-signals');
const {
  createImageAssetHelpers
} = require('./image-assets');
const {
  createIndustryRuntime
} = require('./industry-runtime');
const {
  createProofObjectHelpers
} = require('./proof-object');
const {
  createSourceTraceHelpers
} = require('./source-trace');
const {
  createStyleProfileHelpers
} = require('./style-profile');
const {
  clampText,
  compactUnique,
  flattenText,
  keywordHit,
  textKeywords
} = require('./text-utils');
const {
  createTypographyHelpers
} = require('./typography');
const {
  deepMerge
} = require('./design-system-policy');
const {
  createFoundationResourceSet,
  HIGH_VALUE_PAGE_FAMILIES,
  layoutVariantCompatibleWithType
} = require('./design-system-foundation-resources');

function createFoundationHelperSet({
  normalizeDeckPlan = plan => plan,
  resources = createFoundationResourceSet()
} = {}) {
  const {
    FONT_STACK,
    INDUSTRY_BENCHMARKS,
    INDUSTRY_DESIGN_DIALECTS,
    INDUSTRY_PACK_LIBRARY,
    COPY_POLICY,
    VISUAL_ROUTER,
    VISUAL_SYSTEM
  } = resources;

  const {
    normalizeIndustryId,
    visualIndustryId,
    industryMatchIds,
    industryPackFor,
    copyPolicyFor,
    copyPolicyText,
    copyPolicyList,
    industryBenchmarksFor
  } = createIndustryRuntime({
    industryDesignDialects: INDUSTRY_DESIGN_DIALECTS,
    visualRouter: VISUAL_ROUTER,
    industryPackLibrary: INDUSTRY_PACK_LIBRARY,
    copyPolicy: COPY_POLICY,
    industryBenchmarks: INDUSTRY_BENCHMARKS
  });

  const {
    BASE_COLORS,
    STYLE_PROFILES,
    paletteToColors,
    resolveStyleProfile
  } = createStyleProfileHelpers({ fontStack: FONT_STACK });
  const {
    normalizeTypographyOptions,
    resolveTypeToken,
    typographyAudit,
    typographyFontSet,
    typographyProfileFor
  } = createTypographyHelpers({
    visualSystem: VISUAL_SYSTEM,
    fontStack: FONT_STACK,
    deepMerge,
    compactUnique,
    industryMatchIds,
    visualIndustryId
  });

  const {
    proofObjectIdForSlide,
    slideProofObject
  } = createProofObjectHelpers({
    compactUnique,
    flattenText,
    highValuePageFamilies: HIGH_VALUE_PAGE_FAMILIES,
    layoutVariantCompatibleWithType
  });
  const {
    assetRealismProfile,
    chooseEvidenceImageLayout,
    chooseFourImageLayout,
    imageAspectRatio,
    imageDimensions,
    imageQualityProfile,
    rankImageAssetCandidates,
    scoreImageAsset
  } = createImageAssetHelpers(VISUAL_SYSTEM);
  const {
    applyPlanAuthoredSourceTrace,
    assetAuthorizationGate,
    imageRefsForSlide,
    preferredProofObjectIdForTrace,
    sourceTraceAudit,
    sourceTraceForSlide
  } = createSourceTraceHelpers({
    clampText,
    compactUnique,
    flattenText,
    normalizeDeckPlan,
    proofObjectIdForSlide,
    slideProofObject
  });
  const {
    contentOverlapAudit,
    overlapText,
    slideContentOverlap
  } = createContentOverlapHelpers({
    normalizeDeckPlan,
    textKeywords
  });
  const {
    contentSignals,
    hasArrayField,
    hasExplicitIndustryChartData,
    hasValueField,
    staleIndustryChartRouteShouldYieldToProcess
  } = createContentSignalHelpers({
    flattenText,
    keywordHit,
    overlapText,
    visualSystem: VISUAL_SYSTEM
  });

  return {
    BASE_COLORS,
    STYLE_PROFILES,
    applyPlanAuthoredSourceTrace,
    assetAuthorizationGate,
    assetRealismProfile,
    chooseEvidenceImageLayout,
    chooseFourImageLayout,
    contentOverlapAudit,
    contentSignals,
    copyPolicyFor,
    copyPolicyList,
    copyPolicyText,
    hasArrayField,
    hasExplicitIndustryChartData,
    hasValueField,
    imageAspectRatio,
    imageDimensions,
    imageQualityProfile,
    imageRefsForSlide,
    industryBenchmarksFor,
    industryMatchIds,
    industryPackFor,
    normalizeIndustryId,
    normalizeTypographyOptions,
    paletteToColors,
    preferredProofObjectIdForTrace,
    rankImageAssetCandidates,
    proofObjectIdForSlide,
    resolveStyleProfile,
    resolveTypeToken,
    scoreImageAsset,
    slideContentOverlap,
    slideProofObject,
    sourceTraceAudit,
    sourceTraceForSlide,
    staleIndustryChartRouteShouldYieldToProcess,
    typographyAudit,
    typographyFontSet,
    typographyProfileFor,
    visualIndustryId
  };
}

module.exports = {
  createFoundationHelperSet
};
