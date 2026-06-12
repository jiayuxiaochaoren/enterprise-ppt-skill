const {
  assetRoleNeedsImage,
  normalizeAssetRole
} = require('./asset-generation');
const {
  profileFromIndustryPack
} = require('./proof-profile');
const {
  clampText,
  compactUnique,
  flattenText,
  keywordHit,
  matchKeywordList,
  textKeywords
} = require('./text-utils');
const {
  createFoundationHelperSet
} = require('./design-system-foundation-helpers');
const {
  createFoundationResourceSet,
  FACTUAL_GENERATED_ASSET_RISK,
  HIGH_VALUE_PAGE_FAMILIES,
  INDUSTRY_EXPRESSION_RULES,
  INDUSTRY_KNOWLEDGE_BASE,
  PRIORITY_PAGE_FAMILY_RECIPES,
  SEMANTIC_RELATION_PATTERNS,
  VISIBLE_PRODUCTION_COPY_BANS,
  layoutVariantCompatibleWithType
} = require('./design-system-foundation-resources');

function createFoundationRuntimeParts({
  normalizeDeckPlan = plan => plan
} = {}) {
  const resources = createFoundationResourceSet();
  const helpers = createFoundationHelperSet({ normalizeDeckPlan, resources });

  return {
    ASSET_DIR: resources.ASSET_DIR,
    BASE_COLORS: helpers.BASE_COLORS,
    COPY_POLICY: resources.COPY_POLICY,
    FACTUAL_GENERATED_ASSET_RISK,
    FONT_STACK: resources.FONT_STACK,
    HIGH_VALUE_PAGE_FAMILIES,
    INDUSTRY_BENCHMARKS: resources.INDUSTRY_BENCHMARKS,
    INDUSTRY_DESIGN_DIALECTS: resources.INDUSTRY_DESIGN_DIALECTS,
    INDUSTRY_EXPRESSION_RULES,
    INDUSTRY_KNOWLEDGE_BASE,
    INDUSTRY_PACK_LIBRARY: resources.INDUSTRY_PACK_LIBRARY,
    MEDIA_ASSETS: resources.MEDIA_ASSETS,
    PALETTES: resources.PALETTES,
    PRIORITY_PAGE_FAMILY_RECIPES,
    REFERENCE_LAYOUT_LIBRARY: resources.REFERENCE_LAYOUT_LIBRARY,
    REFERENCE_RECIPE_LIBRARY: resources.REFERENCE_RECIPE_LIBRARY,
    SEMANTIC_RELATION_PATTERNS,
    STYLE_PROFILES: helpers.STYLE_PROFILES,
    VISIBLE_PRODUCTION_COPY_BANS,
    VISUAL_ROUTER: resources.VISUAL_ROUTER,
    VISUAL_SYSTEM: resources.VISUAL_SYSTEM,
    applyPlanAuthoredSourceTrace: helpers.applyPlanAuthoredSourceTrace,
    assetAuthorizationGate: helpers.assetAuthorizationGate,
    assetRoleNeedsImage,
    chooseEvidenceImageLayout: helpers.chooseEvidenceImageLayout,
    chooseFourImageLayout: helpers.chooseFourImageLayout,
    clampText,
    compactUnique,
    contentOverlapAudit: helpers.contentOverlapAudit,
    contentSignals: helpers.contentSignals,
    copyPolicyFor: helpers.copyPolicyFor,
    copyPolicyList: helpers.copyPolicyList,
    copyPolicyText: helpers.copyPolicyText,
    flattenText,
    hasArrayField: helpers.hasArrayField,
    hasExplicitIndustryChartData: helpers.hasExplicitIndustryChartData,
    hasValueField: helpers.hasValueField,
    imageAspectRatio: helpers.imageAspectRatio,
    imageDimensions: helpers.imageDimensions,
    imageQualityProfile: helpers.imageQualityProfile,
    imageRefsForSlide: helpers.imageRefsForSlide,
    industryBenchmarksFor: helpers.industryBenchmarksFor,
    industryMatchIds: helpers.industryMatchIds,
    industryPackFor: helpers.industryPackFor,
    keywordHit,
    layoutVariantCompatibleWithType,
    matchKeywordList,
    normalizeAssetRole,
    normalizeDeckPlan,
    normalizeIndustryId: helpers.normalizeIndustryId,
    normalizeTypographyOptions: helpers.normalizeTypographyOptions,
    paletteToColors: helpers.paletteToColors,
    preferredProofObjectIdForTrace: helpers.preferredProofObjectIdForTrace,
    profileFromIndustryPack,
    proofObjectIdForSlide: helpers.proofObjectIdForSlide,
    resolveStyleProfile: helpers.resolveStyleProfile,
    resolveTypeToken: helpers.resolveTypeToken,
    scoreImageAsset: helpers.scoreImageAsset,
    slideContentOverlap: helpers.slideContentOverlap,
    slideProofObject: helpers.slideProofObject,
    sourceTraceAudit: helpers.sourceTraceAudit,
    sourceTraceForSlide: helpers.sourceTraceForSlide,
    staleIndustryChartRouteShouldYieldToProcess: helpers.staleIndustryChartRouteShouldYieldToProcess,
    textKeywords,
    typographyAudit: helpers.typographyAudit,
    typographyFontSet: helpers.typographyFontSet,
    typographyProfileFor: helpers.typographyProfileFor,
    visualIndustryId: helpers.visualIndustryId
  };
}

module.exports = {
  createFoundationHelperSet,
  createFoundationResourceSet,
  createFoundationRuntimeParts
};
