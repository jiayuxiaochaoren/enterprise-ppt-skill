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
  filterComponentPlanCandidates
} = require('./component-planning-filters');
const {
  inferIndustryEvidenceChain
} = require('./industry-evidence-chain');
const {
  industryChainComponentAllowed
} = require('./industry-evidence-chain-components');

function createComponentPlanHelpers(deps = {}) {
  const {
    chartSpecToComponentId,
    compactUnique,
    componentCapabilityFor,
    contentSignals,
    dialectComponentsFor,
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
    const visual = s.visual || {};
    const directImageCount = (s.image || visual.image ? 1 : 0) +
      (Array.isArray(s.images) ? s.images.length : 0) +
      (Array.isArray(visual.images) ? visual.images.length : 0);
    const galleryEligible = !['cover', 'cover-dark', 'closing', 'closing-dark', 'chapter-divider', 'toc', 'toc-clean'].includes(type);
    const brandWorldStrategySignal = type === 'strategy-map' && /brand-world|brand-world-and-business/i.test(`${variant} ${proofObject}`);
    const brandConsumerSceneSignal = /brand|consumer|retail|beauty|lookbook|shopper|store|柜台|门店|陳列|陈列|消费者|消費者|会员|會員|复购|復購|种草|品牌故事|产品故事/i.test(slideRouteText);
    const productStorySignal = Array.isArray(s.productStory) && s.productStory.length;
    const explicitProductMatrixTextSignal = /SKU|核心单品|明星单品|單品|单品|質地|质地|功效|efficacy|texture/i.test([s.title, s.subtitle, s.claim, proofObject].filter(Boolean).join(' '));
    const productShowcaseHasEvidence = type === 'product-showcase' && (directImageCount > 0 || productStorySignal || (Array.isArray(s.products) && s.products.length) || explicitProductMatrixTextSignal);
    const productProofSignal =
      Boolean(s.product || (Array.isArray(s.products) && s.products.length) || productStorySignal) ||
      productShowcaseHasEvidence ||
      /sku|product-evidence|product-showcase|texture|efficacy|单品|質地|质地|功效/i.test(proofObject) ||
      explicitProductMatrixTextSignal;
    const explicitGalleryRouteSignal = ['case-gallery', 'gallery', 'portfolio'].includes(type) ||
      (!brandWorldStrategySignal && /gallery|photo|lookbook|mosaic/i.test(`${variant} ${proofObject}`));
    const imageBackedGallerySignal = signals.imageCount >= 2 || directImageCount > 0;
    const productStoryGallerySignal = productStorySignal && (imageBackedGallerySignal || /product-evidence|product-showcase|gallery|photo|lookbook/i.test(`${variant} ${proofObject} ${type}`));
    const brandSceneGallerySignal = brandConsumerSceneSignal && imageBackedGallerySignal;

    explicitComponentEntries(s).forEach(entry => addComponent(components, entry, entry.source || 'explicit'));

    const addRule = (id, role, rule, required = true) => {
      addComponent(components, { id, role, required }, rule);
      rulesApplied.push(rule);
    };
    const pack = typeof industryPackFor === 'function' ? industryPackFor(plan) : null;
    const industryEvidenceChain = inferIndustryEvidenceChain(plan, s, {
      visualGrammar: pack && pack.visualGrammar ? pack.visualGrammar : null
    });
    if (industryEvidenceChain.stageId !== 'neutral-general') {
      (industryEvidenceChain.components || []).forEach(id => {
        if (!industryChainComponentAllowed(id, {
          directImageCount,
          evidenceChain: industryEvidenceChain,
          productProofSignal,
          signals,
          slide: s,
          type
        })) return;
        addRule(
          id,
          `industry evidence chain: ${industryEvidenceChain.stageLabel}`,
          `industry-evidence-chain:${industryEvidenceChain.stageId}`,
          true
        );
      });
    }

    const proofObjectVisualAnchor = /hero|cover|brand-world|(?:^|[-_])product(?:$|[-_])|image/i.test(proofObject);
    const heroImageRouteEligible = ['cover', 'cover-dark', 'case-gallery', 'gallery', 'portfolio', 'product-showcase', 'company-profile-spread'].includes(type) ||
      proofObjectVisualAnchor ||
      /hero|cover|brand|showcase|lookbook|gallery|photo|image/i.test(variant);
    if (['cover', 'cover-dark'].includes(type) || (signals.imageCount > 0 && heroImageRouteEligible) || proofObjectVisualAnchor) {
      addRule('hero-image', 'primary visual or brand-world anchor', 'visual-or-cover-signal', !['toc', 'toc-clean'].includes(type));
    }
    if (['toc', 'toc-clean'].includes(type)) {
      addRule('navigation-sequence', 'native navigation path or agenda sequence', 'toc-navigation');
    }
    if (['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks'].includes(type)) {
      addRule('content-card-grid', 'native card grid or editorial content body', 'native-content-grid');
    }
    const metricEligible = !['cover', 'cover-dark', 'closing', 'chapter-divider', 'toc', 'toc-clean', 'risk-table', 'portfolio-table', 'timeline', 'timeline-dark'].includes(type);
    if ((metricEligible && signals.hasMetrics) || ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) {
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
    if (chartIntent && chartComponentId && !inferredInformationGap && (explicitChartSignal || chartEligibleRoute) && !['cover', 'cover-dark', 'closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(type)) {
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
    if (productProofSignal && !['cover', 'closing', 'chapter-divider', 'toc', 'toc-clean'].includes(type)) {
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
    const riskMatrixExplicit = riskEligible && (Boolean(s.matrix) || /risk-matrix|materiality-matrix/i.test(variant) || /risk-matrix|materiality-matrix/i.test(proofObject));
    if (riskMatrixExplicit) {
      addRule('risk-matrix', 'rank risk by impact and likelihood or materiality', 'explicit-risk-matrix');
    } else if (riskEligible && (type === 'risk-table' || signals.hasRisk || signals.hasResponsibilityLoop)) {
      const hasRiskRows = Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls);
      const required = type === 'risk-table' || signals.hasRisk || signals.hasResponsibilityLoop || hasRiskRows;
      addRule('risk-register', 'owner, level, action, and cadence', 'risk-governance-without-matrix', required);
    }
    if (/governance|control|responsibility/i.test(variant) || signals.hasGovernance || signals.hasResponsibilityLoop) {
      addRule('governance-table', 'governance rows with owner/action logic', 'governance-signal', false);
    }
    if (s.sourceNote || s.source_note || (s.proof && s.proof.sourceNote)) {
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
    const unknownComponents = [];
    const knownComponents = filtered
      .map(component => {
        const capability = componentCapabilityFor(component.id);
        if (!capability) {
          unknownComponents.push({
            id: component.id,
            source: component.source || '',
            required: component.required !== false
          });
          return null;
        }
        return Object.assign({}, component, {
          supportedModes: capability.supportedModes,
          allowedModes: component.allowedModes || component.allowed_modes || capability.supportedModes,
          ownershipPolicy: capability.ownershipPolicy,
          componentFamily: capability.family,
          dataRequirements: component.dataRequirements || capability.dataRequirements || [],
          slotPolicy: component.slotPolicy || component.slot_policy || (capability.supportedModes.includes('overlay') ? 'declared-safe-slot-required' : 'native-evidence-required'),
          repairPolicy: component.repairPolicy || component.repair_policy || (component.required === false ? 'optional-drop-allowed' : 'no-unplanned-repair'),
          priority: component.priority || (component.required === false ? 'optional' : 'required')
        });
      })
      .filter(Boolean);

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
