const {
  addComponent,
  componentIdFromHint,
  hasContactBlockData,
  isSystemPlannedComponent,
  normalizeComponentEntry,
  normalizeComponentId
} = require('./component-planning-normalization');
const {
  createComponentPlanningInputHelpers
} = require('./component-planning-inputs');
const {
  enrichComponentPlanOutput
} = require('./component-planning-output');
const {
  componentRouteSignalSummary,
  hasExplicitRiskMatrixData
} = require('./component-planning-route-signals');
const {
  filterComponentPlanCandidates
} = require('./component-planning-filters');
const {
  coverageRoleForComponent,
  inferIndustryEvidenceChain
} = require('./industry-evidence-chain');
const {
  industryChainComponentAllowed
} = require('./industry-evidence-chain-components');
const {
  hasSourceEvidence,
  visibleSourceNotesEnabled
} = require('./source-evidence');
const { CARD_GRID_TYPES, hasStructuredMetricEvidence, hasStructuredProductEvidence, nativeIndustryVariantOwnsChartComponent } = require('./route-component-capabilities');

function createComponentPlanHelpers(deps = {}) {
  const {
    chartSpecToComponentId,
    compactUnique,
    componentCapabilityFor,
    contentSignals,
    dialectComponentsFor,
    effectiveComponentModesFor,
    flattenText,
    hasExplicitChartSignal,
    industryDesignDialect,
    industryPackFor,
    proofObjectIdForSlide,
    routeChartSpec,
    slideHasChartIntent,
    themeIntentFor
  } = deps;

  const {
    explicitComponentEntries,
    nativeOnlyOptionalComponentAllowed
  } = createComponentPlanningInputHelpers({
    compactUnique,
    contentSignals,
    flattenText,
    proofObjectIdForSlide
  });

  function componentPlanFor(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total), composition = null) {
    const type = s.type || '';
    const variant = String(s.layoutVariant || s.variant || '');
    const proofObject = proofObjectIdForSlide(s);
    const proofObjectForVisualRules = s.proofObjectInferred || s.proof_object_inferred ? '' : proofObject;
    const cp = composition || s.compositionPlan || {};
    const themeIntent = cp.themeIntent || s.themeIntent || themeIntentFor(plan, s, index, total, signals);
    const components = [];
    const rulesApplied = [];
    const routeText = flattenText({
      industry: plan.industry,
      documentType: plan.documentType,
      type,
      variant,
      proofObject,
      title: s.title,
      subtitle: s.subtitle,
      claim: s.claim,
      visual: s.visual,
      cards: s.cards,
      items: s.items,
      productStory: s.productStory,
      products: s.products
    });
    const slideRouteText = flattenText({
      type,
      variant,
      proofObject,
      title: s.title,
      subtitle: s.subtitle,
      claim: s.claim,
      visual: s.visual,
      cards: s.cards,
      items: s.items,
      productStory: s.productStory,
      products: s.products
    });
    const routeSignals = componentRouteSignalSummary({
      proofObject,
      proofObjectForVisualRules,
      s,
      signals,
      slideRouteText,
      type,
      variant
    });
    const {
      brandSceneGallerySignal,
      brandWorldStrategySignal,
      directImageCount,
      explicitGalleryRouteSignal,
      galleryEligible,
      imageBackedGallerySignal,
      productProofSignal,
      productStoryGallerySignal
    } = routeSignals;

    explicitComponentEntries(s).forEach(entry => addComponent(components, entry, entry.source || 'explicit'));

    const addRule = (id, role, rule, required = true, meta = {}) => {
      addComponent(components, Object.assign({ id, role, required }, meta), rule);
      rulesApplied.push(rule);
    };
    const pack = typeof industryPackFor === 'function' ? industryPackFor(plan) : null;
    const industryEvidenceChain = inferIndustryEvidenceChain(plan, s, {
      visualGrammar: pack && pack.visualGrammar ? pack.visualGrammar : null
    });
    if (industryEvidenceChain.stageId !== 'neutral-general') {
      (industryEvidenceChain.components || []).forEach(id => {
        const coverageRole = coverageRoleForComponent(industryEvidenceChain.coveragePolicy || {}, id);
        if (!industryChainComponentAllowed(id, {
          directImageCount, evidenceChain: industryEvidenceChain, plan, productProofSignal, signals, slide: s, type
        })) return;
        addRule(
          id,
          `industry evidence chain: ${industryEvidenceChain.stageLabel}`,
          `industry-evidence-chain:${industryEvidenceChain.stageId}`,
          coverageRole === 'requiredAll' || coverageRole === 'requiredWhenVisible',
          { coverageRole, coveragePolicy: industryEvidenceChain.coveragePolicy || null }
        );
      });
    }

    const {
      heroImageRouteEligible,
      proofObjectVisualAnchor
    } = routeSignals;
    if (['cover', 'cover-dark'].includes(type) || (signals.imageCount > 0 && heroImageRouteEligible) || proofObjectVisualAnchor) {
      addRule('hero-image', 'primary visual or brand-world anchor', 'visual-or-cover-signal', !['toc', 'toc-clean'].includes(type));
    }
    if (['toc', 'toc-clean'].includes(type)) {
      addRule('navigation-sequence', 'native navigation path or agenda sequence', 'toc-navigation');
    }
    if (type === 'chapter-divider' && (Array.isArray(s.items) || /sequence|agenda|path|路径|目录/i.test(`${variant} ${proofObject} ${s.title || ''}`))) {
      addRule('navigation-sequence', 'native navigation path or agenda sequence', 'chapter-navigation');
    }
    if (CARD_GRID_TYPES.has(type)) {
      addRule('content-card-grid', 'native card grid or editorial content body', 'native-content-grid');
    }
    if (type === 'report-board') {
      addRule('commentary-panel', 'executive read or management judgment panel', 'report-board-native');
      addRule('content-card-grid', 'structured evidence sections', 'report-board-native');
    }
    const metricEligible = !['cover', 'cover-dark', 'closing', 'chapter-divider', 'toc', 'toc-clean', 'risk-table', 'portfolio-table', 'timeline', 'timeline-dark', 'report-board'].includes(type) &&
      !CARD_GRID_TYPES.has(type);
    if ((metricEligible && hasStructuredMetricEvidence(s)) || ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) {
      addRule('kpi-strip', 'metric evidence readout', 'metric-signal');
      if (!brandWorldStrategySignal) {
        addRule('chart-commentary-panel', 'explain what the data proves', 'metric-signal', false);
      }
    }
    if (['metric-comparison', 'industry-chart'].includes(type) && signals.metricCount >= 1) {
      addRule('kpi-primary-metric', 'one number carries the page claim', 'metric-primary');
    }
    const chartOwningTypes = ['metric-comparison', 'industry-chart', 'finance-bridge'];
    const chartIntent = chartOwningTypes.includes(type) && slideHasChartIntent(s);
    const chartSpec = chartIntent ? (s.chartSpec || routeChartSpec(plan, s, { index: index + 1, total })) : null;
    const chartComponentId = chartSpecToComponentId(chartSpec || {});
    const explicitChartSignal = hasExplicitChartSignal(s) && s.chartSpecInferred !== true;
    const chartEligibleRoute = ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type) ||
      /chart|metric|kpi|scorecard|matrix|funnel|waterfall|pareto/i.test(String(variant || proofObject));
    const inferredInformationGap = chartSpec && chartSpec.kind === 'informationGap' && !explicitChartSignal;
    const nativeVariantOwnsChart = nativeIndustryVariantOwnsChartComponent(type, variant);
    if (chartIntent && chartComponentId && !nativeVariantOwnsChart && !inferredInformationGap && (explicitChartSignal || chartEligibleRoute) && !['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(type)) {
      addRule(chartComponentId, chartSpec.kind === 'informationGap' ? 'explicit data gap instead of fake chart' : `chartSpec/v1 ${chartSpec.kind} renderer`, 'chart-spec-router');
    }
    if (
      (galleryEligible && (
        imageBackedGallerySignal ||
        productStoryGallerySignal ||
        brandSceneGallerySignal
      )) ||
      explicitGalleryRouteSignal ||
      (!brandWorldStrategySignal && /proof/i.test(proofObject) && imageBackedGallerySignal)
    ) {
      addRule('proof-gallery', 'captioned visual evidence set', 'gallery-signal');
      addRule('caption-bar', 'state what each image proves', 'gallery-signal');
    }
    if (brandWorldStrategySignal) {
      addRule('caption-bar', 'connect brand-world claim to evidence boundary', 'brand-world-proof-link');
    }
    if (productProofSignal && hasStructuredProductEvidence(s) && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(type)) {
      addRule('product-matrix', 'SKU, texture, efficacy, price, or pack proof', 'product-signal');
    }
    const systemValueEligible = !['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(type);
    const hasExplicitSystemValueStructure = ['strategy-map', 'architecture', 'architecture-dark'].includes(type) ||
      Boolean(s.valueChain || s.capitals || s.drivers || s.outcomes || s.inputs || s.outputs || s.layers || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities) ||
      /value-creation|value-chain|brand-world-and-business/i.test(proofObject);
    if (systemValueEligible && hasExplicitSystemValueStructure) {
      addRule(/architecture/.test(type) ? 'system-rail' : 'value-chain', 'show how inputs/actions/outcomes connect', 'system-or-value-chain-signal');
      addRule('commentary-panel', 'turn structure into a management judgment', 'system-or-value-chain-signal', false);
    }
    const processEligible = !['industry-chart', 'metric-comparison', 'finance-bridge', 'portfolio-table', 'case-gallery', 'gallery', 'cover', 'cover-dark', 'closing'].includes(type) && !brandWorldStrategySignal;
    if (['timeline', 'timeline-dark'].includes(type) || (processEligible && (signals.hasTimeline || signals.hasLoop))) {
      addRule('process-rail', 'sequence or operating loop', 'process-signal');
    }
    const riskEligible = !['cover', 'cover-dark', 'closing', 'closing-dark', 'chapter-divider', 'toc', 'toc-clean'].includes(type);
    const riskMatrixExplicit = riskEligible && (hasExplicitRiskMatrixData(s) || /risk-matrix|materiality-matrix/i.test(variant) || /risk-matrix|materiality-matrix/i.test(proofObject));
    const hasGovernanceRows = Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls) ||
      Array.isArray(s.responsibilities) || Array.isArray(s.owners) || Array.isArray(s.accountabilities) || Array.isArray(s.raci) ||
      Boolean(s.riskRegister || s.riskMatrix || s.controlsMatrix || s.matrix || s.responsibilityLoop);
    const nativeGovernanceRoute = ['risk-table', 'table'].includes(type);
    if (riskMatrixExplicit) {
      addRule('risk-matrix', 'rank risk by impact and likelihood or materiality', 'explicit-risk-matrix');
    } else if (riskEligible && (nativeGovernanceRoute || hasGovernanceRows)) {
      const required = nativeGovernanceRoute || hasGovernanceRows;
      const wantsRiskRegister = s.riskRegister || /risk-register/i.test(`${variant} ${proofObject}`);
      addRule(wantsRiskRegister ? 'risk-register' : 'governance-table', 'owner, level, action, and cadence', 'risk-governance-without-matrix', required);
    }
    if ((/governance|control|responsibility/i.test(variant) || signals.hasGovernance || signals.hasResponsibilityLoop) && (nativeGovernanceRoute || hasGovernanceRows)) {
      addRule('governance-table', 'governance rows with owner/action logic', 'governance-signal', false);
    }
    if (hasSourceEvidence(s) && visibleSourceNotesEnabled(plan)) {
      addRule('source-note', 'visible provenance or source boundary', 'source-provenance');
    }
    if (/closing/.test(type) || s.decision || s.nextStep || s.nextSteps || (Array.isArray(s.actions) && s.actions.length && ['closing', 'closing-dark'].includes(type))) {
      addRule('decision-panel', 'next action or closeout decision', 'closing-signal');
    }

    const dialect = industryDesignDialect(plan);
    dialectComponentsFor(plan, s).forEach(id => addComponent(components, { id: componentIdFromHint(id), role: 'industry dialect component', required: false }, 'industry-dialect'));
    const valueCreationMapOwnsProcess = type === 'strategy-map' && /value-creation-process-map/i.test(`${variant} ${proofObject}`);
    const filtered = filterComponentPlanCandidates({
      componentCapabilityFor,
      components,
      dialect,
      flattenText,
      industryEvidenceChain,
      nativeOnlyOptionalComponentAllowed,
      plan,
      productProofSignal,
      proofObject,
      riskEligible,
      riskMatrixExplicit,
      signals,
      slide: s,
      type,
      valueCreationMapOwnsProcess,
      variant
    });
    const { knownComponents, unknownComponents } = enrichComponentPlanOutput({
      componentCapabilityFor,
      effectiveComponentModesFor,
      filtered,
      plan,
      signals,
      slide: s
    });

    return {
      version: 'component-plan/v1',
      strategy: 'component-composition',
      proofObject,
      industryEvidenceChain,
      themeIntent,
      components: knownComponents,
      componentIds: knownComponents.map(c => c.id),
      unknownComponents,
      rulesApplied: compactUnique(rulesApplied),
      riskMatrixPolicy: riskMatrixExplicit ? 'render-only-when-explicit' : 'not-default'
    };
  }

  return {
    componentPlanFor,
    explicitComponentEntries,
    nativeOnlyOptionalComponentAllowed
  };
}
module.exports = {
  addComponent,
  componentIdFromHint,
  createComponentPlanHelpers,
  hasContactBlockData,
  isSystemPlannedComponent,
  normalizeComponentEntry,
  normalizeComponentId
};
