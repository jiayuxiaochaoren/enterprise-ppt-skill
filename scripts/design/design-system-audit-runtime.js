const {
  createAcceptanceAuditHelpers
} = require('./acceptance-audit');
const {
  createCompositionAuditHelpers
} = require('./composition-audit');
const {
  createComponentPlanAuditHelpers
} = require('./component-plan-audit');
const {
  createDeckStructureAuditHelpers
} = require('./deck-structure-audit');
const {
  createDeckPlanAuditHelpers
} = require('./deck-plan-audit');
const {
  createEvidenceAuditHelpers
} = require('./evidence-audit');
const {
  createIndustryFitAuditHelpers
} = require('./industry-fit-audit');

function createDesignSystemAuditRuntime(deps = {}) {
  const {
    assetAuthorizationGate,
    chartAcceptanceGate,
    chartEvidenceQA,
    chartSemanticQA,
    chartVisualQA,
    contentOverlapAudit,
    contentSignals,
    flattenText,
    hasCommercialLogicChain,
    hasComponentCapability,
    industryExpressionRules,
    industryFitAudit,
    industryKnowledgeAudit,
    industryPackFor,
    normalizeDeckPlan,
    pageLevelChartScores,
    productionCopyBans,
    proofObjectIdForSlide,
    routeKey,
    routeMatches,
    slideProofObject,
    sourceTraceAudit,
    sourceTraceForSlide,
    visualAestheticModel,
    visualIndustryId
  } = deps;

  const {
    evidenceAudit
  } = createEvidenceAuditHelpers({
    normalizeDeckPlan,
    slideProofObject,
    sourceTraceAudit,
    sourceTraceForSlide
  });

  const {
    pageCountAudit,
    reportDepthAudit
  } = createDeckStructureAuditHelpers({
    hasCommercialLogicChain,
    normalizeDeckPlan,
    proofObjectIdForSlide
  });

  const {
    componentPlanAudit
  } = createComponentPlanAuditHelpers({
    flattenText,
    hasComponentCapability,
    normalizeDeckPlan
  });

  const fitHelpers = createIndustryFitAuditHelpers({
    flattenText,
    industryExpressionRules,
    industryPackFor,
    normalizeDeckPlan,
    proofObjectIdForSlide,
    visualIndustryId
  });

  const {
    compositionAudit
  } = createCompositionAuditHelpers({
    contentSignals,
    normalizeDeckPlan
  });

  const {
    visibleProductionCopyIssues,
    auditDeckPlan
  } = createDeckPlanAuditHelpers({
    compositionAudit,
    contentOverlapAudit,
    contentSignals,
    flattenText,
    hasCommercialLogicChain,
    industryExpressionRules,
    industryKnowledgeAudit,
    normalizeDeckPlan,
    productionCopyBans,
    routeKey,
    routeMatches,
    visualAestheticModel,
    visualIndustryId
  });

  const {
    acceptanceAudit,
    commercialReadinessAudit
  } = createAcceptanceAuditHelpers({
    assetAuthorizationGate,
    auditDeckPlan,
    chartAcceptanceGate,
    chartEvidenceQA,
    chartSemanticQA,
    chartVisualQA,
    componentPlanAudit,
    compositionAudit,
    evidenceAudit,
    industryFitAudit: industryFitAudit || fitHelpers.industryFitAudit,
    industryKnowledgeAudit,
    normalizeDeckPlan,
    pageCountAudit,
    pageLevelChartScores,
    reportDepthAudit,
    sourceTraceAudit,
    visualAestheticModel
  });

  return {
    acceptanceAudit,
    auditDeckPlan,
    commercialReadinessAudit,
    componentPlanAudit,
    compositionAudit,
    evidenceAudit,
    industryFitAudit: industryFitAudit || fitHelpers.industryFitAudit,
    pageCountAudit,
    reportDepthAudit,
    visibleProductionCopyIssues
  };
}

module.exports = {
  createDesignSystemAuditRuntime
};
