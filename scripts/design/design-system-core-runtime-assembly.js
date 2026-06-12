const {
  createAestheticModelHelpers
} = require('./aesthetic-model');
const {
  createIndustryKnowledgeAuditHelpers
} = require('./industry-knowledge-audit');
const {
  createNarrativeHelpers
} = require('./narrative');
const {
  createSemanticModelHelpers
} = require('./semantic-model');
const {
  createCorePlanningAssembly
} = require('./design-system-core-planning-assembly');

function createCoreRuntimeAssembly(deps = {}) {
  const {
    contentSignals,
    flattenText,
    hasArrayField,
    hasValueField,
    highValuePageFamilies,
    industryKnowledgeBase,
    industryPackFor,
    layoutVariantCompatibleWithType,
    matchKeywordList,
    normalizeDeckPlan,
    normalizeIndustryId,
    profileFromIndustryPack,
    semanticRelationPatterns,
    visualIndustryId
  } = deps;

  let routeKey;
  let routeMatches;
  let semanticMeaning;

  const {
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
  } = createCorePlanningAssembly(deps);

  const {
    industryKnowledgeAudit,
    industryKnowledgeProfile
  } = createIndustryKnowledgeAuditHelpers({
    contentSignals,
    industryKnowledgeBase,
    industryPackFor,
    normalizeDeckPlan,
    normalizeIndustryId,
    profileFromIndustryPack,
    routeKey: (...args) => routeKey(...args),
    routeMatches: (...args) => routeMatches(...args),
    semanticMeaning: (...args) => semanticMeaning(...args),
    visualIndustryId
  });

  const semantic = createSemanticModelHelpers({
    contentSignals,
    flattenText,
    hasArrayField,
    hasValueField,
    industryKnowledgeProfile,
    matchKeywordList,
    semanticRelationPatterns,
    visualIndustryId
  });
  semanticMeaning = semantic.semanticMeaning;

  const narrative = createNarrativeHelpers({
    contentSignals,
    semanticFrame: semantic.semanticFrame,
    semanticMeaning,
    highValuePageFamilies,
    layoutVariantCompatibleWithType
  });
  routeKey = narrative.routeKey;
  routeMatches = narrative.routeMatches;

  const {
    hasCommercialLogicChain,
    aestheticSlideScore,
    visualAestheticModel
  } = createAestheticModelHelpers({
    contentSignals,
    flattenText,
    normalizeDeckPlan,
    routeKey,
    semanticMeaning,
    slideRole
  });

  return {
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
  };
}

module.exports = {
  createCoreRuntimeAssembly
};
