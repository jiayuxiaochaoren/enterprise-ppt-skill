const {
  createDesignSystemAuditRuntime
} = require('./design/design-system-audit-runtime');
const {
  createDesignSystemCoreRuntime
} = require('./design/design-system-core-runtime');
const {
  buildDesignSystemExports
} = require('./design/design-system-exports');
const {
  createDesignSystemFoundationRuntime
} = require('./design/design-system-foundation-runtime');
const {
  createDesignSystemPlanningRuntime
} = require('./design/design-system-planning-runtime');
const {
  inferDeckLanguage,
  languagePolicyFor,
  localizeMicrocopy
} = require('./design/language-policy');
const {
  chartAcceptanceGate,
  chartEvidenceQA,
  hasExplicitChartSignal,
  chartSemanticQA,
  chartSpecToComponentId,
  chartVisualQA,
  pageLevelChartScores,
  routeChartSpec,
  slideHasChartIntent
} = require('./chart-spec');
const {
  componentCapabilityFor,
  hasComponentCapability
} = require('./components');

let normalizeDeckPlanImpl = null;
function normalizeDeckPlan(plan = {}) {
  if (!normalizeDeckPlanImpl) throw new Error('normalizeDeckPlan runtime is not initialized');
  return normalizeDeckPlanImpl(plan);
}

const foundation = createDesignSystemFoundationRuntime({ normalizeDeckPlan });
const chartRuntime = {
  chartAcceptanceGate,
  chartEvidenceQA,
  chartSemanticQA,
  chartSpecToComponentId,
  chartVisualQA,
  hasExplicitChartSignal,
  pageLevelChartScores,
  routeChartSpec,
  slideHasChartIntent
};
const componentRuntime = {
  componentCapabilityFor,
  hasComponentCapability
};
const languageRuntime = {
  inferDeckLanguage,
  languagePolicyFor,
  localizeMicrocopy
};

const coreRuntime = createDesignSystemCoreRuntime(Object.assign({}, foundation, chartRuntime, componentRuntime, {
  assetDir: foundation.ASSET_DIR,
  highValuePageFamilies: foundation.HIGH_VALUE_PAGE_FAMILIES,
  industryDesignDialects: foundation.INDUSTRY_DESIGN_DIALECTS,
  industryKnowledgeBase: foundation.INDUSTRY_KNOWLEDGE_BASE,
  mediaAssets: foundation.MEDIA_ASSETS,
  palettes: foundation.PALETTES,
  semanticRelationPatterns: foundation.SEMANTIC_RELATION_PATTERNS,
  visualRouter: foundation.VISUAL_ROUTER,
  visualSystem: foundation.VISUAL_SYSTEM
}));

const auditRuntime = createDesignSystemAuditRuntime(Object.assign({}, foundation, chartRuntime, componentRuntime, coreRuntime, {
  industryExpressionRules: foundation.INDUSTRY_EXPRESSION_RULES,
  productionCopyBans: foundation.VISIBLE_PRODUCTION_COPY_BANS
}));

const planningRuntime = createDesignSystemPlanningRuntime(Object.assign({}, foundation, chartRuntime, coreRuntime, auditRuntime, languageRuntime, {
  factualGeneratedAssetRisk: foundation.FACTUAL_GENERATED_ASSET_RISK,
  highValuePageFamilies: foundation.HIGH_VALUE_PAGE_FAMILIES,
  priorityPageFamilyRecipes: foundation.PRIORITY_PAGE_FAMILY_RECIPES
}));

normalizeDeckPlanImpl = planningRuntime.normalizeDeckPlan;

module.exports = buildDesignSystemExports({
  constants: foundation,
  chart: chartRuntime,
  typography: foundation,
  sourceAndContent: foundation,
  core: coreRuntime,
  audits: auditRuntime,
  planning: Object.assign({}, planningRuntime, { normalizeDeckPlan }),
  assetsAndIndustry: foundation,
  copyAndLanguage: Object.assign({}, foundation, languageRuntime)
});
