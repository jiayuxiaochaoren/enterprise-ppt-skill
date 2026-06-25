const {
  normalizeComponentId
} = require('./component-planning-normalization');

const CARD_GRID_TYPES = new Set(['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks', 'manifesto']);
const CHART_TYPES = new Set(['metric-comparison', 'industry-chart', 'finance-bridge']);
const IMAGE_EVIDENCE_TYPES = new Set(['case-gallery', 'gallery', 'portfolio', 'product-showcase']);
const NATIVE_INDUSTRY_VARIANT_CHART_OWNERS = new Set([
  'adoption-funnel',
  'dispatch-map',
  'loss-pareto',
  'issue-frequency-ranking',
  'review-sentiment-ranking',
  'fact-metrics',
  'member-cohort-ladder',
  'patient-bottleneck',
  'quality-handoff',
  'valuation-sensitivity'
]);
const PROCESS_TYPES = new Set(['timeline', 'timeline-dark']);
const SYSTEM_TYPES = new Set(['architecture', 'architecture-dark', 'strategy-map']);
const RISK_TYPES = new Set(['risk-table', 'table']);

function hasArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasAnyArray(slide = {}, fields = []) {
  return fields.some(field => hasArray(slide[field]));
}

function hasRenderableImageEvidence(slide = {}) {
  const visual = slide.visual || {};
  return Boolean(slide.image || visual.image) ||
    hasArray(slide.images) ||
    hasArray(visual.images);
}

function hasStructuredMetricEvidence(slide = {}) {
  return hasArray(slide.metrics) ||
    Boolean(slide.oee || slide.oeeComponents || slide.monthlyPulse || slide.monthlyTrend || slide.waterfallBridge || slide.targetBridge || slide.channelEfficiency || slide.mediaEfficiency || slide.memberCohorts || slide.adoptionFunnel);
}

function hasStructuredProductEvidence(slide = {}) {
  return Boolean(slide.product) ||
    hasAnyArray(slide, ['products', 'productStory', 'productItems', 'skus', 'lookbook']);
}

function hasStructuredProofGalleryEvidence(slide = {}) {
  return hasRenderableImageEvidence(slide) ||
    hasStructuredProductEvidence(slide) ||
    hasAnyArray(slide, ['proofItems', 'evidenceItems', 'galleryItems']) ||
    (String(slide.type || '') === 'report-board' && hasAnyArray(slide, ['cards', 'items']));
}

function hasStructuredProcessEvidence(slide = {}, signals = {}) {
  return PROCESS_TYPES.has(slide.type || '') ||
    hasAnyArray(slide, ['phases', 'actions', 'steps', 'timeline', 'milestones', 'workflow', 'workflows', 'platformCapabilities', 'capabilityMap', 'automationWorkflow']) ||
    Boolean(slide.platformCapabilities || slide.capabilityMap || slide.automationWorkflow || signals.hasTimeline || signals.hasLoop);
}

function hasPrototypeWorkflowEvidence(slide = {}) {
  const routeText = `${slide.type || ''}:${slide.layoutVariant || slide.variant || ''}:${slide.proofObject || slide.proof_object || ''}`;
  return /prototype-flow|automation-workflow/i.test(routeText) &&
    (hasAnyArray(slide, ['cards', 'items', 'images']) ||
      Boolean(slide.prototypeFlow || slide.prototype || slide.image || (slide.visual && (slide.visual.image || hasArray(slide.visual.images)))));
}

function hasStructuredRiskEvidence(slide = {}, signals = {}) {
  return RISK_TYPES.has(slide.type || '') ||
    hasAnyArray(slide, ['rows', 'risks', 'controls']) ||
    Boolean(slide.riskRegister || slide.riskMatrix || slide.controlsMatrix || slide.matrix || signals.hasRisk || signals.hasResponsibilityLoop);
}

function hasStructuredSystemEvidence(slide = {}, signals = {}) {
  return SYSTEM_TYPES.has(slide.type || '') ||
    hasAnyArray(slide, ['layers', 'valueChain', 'capitals', 'drivers', 'outcomes', 'inputs', 'outputs']) ||
    Boolean(slide.architecture || slide.systemMap || slide.topology || slide.capabilityMap || slide.platformCapabilities || signals.hasArchitecture || signals.hasStructuredLogic);
}

function hasStructuredValueEvidence(slide = {}, signals = {}) {
  return hasStructuredSystemEvidence(slide, signals) ||
    hasStructuredProcessEvidence(slide, signals) ||
    hasAnyArray(slide, ['actions', 'items', 'cards', 'portfolio', 'holdings', 'allocation', 'bridge', 'capitalBridge', 'valueDrivers', 'returns', 'touchpoints', 'customerJourney', 'journeyMap']) ||
    Boolean(slide.valueChain || slide.investmentThesis || slide.assumptions || slide.bridge || slide.capitalBridge || slide.portfolio || slide.holdings || slide.allocation || slide.conversion || slide.retention || slide.customerJourney || slide.journeyMap);
}

function explicitChartEvidence(slide = {}) {
  return Boolean(slide.chartSpec || slide.chartKind || slide.chart_kind || slide.dataComponent || slide.data_component);
}

function nativeIndustryVariantOwnsChartComponent(type = '', variant = '') {
  return type === 'industry-chart' && NATIVE_INDUSTRY_VARIANT_CHART_OWNERS.has(String(variant || ''));
}

function routeComponentCapability(componentId = '', options = {}) {
  const id = normalizeComponentId(componentId);
  const slide = options.slide || {};
  const signals = options.signals || {};
  const type = String(slide.type || '');
  const component = options.component || {};
  const source = String(component.source || '');
  const explicitHint = ['explicit', 'explicit-plan', 'component-hint'].includes(source);
  const chartRoute = CHART_TYPES.has(type);
  const imageRoute = IMAGE_EVIDENCE_TYPES.has(type);
  const brandWorldStrategy = type === 'strategy-map' &&
    /brand-world|brand-world-and-business/i.test(`${slide.layoutVariant || ''} ${slide.variant || ''} ${slide.proofObject || slide.proof_object || ''}`);

  if (id === 'content-card-grid') {
    return { allowed: CARD_GRID_TYPES.has(type) || type === 'report-board', reason: 'card-grid route family' };
  }
  if (id === 'navigation-sequence') {
    return { allowed: ['toc', 'toc-clean', 'chapter-divider'].includes(type), reason: 'navigation route family' };
  }
  if (id === 'kpi-strip' || id === 'metric-strip') {
    const allowed = chartRoute || hasStructuredMetricEvidence(slide);
    return {
      allowed,
      reason: allowed ? 'explicit metric evidence or chart route' : 'metric overlays require explicit metrics, not numeric prose'
    };
  }
  if (id === 'kpi-primary-metric') {
    return { allowed: chartRoute || hasStructuredMetricEvidence(slide), reason: 'primary metric requires chart route or explicit metrics' };
  }
  if (id === 'chart-commentary-panel') {
    return { allowed: chartRoute || explicitChartEvidence(slide), reason: 'chart commentary requires chart route or explicit chart evidence' };
  }
  if (id === 'adoption-funnel') {
    const routeText = `${slide.layoutVariant || ''} ${slide.variant || ''} ${slide.proofObject || slide.proof_object || ''}`;
    const allowed = hasAnyArray(slide, ['adoptionFunnel', 'activationFunnel', 'cohortFunnel', 'funnel']) ||
      Boolean(slide.adoptionFunnel || slide.activationFunnel || slide.cohortFunnel || slide.funnel) ||
      (type === 'industry-chart' && /adoption-funnel/i.test(routeText));
    return { allowed, reason: allowed ? 'structured adoption funnel evidence' : 'adoption-funnel requires funnel fields or a funnel route' };
  }
  if (['line-chart', 'bar-chart', 'waterfall-chart', 'funnel-chart', 'matrix-chart', 'heatmap-chart', 'pareto-chart', 'scorecard', 'table-with-commentary', 'information-gap'].includes(id) || /^beauty-/.test(id)) {
    return { allowed: chartRoute || explicitChartEvidence(slide), reason: 'chart components require chart-capable route' };
  }
  if (id === 'product-matrix') {
    const allowed = hasStructuredProductEvidence(slide) || (imageRoute && /product|sku|showcase/i.test(`${slide.layoutVariant || ''} ${slide.variant || ''} ${slide.proofObject || slide.proof_object || ''}`));
    return {
      allowed,
      reason: allowed ? 'structured product evidence' : 'product matrix requires products/productStory/SKU data, not product keywords alone'
    };
  }
  if (id === 'caption-bar') {
    const allowed = brandWorldStrategy ||
      imageRoute ||
      hasStructuredProofGalleryEvidence(slide) ||
      ((type === 'cover' || type === 'cover-dark') && /culture-cover-with-soft-geometry/.test(`${slide.layoutVariant || ''} ${slide.variant || ''} ${slide.proofObject || slide.proof_object || ''}`));
    return { allowed, reason: allowed ? 'visual proof, brand-world bridge, or structured caption evidence' : 'caption-bar requires proof, image, or brand-world strategy context' };
  }
  if (id === 'proof-gallery' || id === 'proof-gallery-grid') {
    const allowed = imageRoute || hasStructuredProofGalleryEvidence(slide);
    return { allowed, reason: allowed ? 'visual or structured proof evidence' : 'gallery components require images or structured proof items' };
  }
  if (id === 'hero-image') {
    const allowed = ['cover', 'cover-dark', ...IMAGE_EVIDENCE_TYPES].includes(type) || brandWorldStrategy || hasRenderableImageEvidence(slide) || explicitHint;
    return { allowed, reason: allowed ? 'hero/image route, brand-world strategy, or explicit hint' : 'hero-image requires image-capable route or explicit evidence' };
  }
  if (id === 'process-rail' || id === 'workflow-rail') {
    const allowed = hasStructuredProcessEvidence(slide, signals) || (id === 'workflow-rail' && hasPrototypeWorkflowEvidence(slide));
    return { allowed, reason: allowed ? 'process or prototype workflow evidence' : 'process rail requires process fields' };
  }
  if (id === 'risk-register' || id === 'risk-matrix' || id === 'governance-table') {
    return { allowed: hasStructuredRiskEvidence(slide, signals), reason: 'risk/governance components require risk rows or structure' };
  }
  if (id === 'system-rail') {
    return { allowed: hasStructuredSystemEvidence(slide, signals), reason: 'system/value components require architecture or value-chain structure' };
  }
  if (id === 'value-chain' || id === 'value-chain-connector') {
    return { allowed: hasStructuredValueEvidence(slide, signals), reason: 'value-chain components require value/action structure' };
  }
  return { allowed: true, reason: 'route capability not restricted' };
}

module.exports = {
  CARD_GRID_TYPES,
  CHART_TYPES,
  IMAGE_EVIDENCE_TYPES,
  nativeIndustryVariantOwnsChartComponent,
  PROCESS_TYPES,
  RISK_TYPES,
  SYSTEM_TYPES,
  hasRenderableImageEvidence,
  hasStructuredMetricEvidence,
  hasStructuredProductEvidence,
  routeComponentCapability
};
