const {
  isSystemPlannedComponent,
  normalizeComponentId
} = require('./component-planning-normalization');
const {
  routeComponentCapability
} = require('./route-component-capabilities');
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
    Array.isArray(slide.milestones) ||
    Array.isArray(slide.workflow) ||
    Array.isArray(slide.workflows));
  const systemRailAllowed = ['architecture', 'architecture-dark', 'strategy-map'].includes(type) ||
    signals.hasArchitecture ||
    Boolean(slide.layers || slide.architecture || slide.systemMap || slide.topology || slide.capabilityMap || slide.platformCapabilities || slide.valueChain || slide.capitals);
  const productMatrixAllowed = productProofSignal ||
    ['product-showcase', 'case-gallery', 'gallery', 'portfolio'].includes(type) ||
    Array.isArray(slide.products) ||
    Array.isArray(slide.productStory);
  const visual = slide.visual || {};
  const hasRenderableImageEvidence = Boolean(slide.image || visual.image) ||
    (Array.isArray(slide.images) && slide.images.length > 0) ||
    (Array.isArray(visual.images) && visual.images.length > 0);
  const valueCreationSuppressesStaleVisualEvidence = valueCreationMapOwnsProcess && !hasRenderableImageEvidence;
  return components
    .filter(component => !avoid.has(component.id))
    .filter(component => type !== 'portfolio-table' || !['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'product-matrix'].includes(component.id))
    .filter(component => !valueCreationSuppressesStaleVisualEvidence || !['hero-image', 'caption-bar', 'proof-gallery', 'proof-gallery-grid'].includes(component.id))
    .filter(component => !['risk-register', 'risk-matrix'].includes(component.id) || riskRegisterAllowed || !isSystemPlannedComponent(component))
    .filter(component => component.id !== 'process-rail' || processRailAllowed || !isSystemPlannedComponent(component))
    .filter(component => component.id !== 'system-rail' || systemRailAllowed || !isSystemPlannedComponent(component))
    .filter(component => component.id !== 'product-matrix' || productMatrixAllowed || !isSystemPlannedComponent(component))
    .filter(component => component.id !== 'source-note' || (sourceNoteVisible && (hasExplicitVisibleSource || hasRenderableSourceTrace)))
    .filter(component => {
      const routeCapability = routeComponentCapability(component.id, {
        component,
        plan,
        slide,
        signals
      });
      if (routeCapability.allowed) return true;
      return !isSystemPlannedComponent(component);
    })
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
