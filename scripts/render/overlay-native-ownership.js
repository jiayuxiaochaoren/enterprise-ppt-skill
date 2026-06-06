const NATIVE_VARIANT_COMPONENTS = {
  'airy-concept-opening': ['hero-image', 'caption-bar'],
  'beauty-brand-editorial-cover': ['hero-image', 'caption-bar'],
  'brand-world-and-business-proof': ['value-chain', 'system-rail', 'commentary-panel', 'hero-image', 'caption-bar', 'kpi-strip'],
  'chart-grid-with-commentary': ['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'scorecard'],
  'consumer-proof-photo-grid': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'],
  'control-stack': ['risk-register', 'governance-table', 'process-rail'],
  'executive-proof-board': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'source-note'],
  'financial-kpi-snapshot': ['kpi-strip', 'metric-strip', 'kpi-primary-metric', 'chart-commentary-panel'],
  'governance-table-editorial': ['risk-register', 'governance-table'],
  'guidance-and-risk-board': ['risk-register', 'governance-table', 'kpi-strip'],
  'lookbook-story': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'],
  'materiality-matrix-board': ['risk-register', 'risk-matrix', 'governance-table'],
  'member-growth-board': ['kpi-strip', 'metric-strip', 'kpi-primary-metric', 'scorecard', 'proof-gallery', 'caption-bar'],
  'mission-statement-stage': ['content-card-grid', 'commentary-panel'],
  'people-proof-mosaic': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'],
  'premium-closing-anchor': ['decision-panel', 'contact-block', 'editorial-end-card'],
  'process-board': ['process-rail', 'value-chain'],
  'product-evidence-story': ['proof-gallery', 'caption-bar', 'hero-image', 'product-matrix'],
  'quarterly-results-summary': ['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'scorecard'],
  'single-object-concept-map': ['hero-image', 'value-chain', 'commentary-panel'],
  'sustainability-proof-spread': ['proof-gallery', 'caption-bar', 'source-note'],
  'value-creation-process-map': ['value-chain', 'value-chain-connector', 'system-rail', 'commentary-panel'],
  'value-principle-cards': ['content-card-grid', 'commentary-panel']
};
const {
  canonicalIndustryEvidenceChainForSlide
} = require('../design/industry-evidence-chain');

const CHART_META_SUPPRESSED_NATIVE_VARIANTS = new Set([
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'control-stack',
  'lookbook-story',
  'process-board',
  'product-evidence-story',
  'value-creation-process-map'
]);

const INDUSTRY_NATIVE_COMPONENTS = new Set([
  'adoption-funnel',
  'disclosure-footnote',
  'equipment-nameplate',
  'governance-table',
  'inspection-matrix',
  'patient-journey-band',
  'permission-audit-tag',
  'prototype-frame',
  'quality-scorecard',
  'risk-register',
  'service-blueprint-lane',
  'site-evidence-frame',
  'value-chain',
  'workflow-rail'
]);

function plannedComponentIdsForSlide(s = {}) {
  const componentPlan = s.componentPlan || {};
  return [
    ...(Array.isArray(componentPlan.componentIds) ? componentPlan.componentIds : []),
    ...(Array.isArray(componentPlan.components) ? componentPlan.components.map(component => component && component.id) : [])
  ].filter(Boolean);
}

function nativeOwnedComponentIdsFor(type = '', variant = '') {
  const ids = new Set();
  (NATIVE_VARIANT_COMPONENTS[variant] || []).forEach(id => ids.add(id));
  if (type === 'cover' || type === 'cover-dark') ['caption-bar', 'proof-gallery', 'product-matrix', 'source-note', 'value-chain'].forEach(id => ids.add(id));
  if (type === 'chapter-divider') ['process-rail', 'value-chain', 'system-rail', 'caption-bar', 'source-note'].forEach(id => ids.add(id));
  if (type === 'timeline' || type === 'timeline-dark') ['value-chain', 'system-rail', 'product-matrix', 'proof-gallery', 'caption-bar', 'source-note'].forEach(id => ids.add(id));
  if (type === 'closing' || type === 'closing-dark') ['value-chain', 'system-rail', 'process-rail', 'product-matrix', 'proof-gallery', 'caption-bar', 'source-note'].forEach(id => ids.add(id));
  return ids;
}

function isEnergyNativeRenderer(plan = {}, rendererName = '') {
  return plan.industry === 'energy-utility' && /^energy/.test(String(rendererName || ''));
}

function energyNativeOwnedComponentIds() {
  return new Set([
    'commentary-panel',
    'load-curve-band',
    'process-rail',
    'risk-register',
    'system-rail',
    'value-chain',
    'value-chain-connector'
  ]);
}

function nativeVariantSuppressesChartMeta(s = {}) {
  const variant = String(s.layoutVariant || s.variant || '');
  return CHART_META_SUPPRESSED_NATIVE_VARIANTS.has(variant) && !(s.chartSpec && s.chartSpec.version === 'chartSpec/v1');
}

function createNativeComponentIdHelpers({
  chartComponentIds = new Set()
} = {}) {
  function nativeComponentIdsFor(planOrSlide = {}, maybeSlide = null) {
    const plan = maybeSlide ? planOrSlide : {};
    const s = maybeSlide || planOrSlide || {};
    const type = String(s.type || '');
    const variant = String(s.layoutVariant || s.variant || '');
    const ids = new Set(['page-number']);
    if (!['cover', 'closing'].includes(type)) ids.add('section-kicker');
    if (/cover/.test(type) || variant.includes('cover')) {
      ['hero-image', 'brand-world-hero', 'large-product-frame', 'meta-folio', 'editorial-index'].forEach(id => ids.add(id));
    }
    if (type === 'chapter-divider' && /hero/.test(variant)) ids.add('hero-image');
    if (type === 'chapter-divider' && (
      /editorial-agenda|image-agenda|hero/i.test(variant) ||
      (Array.isArray(s.images) && s.images.length) ||
      (s.visual && Array.isArray(s.visual.images) && s.visual.images.length)
    )) {
      ['hero-image', 'proof-gallery', 'caption-bar'].forEach(id => ids.add(id));
    }
    if (type === 'metric-comparison' || type === 'industry-chart' || type === 'finance-bridge') {
      ['kpi-strip', 'metric-strip', 'kpi-primary-metric', 'chart-commentary-panel', 'member-ladder', 'basket-metric-strip'].forEach(id => ids.add(id));
      chartComponentIds.forEach(id => ids.add(id));
    }
    if (type === 'toc' || type === 'toc-clean') ids.add('navigation-sequence');
    if (['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks'].includes(type)) ids.add('content-card-grid');
    if (type === 'portfolio-table') {
      ['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'product-matrix', 'table-with-commentary', 'scorecard'].forEach(id => ids.add(id));
    }
    if (type === 'case-gallery' || type === 'gallery' || type === 'portfolio' || type === 'product-showcase') {
      ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'luxury-caption-bar', 'brand-proof-caption', 'product-story-caption', 'evidence-frame', 'source-caption', 'hero-image', 'product-matrix'].forEach(id => ids.add(id));
    }
    if (type === 'strategy-map') {
      ['value-chain', 'value-chain-connector', 'business-proof-rail', 'commentary-panel', 'system-rail', 'brand-world-hero'].forEach(id => ids.add(id));
    }
    if (type === 'architecture' || type === 'architecture-dark') {
      ['system-rail', 'capability-layer-stack', 'commentary-panel'].forEach(id => ids.add(id));
    }
    if (type === 'timeline' || type === 'timeline-dark') {
      ['process-rail', 'campaign-to-member-rail', 'launch-rhythm-strip'].forEach(id => ids.add(id));
    }
    if (type === 'risk-table' || type === 'table') {
      ['risk-register', 'governance-table', 'control-tag'].forEach(id => ids.add(id));
      if (Array.isArray(s.metrics) && s.metrics.length) ids.add('kpi-strip');
      if (Array.isArray(s.phases) || Array.isArray(s.actions) || Array.isArray(s.steps) || Array.isArray(s.timeline) || Array.isArray(s.milestones)) {
        ids.add('process-rail');
      }
      if (/risk-matrix|materiality-matrix/.test(variant) || s.matrix) ids.add('risk-matrix');
    }
    if (type === 'report-board') {
      ['proof-board', 'commentary-panel', 'source-note'].forEach(id => ids.add(id));
    }
    if (type === 'closing') {
      ['decision-panel', 'contact-block', 'editorial-end-card'].forEach(id => ids.add(id));
    }
    const chain = canonicalIndustryEvidenceChainForSlide(plan, s);
    const chainComponents = new Set((chain && chain.components) || []);
    const hasIndustryChain = chain && chain.stageId !== 'neutral-general';
    plannedComponentIdsForSlide(s).forEach(id => {
      if (hasIndustryChain && chainComponents.has(id) && INDUSTRY_NATIVE_COMPONENTS.has(id)) ids.add(id);
    });
    nativeOwnedComponentIdsFor(type, variant).forEach(id => ids.add(id));
    return ids;
  }

  return {
    nativeComponentIdsFor
  };
}

module.exports = {
  CHART_META_SUPPRESSED_NATIVE_VARIANTS,
  INDUSTRY_NATIVE_COMPONENTS,
  NATIVE_VARIANT_COMPONENTS,
  createNativeComponentIdHelpers,
  energyNativeOwnedComponentIds,
  isEnergyNativeRenderer,
  nativeOwnedComponentIdsFor,
  nativeVariantSuppressesChartMeta
};
