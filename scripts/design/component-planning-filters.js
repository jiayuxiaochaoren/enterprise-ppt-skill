const {
  isSystemPlannedComponent,
  normalizeComponentId
} = require('./component-planning-normalization');
const {
  hasVisibleSourceNote,
  sourceTraceIsExplainable,
  visibleSourceNotesEnabled
} = require('./source-evidence');

function filterComponentPlanCandidates(options = {}) {
  const {
    componentCapabilityFor,
    components = [],
    dialect = {},
    flattenText,
    industryEvidenceChain = {},
    nativeOnlyOptionalComponentAllowed,
    plan = {},
    productProofSignal = false,
    proofObject = '',
    riskEligible = false,
    riskMatrixExplicit = false,
    signals = {},
    slide = {},
    type = '',
    valueCreationMapOwnsProcess = false,
    variant = ''
  } = options;
  const avoid = new Set([
    ...((dialect.avoidComponents || []).map(normalizeComponentId)),
    ...((industryEvidenceChain.avoidComponents || []).map(normalizeComponentId))
  ]);
  const hasExplicitVisibleSource = hasVisibleSourceNote(slide);
  const hasRenderableSourceTrace = sourceTraceIsExplainable(slide);
  const sourceNoteVisible = visibleSourceNotesEnabled(plan);
  const portfolioRowsAreAssetRows = type === 'portfolio-table' &&
    !Array.isArray(slide.risks) &&
    !Array.isArray(slide.controls) &&
    !slide.riskRegister &&
    !slide.riskMatrix &&
    !slide.controlsMatrix &&
    !slide.matrix;
  const riskRegisterAllowed = riskEligible && !portfolioRowsAreAssetRows && (
    type === 'risk-table' ||
    riskMatrixExplicit ||
    Array.isArray(slide.rows) ||
    Array.isArray(slide.risks) ||
    Array.isArray(slide.controls) ||
    Boolean(slide.riskRegister || slide.riskMatrix || slide.controlsMatrix || slide.matrix)
  );
  const processRailAllowed = !valueCreationMapOwnsProcess && (['timeline', 'timeline-dark'].includes(type) ||
    Array.isArray(slide.phases) ||
    Array.isArray(slide.actions) ||
    Array.isArray(slide.steps) ||
    Array.isArray(slide.timeline) ||
    Array.isArray(slide.milestones));
  const systemRailAllowed = ['architecture', 'architecture-dark', 'strategy-map'].includes(type) ||
    signals.hasArchitecture ||
    Boolean(slide.layers || slide.architecture || slide.systemMap || slide.topology || slide.capabilityMap || slide.platformCapabilities || slide.valueChain || slide.capitals);
  const productMatrixAllowed = productProofSignal ||
    ['product-showcase', 'case-gallery', 'gallery', 'portfolio'].includes(type) ||
    Array.isArray(slide.products) ||
    Array.isArray(slide.productStory);
  const energyCurveAllowed = plan.industry !== 'energy-utility' || slide.loadCurve || slide.loadCurveBand || slide.curve || slide.trend || slide.monthlyTrend || slide.monthlyPulse ||
    /曲线|趋势|负荷|SOC|load|curve|trend|pulse/i.test(flattenText(slide));
  return components
    .filter(component => !avoid.has(component.id))
    .filter(component => type !== 'portfolio-table' || !['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'product-matrix'].includes(component.id))
    .filter(component => !['risk-register', 'risk-matrix'].includes(component.id) || riskRegisterAllowed)
    .filter(component => component.id !== 'process-rail' || processRailAllowed)
    .filter(component => component.id !== 'system-rail' || systemRailAllowed)
    .filter(component => component.id !== 'product-matrix' || productMatrixAllowed)
    .filter(component => component.id !== 'load-curve-band' || energyCurveAllowed)
    .filter(component => component.id !== 'source-note' || (sourceNoteVisible && (hasExplicitVisibleSource || hasRenderableSourceTrace)))
    .filter(component => {
      const capability = componentCapabilityFor(component.id);
      if (!capability || capability.ownershipPolicy !== 'native-only') return true;
      if (component.required !== false) return true;
      if (!isSystemPlannedComponent(component)) return true;
      return nativeOnlyOptionalComponentAllowed(plan, slide, component, signals);
    });
}

module.exports = {
  filterComponentPlanCandidates
};
