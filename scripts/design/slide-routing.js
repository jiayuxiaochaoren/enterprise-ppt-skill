const {
  createLayoutVariantPicker
} = require('./slide-layout-variant-routing');

function createSlideRoutingHelpers(deps = {}) {
  const {
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
  } = deps;
  const { pickLayoutVariant } = createLayoutVariantPicker({
    contentSignals,
    flattenText,
    highValuePageFamilies,
    industryChartVariant,
    layoutVariantCompatibleWithType,
    visualIndustryId
  });

  function recipeAutoRouteAllowed(recipe = null, s = {}, signals = contentSignals({}, s)) {
    const renderType = String((recipe && (recipe.renderType || recipe.slideType)) || '');
    const hasProcessStructure = Array.isArray(s.phases) ||
      Array.isArray(s.actions) ||
      Array.isArray(s.steps) ||
      Array.isArray(s.timeline) ||
      Array.isArray(s.milestones) ||
      signals.hasTimeline;
    const hasRiskStructure = Array.isArray(s.rows) ||
      Array.isArray(s.risks) ||
      Array.isArray(s.controls) ||
      Boolean(s.riskRegister || s.riskMatrix || s.controlsMatrix || s.matrix) ||
      signals.hasRisk ||
      signals.hasResponsibilityLoop;
    const hasArchitectureStructure = Array.isArray(s.layers) ||
      Boolean(s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities) ||
      signals.hasArchitecture;
    const hasValueStructure = Boolean(s.valueChain || s.capitals || s.drivers || s.outcomes || s.inputs || s.outputs) ||
      signals.hasStructuredLogic ||
      signals.hasNamedLogicChain ||
      signals.hasStrategyMap;
    if (['timeline', 'timeline-dark'].includes(renderType)) return hasProcessStructure;
    if (renderType === 'risk-table') return hasRiskStructure;
    if (['architecture', 'architecture-dark'].includes(renderType)) return hasArchitectureStructure;
    if (renderType === 'strategy-map') return hasValueStructure;
    return true;
  }

  function recommendSlideType(plan = {}, s = {}, index = 0, total = 1) {
    const signals = contentSignals(plan, s, index, total);
    if (s.type && s.type !== 'auto' && s.type !== 'content') {
      if (staleIndustryChartRouteShouldYieldToProcess(s, signals)) {
        return { type: 'timeline', reason: 'process fields override stale industry-chart route' };
      }
      return { type: s.type, locked: true, reason: 'explicit type' };
    }
    const semantic = semanticFrame(plan, s, signals);
    const themeIntent = themeIntentFor(plan, s, index, total, signals);
    if (signals.first) return { type: 'cover', reason: 'first slide' };
    if (signals.last && /结束|收束|下一步|closing|thank|thanks|谢谢|感谢|观看|答疑|Q&A|alignment/i.test(flattenText(s))) {
      return { type: 'closing', reason: 'closing signal' };
    }
    if (signals.last && (s.decision || s.summary || (Array.isArray(s.actions) && s.actions.length))) {
      return { type: 'closing', reason: 'last slide decision/action fields' };
    }
    if (s.company || s.description) return { type: 'profile-proof', reason: 'explicit profile proof fields' };
    if (s.quote || s.statement) return { type: 'quote-proof', reason: 'explicit quote/statement field' };
    if (s.serviceBlueprint || s.touchpoints || s.journeyMap) return { type: 'architecture', reason: 'explicit service blueprint fields' };
    if (s.productionLine) return { type: 'architecture', reason: 'explicit production topology field' };
    if (s.downtimePareto || s.valuationSensitivity || s.qualityHandoff || s.memberCohorts || s.channelEfficiency || s.mediaEfficiency || s.monthlyPulse || s.monthlyTrend || s.waterfallBridge || s.targetBridge || s.dispatchMap || s.adoptionFunnel) {
      return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject || 'explicit-chart'}` };
    }
    if (s.oee || s.oeeComponents) return { type: 'metric-comparison', reason: 'explicit OEE metrics fields' };
    if (s.lookbook || s.productStory) return { type: 'case-gallery', reason: 'explicit lookbook/product story fields' };
    if (s.platformCapabilities || s.capabilityMap) return { type: 'architecture', reason: 'explicit platform capability fields' };
    if (s.product || (Array.isArray(s.products) && s.products.length)) return { type: 'product-showcase', reason: 'explicit product/showcase fields' };
    if (s.before || s.after || s.beforeAfter) return { type: 'case-gallery', reason: 'explicit before/after case comparison fields' };
    if ((Array.isArray(s.flywheel) && s.flywheel.length) || (Array.isArray(s.loopItems) && s.loopItems.length)) return { type: 'timeline', reason: 'explicit flywheel/loop fields' };
    if (Array.isArray(s.bridge) && s.bridge.length) {
      return plan.industry === 'finance-investment'
        ? { type: 'finance-bridge', reason: 'explicit finance bridge field' }
        : { type: 'industry-chart', reason: 'explicit business bridge field' };
    }
    if (Array.isArray(s.portfolio) && s.portfolio.length) return { type: 'portfolio-table', reason: 'explicit portfolio table field' };
    if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
    if (Array.isArray(s.metrics) && s.metrics.length) return { type: 'metric-comparison', reason: 'explicit metrics field' };
    const hasExplicitGovernanceTable = Array.isArray(s.rows) ||
      (Array.isArray(s.responsibilities) && s.responsibilities.length) ||
      (Array.isArray(s.owners) && s.owners.length) ||
      (Array.isArray(s.raci) && s.raci.length) ||
      (Array.isArray(s.accountabilities) && s.accountabilities.length);
    if (signals.isNumberHeavy && !hasExplicitGovernanceTable && !signals.hasGovernance && !signals.hasResponsibilityLoop && !signals.isTextHeavy && !signals.isDenseText) {
      return { type: 'metric-comparison', reason: 'number-heavy material signals' };
    }
    if (/risk-warning/i.test(themeIntent) && (Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls) || signals.hasRisk || signals.hasRiskLanguage)) return { type: 'risk-table', reason: 'theme intent: risk warning' };
    if (/case-evidence/i.test(themeIntent) && ((Array.isArray(s.images) && s.images.length) || signals.hasCaseSignal || signals.hasGallery)) return { type: 'case-gallery', reason: 'theme intent: case evidence' };
    if (/system-architecture/i.test(themeIntent) && (Array.isArray(s.layers) || signals.hasArchitecture)) return { type: 'architecture', reason: 'theme intent: system architecture' };
    if (/operating-path/i.test(themeIntent) && (Array.isArray(s.phases) || Array.isArray(s.actions) || Array.isArray(s.steps) || Array.isArray(s.timeline) || Array.isArray(s.milestones) || signals.hasTimeline) && !signals.hasSplitProblem && signals.cardCount < 5) return { type: 'timeline', reason: 'theme intent: operating path' };
    if (/value-signal/i.test(themeIntent) && (Array.isArray(s.metrics) || signals.hasMetrics || signals.isNumberHeavy) && !signals.isTextHeavy && !signals.isDenseText) return { type: 'metric-comparison', reason: 'theme intent: value signal' };
    if ((Array.isArray(s.responsibilities) && s.responsibilities.length) ||
        (Array.isArray(s.owners) && s.owners.length) ||
        (Array.isArray(s.raci) && s.raci.length) ||
        (Array.isArray(s.accountabilities) && s.accountabilities.length)) {
      return { type: 'risk-table', reason: 'explicit responsibility governance fields' };
    }
    if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
    if (Array.isArray(s.rows) && s.rows.length) return { type: 'risk-table', reason: 'explicit risk/governance rows' };
    if (s.drivers || s.actions || s.outcomes || s.valueChain || s.capitals) return { type: 'strategy-map', reason: 'explicit value-chain fields' };
    if (Array.isArray(s.layers) && s.layers.length) return { type: 'architecture', reason: 'explicit architecture layers' };
    if (Array.isArray(s.phases) && s.phases.length) return { type: 'timeline', reason: 'explicit process phases' };
    if ((Array.isArray(s.images) && s.images.length) || (s.visual && Array.isArray(s.visual.images) && s.visual.images.length)) {
      return { type: 'case-gallery', reason: 'explicit gallery images' };
    }
    if (Array.isArray(s.columns) && s.columns.length >= 2) return { type: 'comparison', reason: 'explicit comparison columns' };
    if (signals.isNumberHeavy) return { type: 'metric-comparison', reason: 'number-heavy material signals' };
    if (signals.hasStructuredLogic || signals.hasNamedLogicChain) return { type: signals.phaseCount > 0 ? 'timeline' : 'strategy-map', reason: 'logic-chain material signals' };
    if (signals.isDenseText && signals.hasSplitProblem && !signals.phaseCount && !signals.flywheelCount) {
      return { type: 'report-board', reason: 'dense diagnostic/problem material signals' };
    }
    if (signals.isTextHeavy) return { type: 'report-board', reason: 'text-heavy report material signals' };
    if (Array.isArray(s.cards) && s.cards.length >= 3) {
      return { type: s.cards.length >= 5 ? 'module-matrix' : 'executive-blocks', reason: 'explicit card group' };
    }
    const recipe = selectReferenceRecipe(plan, s, signals);
    if (recipe && recipe.score >= 8 && recipe.renderType && recipeAutoRouteAllowed(recipe, s, signals)) {
      return { type: recipe.renderType, reason: `reference recipe: ${recipe.id}` };
    }
    if (signals.hasProfile) return { type: 'profile-proof', reason: 'company/profile proof signals' };
    if (signals.hasQuote) return { type: 'quote-proof', reason: 'quote/voice proof signals' };
    if (signals.hasCaseComparison) return { type: 'case-gallery', reason: 'before/after case comparison signals' };
    if (signals.hasComparison) return { type: 'comparison', reason: 'before/after comparison signals' };
    if (signals.hasChapter) return { type: 'chapter-divider', reason: 'chapter divider signals' };
    if (signals.hasProductShowcase) return { type: 'product-showcase', reason: 'product/showcase signals' };
    if (signals.hasFlywheel) return { type: 'timeline', reason: 'flywheel/operating loop signals' };
    if (signals.hasResponsibilityLoop) return { type: 'risk-table', reason: 'responsibility governance signals' };
    if (signals.hasRisk || signals.hasRiskLanguage) return { type: 'risk-table', reason: 'risk/governance signals' };
    if (signals.isImageHeavy && signals.hasCaseSignal) return { type: 'case-gallery', reason: 'image-heavy case/evidence signals' };
    if (signals.isNumberHeavy) return { type: 'metric-comparison', reason: 'number-heavy material signals' };
    if (semantic.primaryIntent === 'industryChart') return { type: 'industry-chart', reason: `industry proof object: ${semantic.proofObject}` };
    if (signals.hasMetrics) return { type: 'metric-comparison', reason: 'metric/KPI signals' };
    if (signals.isTextHeavy) return { type: 'report-board', reason: 'text-heavy report material signals' };
    if (signals.hasLogicChain) return { type: signals.phaseCount > 0 ? 'timeline' : 'strategy-map', reason: 'logic-chain material signals' };
    if (signals.hasStrategyMap) return { type: 'strategy-map', reason: 'value-chain/strategy signals' };
    if (signals.hasManifesto) return { type: 'manifesto', reason: 'culture/values signal' };
    if (signals.hasGallery) return { type: 'case-gallery', reason: 'multiple visual/case signals' };
    if (signals.hasArchitecture) return { type: 'architecture', reason: 'architecture/module signals' };
    if (signals.hasTimeline) return { type: 'timeline', reason: 'process/timeline signals' };
    if (signals.hasDenseCards) return { type: 'module-matrix', reason: 'dense card set' };
    if (signals.hasSplitProblem) return { type: 'executive-blocks', reason: 'problem split card set' };
    if (s.left || s.right || s.leftTitle || s.rightTitle) return { type: 'two-column', reason: 'two-sided narrative' };
    if (recipe && recipe.score >= 6 && recipe.renderType && recipeAutoRouteAllowed(recipe, s, signals)) {
      return { type: recipe.renderType, reason: `reference recipe: ${recipe.id}` };
    }
    return { type: 'executive-blocks', reason: 'default commercial split' };
  }

  return {
    pickLayoutVariant,
    recipeAutoRouteAllowed,
    recommendSlideType
  };
}

module.exports = {
  createSlideRoutingHelpers
};
