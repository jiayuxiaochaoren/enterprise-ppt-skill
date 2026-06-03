const {
  hasContactBlockData,
  normalizeComponentEntry
} = require('./component-planning-normalization');

function createExplicitComponentEntries({
  compactUnique = values => Array.from(new Set((values || []).filter(Boolean)))
} = {}) {
  return function explicitComponentEntries(s = {}) {
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
  };
}

function createNativeOnlyOptionalComponentAllowed({
  contentSignals = () => ({}),
  flattenText = value => String(value || ''),
  proofObjectIdForSlide = () => ''
} = {}) {
  return function nativeOnlyOptionalComponentAllowed(plan = {}, s = {}, component = {}, signals = contentSignals(plan, s)) {
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
  };
}

function createComponentPlanningInputHelpers(deps = {}) {
  return {
    explicitComponentEntries: createExplicitComponentEntries(deps),
    nativeOnlyOptionalComponentAllowed: createNativeOnlyOptionalComponentAllowed(deps)
  };
}

module.exports = {
  createComponentPlanningInputHelpers,
  createExplicitComponentEntries,
  createNativeOnlyOptionalComponentAllowed
};
