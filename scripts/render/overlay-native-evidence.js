function createOverlayNativeEvidence(deps = {}) {
  const chartComponentIds = deps.chartComponentIds || deps.CHART_COMPONENT_IDS || new Set();
  const nativeRendererModule = deps.nativeRendererModule || deps.nativeDrawnEvidenceRendererModule || 'generate_pptx/native-page-renderer';
  const canvasWidth = () => typeof deps.canvasWidth === 'function' ? deps.canvasWidth() : Number(deps.canvasWidth || 13.333);
  const canvasHeight = () => typeof deps.canvasHeight === 'function' ? deps.canvasHeight() : Number(deps.canvasHeight || 7.5);
  const zone = deps.zone || ((id, x, y, w, h, role = 'native') => ({ id, x:Number(x), y:Number(y), w:Number(w), h:Number(h), role }));
  const mediaForRole = deps.mediaForRole || (() => '');
  const slideRole = deps.slideRole || (() => '');
  const slideHasChartSpecIntent = deps.slideHasChartSpecIntent || (() => false);
  const componentSourceNoteText = deps.componentSourceNoteText || (() => '');

  function evidenceZone(contract = {}, patterns = []) {
    const zones = [
      ...Object.values(contract.safeOverlayZones || {}),
      ...(contract.occupiedZones || [])
    ];
    return zones.find(item => patterns.some(pattern => pattern.test(`${item.id || ''} ${item.role || ''}`))) ||
      (contract.occupiedZones || [])[0] ||
      zone('native-slide-stage', 0, 0, canvasWidth(), canvasHeight(), 'native');
  }

  function nativeDrawnEvidenceFor(plan = {}, s = {}, componentId = '', contract = {}, slide = null) {
    const type = String(s.type || '');
    const variant = String(s.layoutVariant || s.variant || '');
    const proofObject = String((s.proof && s.proof.id) || s.proofObject || s.proof_object || '');
    const hasPlanGallery = Boolean(plan.media && Array.isArray(plan.media.gallery) && plan.media.gallery.length &&
      (['case-gallery', 'gallery', 'portfolio', 'product-showcase', 'strategy-map'].includes(type) || /brand-world|proof|lookbook|mosaic|product/i.test(`${variant} ${proofObject}`)));
    const hasImages = Boolean((Array.isArray(s.images) && s.images.length) ||
      (s.visual && Array.isArray(s.visual.images) && s.visual.images.length) ||
      (s.visual && s.visual.image) ||
      s.image ||
      hasPlanGallery ||
      mediaForRole(plan, s, slideRole(s)));
    const hasMetrics = Array.isArray(s.metrics) && s.metrics.length;
    const hasRows = Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls);
    const hasFlow = Array.isArray(s.phases) || Array.isArray(s.actions) || Array.isArray(s.steps) || Array.isArray(s.items);
    const hasArchitecture = Array.isArray(s.layers) || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities || s.valueChain || s.capitals;
    const hasJourney = s.serviceBlueprint || s.journeyMap || s.touchpoints || s.qualityHandoff || s.handoffs;
    const hasServicePromise = s.servicePromise || /patient|service|care|quality/i.test(`${variant} ${proofObject}`);
    const prototypeFlow = s.prototypeFlow || {};
    const hasPrototype = hasImages ||
      (Array.isArray(prototypeFlow) && prototypeFlow.length > 0) ||
      Boolean(prototypeFlow && typeof prototypeFlow === 'object' && (prototypeFlow.screenshot || prototypeFlow.screen || prototypeFlow.image || prototypeFlow.images));
    const hasWorkflow = s.workflow || s.workflows || s.automationWorkflow || hasFlow || hasArchitecture;
    const hasPermissions = s.permissionGovernance || s.permissions || s.auditLog || hasRows;
    const hasPortfolioLogic = s.portfolio || s.holdings || s.allocation || s.bridge || s.capitalBridge || /portfolio|allocation|bridge/i.test(`${variant} ${proofObject}`);
    const hasRetailProofCards = Array.isArray(s.cards) && s.cards.length &&
      /member|growth|consumer|retail|product|proof|evidence/i.test(`${variant} ${proofObject} ${s.title || ''}`);
    const hasEquipment = s.equipment || s.productionLine || s.topology || hasArchitecture || hasMetrics;
    const hasInspection = s.inspectionMatrix || s.inspectionRecords || hasRows || hasFlow || s.qualityHandoff;
    const hasSiteEvidence = s.siteEvidence || s.assetReadout || hasImages;
    const hasAdoption = s.adoptionFunnel || s.activationFunnel || s.cohortFunnel || /adoption-funnel/i.test(`${variant} ${proofObject}`);
    const chartRendered = slideHasChartSpecIntent(s) || (contract && /metric|chart|finance/.test(type));
    const evidence = (patterns, drawnCount = 1, reason = '') => {
      const bbox = evidenceZone(contract, patterns);
      return {
        id: componentId,
        mode: 'native-renderer',
        rendered: true,
        rendererModule: nativeRendererModule,
        rendererMethod: 'nativeDrawnEvidenceFor',
        nativeSlot: bbox.id || '',
        drawnCount,
        itemCount: drawnCount,
        bbox,
        evidence: reason || 'native renderer owns a visible page-family slot'
      };
    };
    if (componentId === 'page-number') return evidence([/footer|folio|stage|native/i], 1, 'final slide chrome writes page number');
    if (componentId === 'section-kicker' && !['cover', 'cover-dark', 'closing', 'closing-dark'].includes(type)) return evidence([/title|stage|native/i], 1, 'native title block writes section kicker');
    if (componentId === 'navigation-sequence' && ['toc', 'toc-clean'].includes(type)) return evidence([/navigation|path|stage|native/i], Math.max(1, (s.items || s.sections || []).length || 1), 'native TOC renderer draws navigation sequence');
    if (componentId === 'content-card-grid' && ['two-column', 'cards', 'module-matrix', 'value-tiles', 'executive-blocks'].includes(type)) return evidence([/cards|content|stage|visual|text|native/i], Math.max(1, (s.cards || s.items || s.modules || s.values || []).length || 1), 'native page family draws the main content/card grid');
    if (componentId === 'hero-image' && (['cover', 'cover-dark', 'case-gallery', 'gallery', 'portfolio', 'product-showcase'].includes(type) || hasImages || /hero|cover|brand|product|image/i.test(`${variant} ${proofObject}`))) return evidence([/visual|image|cover|stage|photo/i], hasImages ? 1 : 0.5, 'native renderer draws or reserves primary visual stage');
    if (['kpi-strip', 'metric-strip', 'kpi-primary-metric'].includes(componentId) && (hasMetrics || ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type))) return evidence([/metric|content|stage|board|native/i], hasMetrics ? Math.max(1, s.metrics.length) : 1, 'native metric renderer draws metric readout');
    if (componentId === 'chart-commentary-panel' && ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(type)) return evidence([/commentary|content|stage|board|native/i], 1, 'native chart renderer draws commentary/readout panel');
    if (chartComponentIds.has(componentId) && chartRendered) {
      const chartItemCount = componentId === 'scorecard' && hasMetrics ? Math.max(1, s.metrics.length) : 1;
      return evidence([/chart|content|stage|board|native/i], chartItemCount, 'native chartSpec renderer owns chart board');
    }
    if (['proof-gallery', 'proof-gallery-grid', 'caption-bar'].includes(componentId) && (['case-gallery', 'gallery', 'portfolio', 'product-showcase'].includes(type) || hasImages || hasRetailProofCards || /gallery|proof|lookbook|mosaic|product/i.test(`${variant} ${proofObject}`))) return evidence([/visual|caption|gallery|stage|content|native/i], Math.max(1, (s.images || []).length || (s.cards || []).length || 1), 'native evidence renderer draws gallery/caption system');
    if (componentId === 'product-matrix' && (type === 'product-showcase' || Array.isArray(s.products) || Array.isArray(s.productStory) || /product|sku|texture|efficacy/i.test(`${variant} ${proofObject} ${s.title || ''}`))) {
      const productCount = Math.max(
        1,
        (Array.isArray(s.products) ? s.products.length : 0) ||
        (Array.isArray(s.productStory) ? s.productStory.length : 0) ||
        (Array.isArray(s.cards) ? s.cards.length : 0) ||
        (Array.isArray(s.items) ? s.items.length : 0) ||
        1
      );
      return evidence([/product|visual|content|stage|native/i], productCount, 'native renderer draws product proof/matrix');
    }
    if (componentId === 'equipment-nameplate' && hasEquipment) return evidence([/equipment|architecture|topology|content|stage|native/i], 1, 'native industry renderer draws equipment/capability identity evidence');
    if (componentId === 'inspection-matrix' && hasInspection) return evidence([/inspection|quality|process|table|content|stage|native/i], Math.max(1, (s.rows || s.controls || s.phases || s.steps || []).length || 1), 'native industry renderer draws inspection or delivery-control evidence');
    if (componentId === 'quality-scorecard' && (hasMetrics || s.qualityScorecard || s.oee || s.oeeComponents)) return evidence([/metric|quality|scorecard|board|content|stage|native/i], hasMetrics ? Math.max(1, s.metrics.length) : 1, 'native industry renderer draws quality/efficiency scorecard evidence');
    if (componentId === 'site-evidence-frame' && hasSiteEvidence) return evidence([/site|visual|image|stage|native/i], hasImages ? Math.max(1, (s.images || []).length || 1) : 1, 'native industry renderer draws site/equipment evidence frame');
    if (componentId === 'patient-journey-band' && (hasJourney || hasServicePromise || hasMetrics)) return evidence([/journey|service|process|stage|content|native/i], Math.max(1, ((s.serviceBlueprint && s.serviceBlueprint.stages) || s.touchpoints || s.phases || s.metrics || []).length || 1), 'native healthcare renderer draws patient journey evidence');
    if (componentId === 'service-blueprint-lane' && hasJourney) return evidence([/blueprint|service|lane|process|content|stage|native/i], Math.max(1, ((s.serviceBlueprint && s.serviceBlueprint.stages) || s.touchpoints || s.handoffs || []).length || 1), 'native healthcare renderer draws service blueprint lane evidence');
    if (componentId === 'prototype-frame' && hasPrototype) return evidence([/prototype|visual|image|screen|stage|native/i], hasImages ? Math.max(1, (s.images || []).length || 1) : 1, 'native SaaS renderer draws prototype/screen evidence frame');
    if (componentId === 'workflow-rail' && hasWorkflow) return evidence([/workflow|process|architecture|flow|content|stage|native/i], Math.max(1, (s.steps || s.phases || s.items || []).length || 1), 'native SaaS renderer draws workflow implementation rail');
    if (componentId === 'permission-audit-tag' && hasPermissions) return evidence([/permission|audit|risk|governance|content|stage|native/i], Math.max(1, (s.rows || s.risks || s.controls || []).length || 1), 'native SaaS renderer draws permission/audit evidence');
    if (componentId === 'adoption-funnel' && hasAdoption) return evidence([/funnel|metric|adoption|chart|content|stage|native/i], Math.max(1, ((s.adoptionFunnel || s.activationFunnel || s.cohortFunnel || {}).steps || s.metrics || []).length || 1), 'native SaaS renderer draws adoption funnel evidence');
    if (['value-chain', 'value-chain-connector', 'system-rail'].includes(componentId) && (['strategy-map', 'architecture', 'architecture-dark'].includes(type) || hasArchitecture || hasFlow || hasPortfolioLogic || /value|system|brand-world/i.test(`${variant} ${proofObject}`))) return evidence([/architecture|topology|flow|table|stage|content|native/i], 1, 'native system renderer draws flow/architecture rail');
    if (componentId === 'commentary-panel' && (['strategy-map', 'architecture', 'architecture-dark', 'module-matrix', 'value-tiles', 'report-board'].includes(type) || s.businessLogic || s.claim)) return evidence([/commentary|summary|caption|text|content|stage|native/i], 1, 'native renderer draws a commentary or management-judgment panel');
    if (componentId === 'process-rail' && (['timeline', 'timeline-dark'].includes(type) || hasFlow || /process|loop|timeline|flywheel/i.test(`${variant} ${proofObject}`))) return evidence([/process|timeline|loop|stage|content|native/i], Math.max(1, (s.phases || s.actions || s.steps || []).length || 1), 'native timeline renderer draws process rail');
    if (['risk-register', 'risk-matrix', 'governance-table'].includes(componentId) && (['risk-table', 'table'].includes(type) || hasRows || /risk|governance|materiality|control/i.test(`${variant} ${proofObject}`))) return evidence([/risk|table|governance|content|stage|native/i], Math.max(1, (s.rows || s.risks || s.controls || []).length || 1), 'native governance renderer draws risk/table structure');
    if (componentId === 'disclosure-footnote' && (componentSourceNoteText(plan, s) || s.disclosure || s.assumptions)) return evidence([/source|footer|disclosure|stage|native/i], 1, 'native renderer draws disclosure or assumption boundary');
    if (['decision-panel', 'contact-block', 'editorial-end-card'].includes(componentId) && ['closing', 'closing-dark'].includes(type)) return evidence([/closing|stage|native/i], 1, 'native closing renderer draws decision/contact block');
    if (componentId === 'load-curve-band' && slide && (slide.__codexDecorations || []).some(decoration => decoration.type === 'load-curve-band')) return evidence([/load-curve|visual|stage|native/i], 1, 'native renderer drew a load-curve-band decoration');
    if (componentId === 'source-note' && componentSourceNoteText(plan, s)) return evidence([/source|footer|stage|native/i], 1, 'native renderer draws visible source note');
    return null;
  }

  return {
    evidenceZone,
    nativeDrawnEvidenceFor
  };
}

module.exports = {
  createOverlayNativeEvidence
};
