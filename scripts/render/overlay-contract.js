const OVERLAY_PRONE_COMPONENT_IDS = [
  'caption-bar',
  'chart-commentary-panel',
  'commentary-panel',
  'governance-table',
  'hero-image',
  'information-gap',
  'kpi-primary-metric',
  'kpi-strip',
  'metric-strip',
  'process-rail',
  'product-matrix',
  'proof-gallery',
  'proof-gallery-grid',
  'risk-matrix',
  'risk-register',
  'scorecard',
  'source-note',
  'system-rail',
  'table-with-commentary',
  'value-chain',
  'value-chain-connector'
];

const CHART_COMPONENT_IDS = new Set([
  'bar-chart',
  'beauty-channel-structure',
  'beauty-efficacy-table',
  'beauty-member-repurchase',
  'beauty-price-band-matrix',
  'beauty-proof-gallery',
  'beauty-review-sentiment',
  'beauty-sku-matrix',
  'beauty-social-funnel',
  'beauty-sustainability-matrix',
  'funnel-chart',
  'heatmap-chart',
  'information-gap',
  'line-chart',
  'matrix-chart',
  'pareto-chart',
  'scorecard',
  'table-with-commentary',
  'waterfall-chart'
]);

const NATIVE_VARIANT_COMPONENTS = {
  'airy-concept-opening': ['hero-image', 'caption-bar'],
  'beauty-brand-editorial-cover': ['hero-image', 'caption-bar'],
  'brand-world-and-business-proof': ['value-chain', 'system-rail', 'commentary-panel', 'hero-image', 'caption-bar'],
  'chart-grid-with-commentary': ['kpi-strip', 'metric-strip', 'chart-commentary-panel', 'scorecard'],
  'consumer-proof-photo-grid': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'],
  'control-stack': ['risk-register', 'governance-table', 'process-rail'],
  'executive-proof-board': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'source-note'],
  'financial-kpi-snapshot': ['kpi-strip', 'metric-strip', 'kpi-primary-metric', 'chart-commentary-panel'],
  'governance-table-editorial': ['risk-register', 'governance-table'],
  'guidance-and-risk-board': ['risk-register', 'governance-table', 'kpi-strip'],
  'lookbook-story': ['proof-gallery', 'proof-gallery-grid', 'caption-bar', 'hero-image'],
  'materiality-matrix-board': ['risk-register', 'risk-matrix', 'governance-table'],
  'member-growth-board': ['kpi-strip', 'metric-strip', 'kpi-primary-metric', 'scorecard'],
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

const CHART_META_SUPPRESSED_NATIVE_VARIANTS = new Set([
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'control-stack',
  'lookbook-story',
  'process-board',
  'product-evidence-story',
  'value-creation-process-map'
]);

function plannedComponentsForSlide(s = {}) {
  const components = s.componentPlan && Array.isArray(s.componentPlan.components) ? s.componentPlan.components : [];
  return components.map(component => typeof component === 'string' ? { id: component, required: true } : component)
    .filter(component => component && component.id);
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

function reportBoardNeedsRightOverlayRail(s = {}) {
  if (String(s.type || '') !== 'report-board') return false;
  const rightRailComponents = new Set([
    'proof-gallery',
    'proof-gallery-grid',
    'risk-register',
    'risk-matrix',
    'governance-table',
    'product-matrix'
  ]);
  return plannedComponentsForSlide(s).some(component =>
    component &&
    component.required !== false &&
    rightRailComponents.has(component.id)
  );
}

function nativeVariantSuppressesChartMeta(s = {}) {
  const variant = String(s.layoutVariant || s.variant || '');
  return CHART_META_SUPPRESSED_NATIVE_VARIANTS.has(variant) && !(s.chartSpec && s.chartSpec.version === 'chartSpec/v1');
}

function createOverlayContractHelpers(deps = {}) {
  const {
    canvasHeight,
    canvasWidth,
    zone,
    zonesIntersect
  } = deps;
  const W = () => Number(typeof canvasWidth === 'function' ? canvasWidth() : canvasWidth) || 13.333;
  const H = () => Number(typeof canvasHeight === 'function' ? canvasHeight() : canvasHeight) || 7.5;
  const z = typeof zone === 'function'
    ? zone
    : (id, x, y, w, h, role = 'native') => ({ id, x: Number(x), y: Number(y), w: Number(w), h: Number(h), role });
  const intersects = typeof zonesIntersect === 'function'
    ? zonesIntersect
    : ((a = {}, b = {}, pad = 0.015) => {
      const ra = { x: Number(a.x || 0), y: Number(a.y || 0), w: Number(a.w || 0), h: Number(a.h || 0) };
      const rb = { x: Number(b.x || 0), y: Number(b.y || 0), w: Number(b.w || 0), h: Number(b.h || 0) };
      return Math.max(ra.x, rb.x) < Math.min(ra.x + ra.w, rb.x + rb.w) - pad &&
        Math.max(ra.y, rb.y) < Math.min(ra.y + ra.h, rb.y + rb.h) - pad;
    });

  function defaultSafeOverlayZonesFor(s = {}) {
    const type = String(s.type || '');
    if (['cover', 'cover-dark'].includes(type)) {
      return {
        'source-note': z('source-note-footer', 0.82, 7.02, 7.80, 0.22, 'safe-overlay')
      };
    }
    if (['closing', 'closing-dark', 'toc', 'toc-clean', 'chapter-divider'].includes(type)) return {};
    if (type === 'report-board') {
      const rightRail = reportBoardNeedsRightOverlayRail(s);
      const zones = {
        'caption-bar': z('caption-bar-lower-left', 0.86, 6.44, 4.80, 0.36, 'safe-overlay'),
        'hero-image': z('hero-image-side-pocket', 8.18, 1.08, 3.20, 2.48, 'safe-overlay'),
        'kpi-strip': z('kpi-strip-bottom-band', 0.86, 6.34, 10.30, 0.58, 'safe-overlay'),
        'metric-strip': z('kpi-strip-bottom-band', 0.86, 6.34, 10.30, 0.58, 'safe-overlay'),
        'process-rail': z('process-rail-bottom-left', 0.94, 6.36, 4.48, 0.50, 'safe-overlay'),
        'source-note': z('source-note-footer-right', 8.10, 7.02, 4.20, 0.22, 'safe-overlay'),
        'system-rail': z('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay'),
        'value-chain': z('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay'),
        'value-chain-connector': z('value-chain-lower-right', 8.04, 6.34, 3.62, 0.50, 'safe-overlay')
      };
      if (rightRail) {
        Object.assign(zones, {
          'chart-commentary-panel': z('commentary-right-rail', 8.04, 5.96, 3.72, 0.48, 'safe-overlay'),
          'commentary-panel': z('commentary-right-rail', 8.04, 5.92, 3.72, 0.52, 'safe-overlay'),
          'product-matrix': z('product-matrix-right-rail', 8.04, 4.90, 3.58, 0.64, 'safe-overlay'),
          'proof-gallery': z('proof-gallery-right-rail', 8.04, 5.46, 3.72, 0.80, 'safe-overlay'),
          'risk-register': z('risk-register-right-rail', 8.04, 4.68, 3.72, 1.70, 'safe-overlay')
        });
      }
      return zones;
    }
    return {
      'caption-bar': z('caption-bar-lower-left', 0.86, 6.44, 4.80, 0.36, 'safe-overlay'),
      'chart-commentary-panel': z('commentary-lower-right', 8.22, 5.96, 3.42, 0.50, 'safe-overlay'),
      'commentary-panel': z('commentary-side-pocket', 9.10, 5.70, 2.44, 0.58, 'safe-overlay'),
      'hero-image': z('hero-image-side-pocket', 8.18, 1.08, 3.20, 2.48, 'safe-overlay'),
      'kpi-strip': z('kpi-strip-bottom-band', 0.86, 6.06, 10.30, 0.66, 'safe-overlay'),
      'metric-strip': z('kpi-strip-bottom-band', 0.86, 6.06, 10.30, 0.66, 'safe-overlay'),
      'process-rail': z('process-rail-bottom-left', 0.94, 6.12, 4.48, 0.54, 'safe-overlay'),
      'product-matrix': z('product-matrix-lower-right', 8.04, 4.90, 3.58, 0.64, 'safe-overlay'),
      'proof-gallery': z('proof-gallery-lower-right', 8.02, 5.50, 3.72, 0.82, 'safe-overlay'),
      'risk-register': z('risk-register-lower-right', 8.04, 4.82, 3.72, 1.68, 'safe-overlay'),
      'source-note': z('source-note-footer-right', 8.10, 7.02, 4.20, 0.22, 'safe-overlay'),
      'system-rail': z('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay'),
      'value-chain': z('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay'),
      'value-chain-connector': z('value-chain-lower-right', 8.04, 6.08, 3.62, 0.58, 'safe-overlay')
    };
  }

  function energyOccupiedZonesForRenderer(rendererName = '') {
    const base = [z('footer-strip', 0.72, 6.88, 11.10, 0.36, 'native-footer')];
    const map = {
      energyToc: [
        z('title-block', 0.72, 0.66, 5.30, 1.35, 'native-title'),
        z('navigation-path', 0.96, 2.88, 10.34, 1.72, 'native-path'),
        z('media-band', 0, 5.58, W(), 1.28, 'native-visual'),
        z('main-visual-ring', 10.26, 0.28, 2.72, 2.64, 'native-visual')
      ],
      energySituationEditorial: [
        z('left-state-column', 0, 0, 4.82, H(), 'native-text'),
        z('right-demand-column', 5.42, 0.96, 6.18, 5.62, 'native-cards')
      ],
      energyProblemSplit: [
        z('title-block', 0.76, 0.68, 6.18, 1.20, 'native-title'),
        z('transition-band', 0.90, 2.16, 7.24, 0.62, 'native-flow'),
        z('breakpoint-cards', 0.88, 3.10, 7.34, 2.58, 'native-cards'),
        z('right-visual-panel', 8.62, 0.66, 3.62, 5.72, 'native-visual')
      ],
      energyCapabilityLoop: [
        z('title-block', 0.78, 0.70, 6.15, 1.18, 'native-title'),
        z('left-summary-panel', 0.92, 2.12, 3.18, 3.60, 'native-text'),
        z('closed-loop-board', 4.42, 1.98, 7.66, 4.42, 'native-loop')
      ],
      energyArchitecture: [
        z('title-block', 0.78, 0.70, 6.50, 1.18, 'native-title'),
        z('topology-board', 0.78, 2.04, 11.48, 4.26, 'native-architecture'),
        z('data-bus', 1.02, 5.30, 10.56, 0.72, 'native-data-bus')
      ],
      energyDeploymentRadius: [
        z('title-block', 0.78, 0.70, 7.45, 1.18, 'native-title'),
        z('phase-list', 0.88, 2.04, 5.84, 3.52, 'native-process'),
        z('radius-panel', 7.05, 1.78, 4.72, 3.70, 'native-visual'),
        z('media-band', 0, 5.72, W(), 1.00, 'native-visual')
      ],
      energyValueSignal: [
        z('title-block', 0.78, 0.70, 6.45, 1.14, 'native-title'),
        z('primary-outcome-panel', 0.92, 2.08, 4.76, 3.70, 'native-visual'),
        z('value-signal-cards', 6.30, 2.10, 5.38, 3.22, 'native-cards'),
        z('caption-strip', 6.30, 5.68, 5.38, 0.68, 'native-caption')
      ]
    };
    return [...(map[rendererName] || []), ...base];
  }

  function genericOccupiedZonesForSlide(s = {}) {
    const type = String(s.type || '');
    if (['cover', 'cover-dark'].includes(type)) return [z('cover-stage', 0, 0, W(), H(), 'native')];
    if (['toc', 'toc-clean'].includes(type)) return [z('navigation-stage', 0.70, 0.60, 10.50, 6.34, 'native')];
    if (['closing', 'closing-dark'].includes(type)) return [z('closing-stage', 0.70, 0.60, 10.90, 6.34, 'native')];
    if (type === 'timeline' || type === 'timeline-dark') return [z('timeline-main-stage', 0.80, 1.90, 11.20, 4.70, 'native')];
    if (type === 'architecture' || type === 'architecture-dark') return [z('architecture-main-stage', 0.80, 1.92, 11.20, 4.70, 'native')];
    if (type === 'risk-table' || type === 'table') return [z('risk-table-main-stage', 0.82, 1.90, 10.95, 4.78, 'native')];
    if (type === 'portfolio-table') return [
      z('portfolio-summary-panel', 0.92, 2.10, 2.72, 3.94, 'native-summary'),
      z('portfolio-action-table', 4.08, 2.10, 7.64, 3.94, 'native-table'),
      z('portfolio-footer-note', 0.94, 6.34, 8.60, 0.34, 'native-footer-note')
    ];
    if (type === 'report-board') {
      const compactBoard = reportBoardNeedsRightOverlayRail(s);
      return [
        z('report-board-executive-read', 0.92, 2.08, 2.78, 4.16, 'native'),
        z('report-board-evidence-stack', 4.12, 2.08, compactBoard ? 3.54 : 7.46, 4.16, 'native')
      ];
    }
    return [z('primary-content-stage', 0.82, 1.00, 6.95, 4.92, 'native')];
  }

  function nativeComponentIdsFor(s = {}) {
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
      CHART_COMPONENT_IDS.forEach(id => ids.add(id));
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
      if (/risk-matrix|materiality-matrix/.test(variant) || s.matrix) ids.add('risk-matrix');
    }
    if (type === 'report-board') {
      ['proof-board', 'commentary-panel', 'source-note'].forEach(id => ids.add(id));
    }
    if (type === 'closing') {
      ['decision-panel', 'contact-block', 'editorial-end-card'].forEach(id => ids.add(id));
    }
    nativeOwnedComponentIdsFor(type, variant).forEach(id => ids.add(id));
    return ids;
  }

  function nativeRendererContractFor(plan = {}, s = {}, rendererName = '') {
    const type = String(s.type || '');
    const variant = String(s.layoutVariant || s.variant || '');
    const owned = nativeComponentIdsFor(s);
    if (isEnergyNativeRenderer(plan, rendererName)) {
      energyNativeOwnedComponentIds().forEach(id => owned.add(id));
    }
    const safeOverlayZones = isEnergyNativeRenderer(plan, rendererName)
      ? { 'source-note': z('source-note-footer', 8.10, 7.02, 4.20, 0.22, 'safe-overlay') }
      : defaultSafeOverlayZonesFor(s);
    return {
      version: 'native-renderer-contract/v1',
      rendererName: rendererName || 'unknown-renderer',
      slideType: type,
      layoutVariant: variant,
      ownedComponents: [...owned].sort(),
      occupiedZones: isEnergyNativeRenderer(plan, rendererName)
        ? energyOccupiedZonesForRenderer(rendererName)
        : genericOccupiedZonesForSlide(s),
      safeOverlayZones
    };
  }

  function declareNativeRendererContract(slide, contract = {}) {
    slide.__codexNativeRenderContract = contract;
    slide.__codexDecorations = [];
  }

  function overlaySlotForComponent(contract = {}, componentId = '') {
    const zones = contract.safeOverlayZones || {};
    return zones[componentId] ||
      (componentId === 'metric-strip' ? zones['kpi-strip'] : null) ||
      (componentId === 'value-chain-connector' ? zones['value-chain'] : null);
  }

  function componentBlockedByContract(contract = {}, componentId = '') {
    const owned = new Set(contract.ownedComponents || []);
    if (owned.has(componentId)) return false;
    return !overlaySlotForComponent(contract, componentId);
  }

  function componentSlotConflicts(contract = {}, slot = null) {
    if (!slot) return false;
    return (contract.occupiedZones || [])
      .filter(item => item.role !== 'native-footer')
      .some(item => intersects(item, slot, 0.02));
  }

  function overlaySlotConflicts(existingOverlays = [], slot = null) {
    if (!slot) return null;
    return existingOverlays.find(existing => intersects(existing, slot, 0.02)) || null;
  }

  return {
    componentBlockedByContract,
    componentSlotConflicts,
    declareNativeRendererContract,
    defaultSafeOverlayZonesFor,
    energyOccupiedZonesForRenderer,
    genericOccupiedZonesForSlide,
    nativeComponentIdsFor,
    nativeRendererContractFor,
    overlaySlotConflicts,
    overlaySlotForComponent
  };
}

module.exports = {
  CHART_COMPONENT_IDS,
  CHART_META_SUPPRESSED_NATIVE_VARIANTS,
  NATIVE_VARIANT_COMPONENTS,
  OVERLAY_PRONE_COMPONENT_IDS,
  createOverlayContractHelpers,
  energyNativeOwnedComponentIds,
  isEnergyNativeRenderer,
  nativeOwnedComponentIdsFor,
  nativeVariantSuppressesChartMeta,
  plannedComponentsForSlide,
  reportBoardNeedsRightOverlayRail
};
