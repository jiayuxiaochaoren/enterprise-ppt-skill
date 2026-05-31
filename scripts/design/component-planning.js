function normalizeComponentId(value = '') {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_+\s/]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function componentIdFromHint(value = '') {
  const id = normalizeComponentId(value);
  const aliases = {
    'hero-kpi': 'kpi-strip',
    'hero-kpis': 'kpi-strip',
    'hero-kpi-strip': 'kpi-strip',
    'metric-strip': 'kpi-strip',
    'basket-metric-strip': 'kpi-strip',
    'member-ladder': 'kpi-strip',
    'kpi-primary-metric': 'kpi-primary-metric',
    'primary-kpi': 'kpi-primary-metric',
    'chart-commentary': 'chart-commentary-panel',
    'commentary': 'commentary-panel',
    'commentary-card': 'commentary-panel',
    'source-caption': 'caption-bar',
    'luxury-caption-bar': 'caption-bar',
    'brand-proof-caption': 'caption-bar',
    'product-story-caption': 'caption-bar',
    'proof-gallery-grid': 'proof-gallery',
    'image-gallery': 'proof-gallery',
    'gallery-grid': 'proof-gallery',
    'value-chain-connector': 'value-chain',
    'business-proof-rail': 'value-chain',
    'process-rail': 'process-rail',
    'system-rail': 'system-rail',
    'brand-world-hero': 'hero-image',
    'large-product-frame': 'hero-image',
    'product-proof-callout': 'product-matrix',
    'product-grid': 'product-matrix',
    'risk-board': 'risk-register',
    'control-tag': 'risk-register',
    'governance-table': 'governance-table'
  };
  return aliases[id] || id;
}

function normalizeComponentEntry(component, source = 'explicit') {
  if (!component) return null;
  const rawId = typeof component === 'string'
    ? component
    : (component.id || component.name || component.component || component.type || '');
  const id = componentIdFromHint(rawId);
  if (!id) return null;
  return Object.assign({
    id,
    role: typeof component === 'object' ? (component.role || component.purpose || '') : '',
    required: typeof component === 'object' && component.required != null ? Boolean(component.required) : true,
    source,
    renderer: typeof component === 'object' ? (component.renderer || 'auto') : 'auto'
  }, typeof component === 'object' ? component : {});
}

function addComponent(acc, component, source = 'rule') {
  const entry = normalizeComponentEntry(component, source);
  if (!entry) return;
  if (!acc.some(item => item.id === entry.id)) acc.push(entry);
}

function isSystemPlannedComponent(component = {}) {
  return !['explicit', 'explicit-plan', 'component-hint'].includes(component.source || '');
}

function hasContactBlockData(plan = {}, s = {}) {
  return [
    s.contacts,
    s.contact,
    s.contactBlock,
    s.contact_block,
    plan.contacts,
    plan.contact
  ].some(value => Array.isArray(value) ? value.length > 0 : Boolean(value));
}

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
    proofObjectIdForSlide,
    routeChartSpec,
    slideHasChartIntent,
    themeIntentFor
  } = deps;

  function nativeOnlyOptionalComponentAllowed(plan = {}, s = {}, component = {}, signals = contentSignals(plan, s)) {
    const id = component.id;
    const type = String(s.type || '');
    const variant = String(s.layoutVariant || s.variant || '');
    const proofObject = proofObjectIdForSlide(s);
    const hasRows = Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls);
    const hasMetrics = signals.hasMetrics || Array.isArray(s.metrics);
    const hasArchitecture = signals.hasArchitecture ||
      Boolean(s.layers || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities || s.valueChain || s.capitals);
    const text = `${variant} ${proofObject} ${s.title || ''} ${s.subtitle || ''}`;
    if (id === 'page-number') return true;
    if (id === 'section-kicker') return !['cover', 'cover-dark', 'closing', 'closing-dark'].includes(type);
    if (id === 'navigation-sequence') return ['toc', 'toc-clean'].includes(type);
    if (id === 'content-card-grid') return ['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks'].includes(type);
    if (id === 'contact-block') return ['closing', 'closing-dark'].includes(type) && hasContactBlockData(plan, s);
    if (['governance-table', 'control-tag'].includes(id)) return ['risk-table', 'table'].includes(type) || hasRows || signals.hasResponsibilityLoop;
    if (id === 'kpi-primary-metric') return hasMetrics || ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type);
    if (id === 'load-curve-band') return Boolean(s.loadCurve || s.loadCurveBand || s.curve || s.trend || s.monthlyTrend || s.monthlyPulse) ||
      /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(flattenText(s));
    if (id === 'decision-panel') return ['closing', 'closing-dark'].includes(type);
    if (['system-rail', 'capability-layer-stack'].includes(id)) return ['architecture', 'architecture-dark', 'strategy-map'].includes(type) || hasArchitecture;
    if (['process-rail', 'dispatch-rail'].includes(id)) return ['timeline', 'timeline-dark'].includes(type) && id === 'process-rail';
    return !/(backdrop|frame|chip|tag|node|checkpoint|readout|photo|map|severity|status|telemetry|asset-|site-|alert-)/i.test(`${id} ${text}`);
  }

  function explicitComponentEntries(s = {}) {
    const planComponents = s.componentPlan && Array.isArray(s.componentPlan.components) ? s.componentPlan.components : [];
    const snakeComponents = s.component_plan && Array.isArray(s.component_plan.components) ? s.component_plan.components : [];
    const hints = compactUnique([
      ...(Array.isArray(s.componentHints) ? s.componentHints : []),
      ...(Array.isArray(s.component_hints) ? s.component_hints : []),
      ...(Array.isArray(s.componentSuggestions) ? s.componentSuggestions : []),
      ...(Array.isArray(s.component_suggestions) ? s.component_suggestions : [])
    ]);
    return [
      ...planComponents.map(c => normalizeComponentEntry(c, 'explicit-plan')),
      ...snakeComponents.map(c => normalizeComponentEntry(c, 'explicit-plan')),
      ...hints.map(c => normalizeComponentEntry(c, 'component-hint'))
    ].filter(Boolean);
  }

  function componentPlanFor(plan = {}, s = {}, index = 0, total = 1, signals = contentSignals(plan, s, index, total), composition = null) {
    const type = s.type || '';
    const variant = String(s.layoutVariant || s.variant || '');
    const proofObject = proofObjectIdForSlide(s);
    const cp = composition || s.compositionPlan || {};
    const themeIntent = cp.themeIntent || s.themeIntent || themeIntentFor(plan, s, index, total, signals);
    const components = [];
    const rulesApplied = [];

    explicitComponentEntries(s).forEach(entry => addComponent(components, entry, entry.source || 'explicit'));

    const addRule = (id, role, rule, required = true) => {
      addComponent(components, { id, role, required }, rule);
      rulesApplied.push(rule);
    };

    if (['cover', 'cover-dark'].includes(type) || signals.imageCount > 0 || /hero|cover|brand-world|product|image/i.test(proofObject)) {
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
      addRule('chart-commentary-panel', 'explain what the data proves', 'metric-signal', false);
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
    if (signals.imageCount >= 2 || ['case-gallery', 'gallery', 'portfolio'].includes(type) || /gallery|photo|proof|lookbook|mosaic/i.test(proofObject)) {
      addRule('proof-gallery', 'captioned visual evidence set', 'gallery-signal');
      addRule('caption-bar', 'state what each image proves', 'gallery-signal');
    }
    const productProofSignal =
      Boolean(s.product || (Array.isArray(s.products) && s.products.length)) ||
      type === 'product-showcase' ||
      /sku|product-evidence|texture|efficacy|单品|质地|功效/i.test(proofObject) ||
      /SKU|核心单品|明星单品|质地|功效/i.test([s.title, s.subtitle, s.claim].filter(Boolean).join(' '));
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
    const processEligible = !['industry-chart', 'metric-comparison', 'finance-bridge', 'portfolio-table', 'case-gallery', 'gallery', 'cover', 'cover-dark', 'closing'].includes(type);
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
    const avoid = new Set((dialect.avoidComponents || []).map(componentIdFromHint));
    const hasExplicitVisibleSource = Boolean(s.sourceNote || s.source_note || (s.proof && s.proof.sourceNote));
    const riskRegisterAllowed = riskEligible && (
      type === 'risk-table' ||
      riskMatrixExplicit ||
      Array.isArray(s.rows) ||
      Array.isArray(s.risks) ||
      Array.isArray(s.controls) ||
      Boolean(s.riskRegister || s.riskMatrix || s.controlsMatrix || s.matrix)
    );
    const processRailAllowed = ['timeline', 'timeline-dark'].includes(type) ||
      Array.isArray(s.phases) ||
      Array.isArray(s.actions) ||
      Array.isArray(s.steps) ||
      Array.isArray(s.timeline) ||
      Array.isArray(s.milestones);
    const systemRailAllowed = ['architecture', 'architecture-dark', 'strategy-map'].includes(type) ||
      signals.hasArchitecture ||
      Boolean(s.layers || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities || s.valueChain || s.capitals);
    const productMatrixAllowed = productProofSignal ||
      ['product-showcase', 'case-gallery', 'gallery', 'portfolio'].includes(type) ||
      Array.isArray(s.products) ||
      Array.isArray(s.productStory);
    const energyCurveAllowed = plan.industry !== 'energy-utility' || s.loadCurve || s.loadCurveBand || s.curve || s.trend || s.monthlyTrend || s.monthlyPulse ||
      /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(flattenText(s));
    const filtered = components
      .filter(component => !avoid.has(component.id))
      .filter(component => type !== 'portfolio-table' || !['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'product-matrix'].includes(component.id))
      .filter(component => !['risk-register', 'risk-matrix'].includes(component.id) || riskRegisterAllowed)
      .filter(component => component.id !== 'process-rail' || processRailAllowed)
      .filter(component => component.id !== 'system-rail' || systemRailAllowed)
      .filter(component => component.id !== 'product-matrix' || productMatrixAllowed)
      .filter(component => component.id !== 'load-curve-band' || energyCurveAllowed)
      .filter(component => component.id !== 'source-note' || hasExplicitVisibleSource)
      .filter(component => {
        const capability = componentCapabilityFor(component.id);
        if (!capability || capability.ownershipPolicy !== 'native-only') return true;
        if (component.required !== false) return true;
        if (!isSystemPlannedComponent(component)) return true;
        return nativeOnlyOptionalComponentAllowed(plan, s, component, signals);
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
