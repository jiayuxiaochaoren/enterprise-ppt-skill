function createOverlayRenderer(deps = {}) {
  const chartComponentIds = deps.chartComponentIds || deps.CHART_COMPONENT_IDS || new Set();
  const nativeRendererModule = deps.nativeDrawnEvidenceRendererModule || 'generate_pptx/native-page-renderer';
  const colors = () => typeof deps.colors === 'function' ? deps.colors() : (deps.colors || {});
  const canvasWidth = () => typeof deps.canvasWidth === 'function' ? deps.canvasWidth() : Number(deps.canvasWidth || 13.333);
  const canvasHeight = () => typeof deps.canvasHeight === 'function' ? deps.canvasHeight() : Number(deps.canvasHeight || 7.5);
  const panelFill = () => typeof deps.panelFill === 'function' ? deps.panelFill() : (colors().white || 'FFFFFF');
  const compactText = (text = '', maxChars = 32) => {
    if (typeof deps.compactText === 'function') return deps.compactText(text, maxChars);
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    return value.length > maxChars ? value.slice(0, Math.max(0, maxChars - 1)).trim() : value;
  };
  const itemTitle = (value, fallback = '') => typeof deps.itemTitle === 'function'
    ? deps.itemTitle(value, fallback)
    : (typeof value === 'string' ? value : ((value && (value.title || value.label || value.name || value.value)) || fallback));
  const itemBody = (value, fallback = '') => typeof deps.itemBody === 'function'
    ? deps.itemBody(value, fallback)
    : (typeof value === 'string' ? '' : ((value && (value.body || value.note || value.text || value.description)) || fallback));
  const componentRendererContext = slide => typeof deps.componentRendererContext === 'function'
    ? deps.componentRendererContext(slide)
    : { slide, colors:colors(), addRect:deps.addRect, addText:deps.addText, addLabel:deps.addLabel, panelFill, compactText };
  const fileExists = file => {
    if (typeof deps.fileExists === 'function') return deps.fileExists(file);
    return Boolean(file && deps.fs && typeof deps.fs.existsSync === 'function' && deps.fs.existsSync(file));
  };
  const zone = deps.zone || ((id, x, y, w, h, role = 'native') => ({ id, x:Number(x), y:Number(y), w:Number(w), h:Number(h), role }));
  const overlaySlotForComponent = deps.overlaySlotForComponent || (() => null);
  const componentBlockedByContract = deps.componentBlockedByContract || (() => false);
  const componentSlotConflicts = deps.componentSlotConflicts || (() => false);
  const overlaySlotConflicts = deps.overlaySlotConflicts || (() => null);
  const slideRenderedDark = deps.slideRenderedDark || (() => false);
  const slideRole = deps.slideRole || (() => '');
  const mediaForRole = deps.mediaForRole || (() => '');
  const routeChartSpec = deps.routeChartSpec || (() => null);
  const renderChartSpec = deps.renderChartSpec || (() => ({ rendered:false }));
  const recordChartConsumption = deps.recordChartConsumption || (() => {});
  const slideHasChartSpecIntent = deps.slideHasChartSpecIntent || (() => false);

  function componentSourceNoteText(plan = {}, s = {}) {
    const proof = s.proof || {};
    return s.sourceNote || s.source_note || proof.sourceNote || '';
  }

  function overlayMetricsForSlide(plan = {}, s = {}) {
    const normalize = metric => typeof metric === 'string'
      ? { label:'Metric', value:metric, note:'' }
      : { label:metric.label || metric.title || 'Metric', value:metric.value || metric.amount || metric.delta || '', note:metric.note || metric.body || metric.unit || '' };
    if (Array.isArray(s.metrics) && s.metrics.length) return s.metrics.map(normalize).filter(metric => metric.value || metric.note).slice(0, 4);
    if (['cover', 'cover-dark'].includes(s.type || '') && Array.isArray(plan.coverMetrics) && plan.coverMetrics.length) {
      return plan.coverMetrics.map(normalize).filter(metric => metric.value || metric.note).slice(0, 4);
    }
    const textItems = [
      s.title,
      s.subtitle,
      s.claim,
      s.note,
      ...(Array.isArray(s.cards) ? s.cards.map(card => `${card.title || ''} ${card.body || card.text || ''}`) : []),
      ...(Array.isArray(s.items) ? s.items.map(value => `${itemTitle(value)} ${itemBody(value)}`) : [])
    ].filter(Boolean);
    const found = [];
    textItems.forEach((text, i) => {
      const matches = String(text).match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|bps|倍|JPY|¥|B|bn|m|年|yrs?|countries|awards)?/gi) || [];
      matches.forEach(match => {
        const value = match.replace(/\s+/g, '');
        if (!value || /^\d{4}$/.test(value) || found.some(metric => metric.value === value)) return;
        found.push({
          label: i === 0 ? 'Claim signal' : compactText(String(text).replace(match, ''), 18),
          value,
          note: compactText(String(text), 24)
        });
      });
    });
    return found.slice(0, 4);
  }

  function overlayPointsForSlide(s = {}) {
    const fields = [s.phases, s.items, s.actions, s.sections, s.cards].find(value => Array.isArray(value) && value.length);
    if (fields) return fields.slice(0, 5);
    const proof = s.proof || {};
    return [s.title, s.claim || s.subtitle, proof.explanation || s.note].filter(Boolean).slice(0, 3).map(text => ({ title:text }));
  }

  function overlayProofItemsForSlide(plan = {}, s = {}) {
    if (Array.isArray(s.cards) && s.cards.length) return s.cards.slice(0, 4);
    if (Array.isArray(s.items) && s.items.length) return s.items.slice(0, 4);
    const metrics = overlayMetricsForSlide(plan, s);
    if (metrics.length) return metrics.map(metric => ({ title:`${metric.label}: ${metric.value}`, body:metric.note }));
    if (Array.isArray(s.rows) && s.rows.length) return s.rows.slice(0, 4).map(row => Array.isArray(row) ? { title:row[0], body:row.slice(1).join(' · ') } : row);
    const proof = s.proof || {};
    return [proof.explanation || s.claim || s.subtitle].filter(Boolean).map(text => ({ title:'Proof', body:text }));
  }

  function drawOverlayValueChain(slide, points = [], opts = {}) {
    const result = deps.renderValueChain(componentRendererContext(slide), points, opts);
    return result && result.rendered ? result : false;
  }

  function drawOverlayProofGallery(slide, items = [], opts = {}) {
    const result = deps.renderProofGallery(componentRendererContext(slide), items, opts);
    return result && result.rendered ? result : false;
  }

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
    const hasImages = Boolean((Array.isArray(s.images) && s.images.length) ||
      (s.visual && Array.isArray(s.visual.images) && s.visual.images.length) ||
      (s.visual && s.visual.image) ||
      s.image ||
      mediaForRole(plan, s, slideRole(s)));
    const hasMetrics = Array.isArray(s.metrics) && s.metrics.length;
    const hasRows = Array.isArray(s.rows) || Array.isArray(s.risks) || Array.isArray(s.controls);
    const hasFlow = Array.isArray(s.phases) || Array.isArray(s.actions) || Array.isArray(s.steps) || Array.isArray(s.items);
    const hasArchitecture = Array.isArray(s.layers) || s.architecture || s.systemMap || s.topology || s.capabilityMap || s.platformCapabilities || s.valueChain || s.capitals;
    const chartRendered = slideHasChartSpecIntent(s) || (contract && /metric|chart|finance/.test(type));
    const evidence = (patterns, drawnCount = 1, reason = '') => {
      const bbox = evidenceZone(contract, patterns);
      return {
        id: componentId,
        mode: 'native-renderer',
        rendered: true,
        rendererModule: nativeRendererModule,
        nativeSlot: bbox.id || '',
        drawnCount,
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
    if (['proof-gallery', 'proof-gallery-grid', 'caption-bar'].includes(componentId) && (['case-gallery', 'gallery', 'portfolio', 'product-showcase'].includes(type) || hasImages || /gallery|proof|lookbook|mosaic|product/i.test(`${variant} ${proofObject}`))) return evidence([/visual|caption|gallery|stage|content|native/i], Math.max(1, (s.images || []).length || (s.cards || []).length || 1), 'native evidence renderer draws gallery/caption system');
    if (componentId === 'product-matrix' && (type === 'product-showcase' || Array.isArray(s.products) || /product|sku|texture|efficacy/i.test(`${variant} ${proofObject} ${s.title || ''}`))) return evidence([/product|visual|content|stage|native/i], Math.max(1, (s.products || []).length || 1), 'native renderer draws product proof/matrix');
    if (['value-chain', 'value-chain-connector', 'system-rail'].includes(componentId) && (['strategy-map', 'architecture', 'architecture-dark'].includes(type) || hasArchitecture || /value|system|brand-world/i.test(`${variant} ${proofObject}`))) return evidence([/architecture|topology|flow|stage|content|native/i], 1, 'native system renderer draws flow/architecture rail');
    if (componentId === 'commentary-panel' && (['strategy-map', 'architecture', 'architecture-dark', 'module-matrix', 'value-tiles', 'report-board'].includes(type) || s.businessLogic || s.claim)) return evidence([/commentary|summary|caption|text|content|stage|native/i], 1, 'native renderer draws a commentary or management-judgment panel');
    if (componentId === 'process-rail' && (['timeline', 'timeline-dark'].includes(type) || hasFlow || /process|loop|timeline|flywheel/i.test(`${variant} ${proofObject}`))) return evidence([/process|timeline|loop|stage|content|native/i], Math.max(1, (s.phases || s.actions || s.steps || []).length || 1), 'native timeline renderer draws process rail');
    if (['risk-register', 'risk-matrix', 'governance-table'].includes(componentId) && (['risk-table', 'table'].includes(type) || hasRows || /risk|governance|materiality|control/i.test(`${variant} ${proofObject}`))) return evidence([/risk|table|governance|content|stage|native/i], Math.max(1, (s.rows || s.risks || s.controls || []).length || 1), 'native governance renderer draws risk/table structure');
    if (['decision-panel', 'contact-block', 'editorial-end-card'].includes(componentId) && ['closing', 'closing-dark'].includes(type)) return evidence([/closing|stage|native/i], 1, 'native closing renderer draws decision/contact block');
    if (componentId === 'load-curve-band' && slide && (slide.__codexDecorations || []).some(decoration => decoration.type === 'load-curve-band')) return evidence([/load-curve|visual|stage|native/i], 1, 'native renderer drew a load-curve-band decoration');
    if (componentId === 'source-note' && componentSourceNoteText(plan, s)) return evidence([/source|footer|stage|native/i], 1, 'native renderer draws visible source note');
    return null;
  }

  function renderOverlayComponent(slide, plan, s, idx, componentId, nativeIds, contract = {}, existingOverlays = []) {
    const C = colors();
    const dark = slideRenderedDark(slide, s);
    const slot = overlaySlotForComponent(contract, componentId);
    const ownedByNative = nativeIds && typeof nativeIds.has === 'function' && nativeIds.has(componentId);
    if (componentBlockedByContract(contract, componentId)) {
      return { id:componentId, mode:'blocked-unsafe-overlay', rendered:false, reason:'no safe overlay zone declared by native renderer contract' };
    }
    if (!ownedByNative && componentSlotConflicts(contract, slot)) {
      return { id:componentId, mode:'blocked-native-zone-conflict', rendered:false, bbox:slot, reason:'safe overlay zone conflicts with native occupied zone' };
    }
    const overlayConflict = !ownedByNative ? overlaySlotConflicts(existingOverlays, slot) : null;
    if (overlayConflict) {
      return {
        id:componentId,
        mode:'blocked-overlay-zone-conflict',
        rendered:false,
        bbox:slot,
        reason:`safe overlay zone conflicts with already rendered component ${overlayConflict.id || overlayConflict.componentId || 'overlay'}`
      };
    }
    if (componentId === 'hero-image' && !ownedByNative) {
      const image = mediaForRole(plan, s, slideRole(s));
      if (image && fileExists(image)) {
        const z = slot || { x:8.18, y:1.08, w:3.20, h:2.48 };
        deps.addSmartPhotoPanel(slide, image, z.x, z.y, z.w, z.h, { role:'evidence', tone:dark ? 'dark' : 'light', fit:'cover' });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if ((componentId === 'kpi-strip' || componentId === 'metric-strip') && !ownedByNative) {
      const metrics = overlayMetricsForSlide(plan, s);
      if (metrics.length) {
        const z = slot || { x:0.86, y:['cover', 'cover-dark'].includes(s.type || '') ? 5.90 : 6.12, w:10.30, h:0.58 };
        const component = deps.metricStrip(slide, metrics, z.x, z.y, z.w, { h:z.h || 0.58, max:4, transparency:dark ? 18 : 0 });
        return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
      }
    }
    if (componentId === 'chart-commentary-panel' && !ownedByNative) {
      const text = (s.businessLogic && (s.businessLogic.action || s.businessLogic.metric)) ||
        (s.proof && s.proof.explanation) ||
        s.claim || s.subtitle || s.note || '';
      if (text) {
        const z = slot || { x:8.22, y:6.00, w:3.42, h:0.42 };
        deps.addRect(slide, z.x, z.y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
          fill:{color:dark ? C.ink2 : panelFill(), transparency:dark ? 18 : 0},
          line:{color:dark ? C.darkLine : C.line, transparency:dark ? 52 : 14, width:0.38}
        });
        deps.addLabel(slide, 'READOUT', { x:z.x+0.20, y:z.y+0.15, w:0.72, h:0.08, fontSize:4.8, color:dark ? C.cyan : C.accent, charSpace:0.45 });
        deps.addText(slide, compactText(text, 70), { x:z.x+0.98, y:z.y+0.12, w:Math.max(1.0, z.w-1.20), h:0.12, fontSize:6.8, color:dark ? C.captionOnImage : C.body, fit:'shrink' });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if ((componentId === 'value-chain' || componentId === 'system-rail') && !ownedByNative) {
      const points = overlayPointsForSlide(s);
      const z = slot || {};
      const component = drawOverlayValueChain(slide, points, Object.assign({ dark }, z));
      if (component) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
    }
    if (componentId === 'process-rail' && !ownedByNative) {
      const points = overlayPointsForSlide(s);
      if (points.length >= 2) {
        const z = slot || { x:0.94, y:6.18, w:4.48, h:0.54 };
        deps.processRail(slide, points, z.x, z.y + 0.06, z.w, { max:5, dark, line:dark ? C.darkLine : C.line, lineTransparency:dark ? 44 : 18 });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z, itemCount:points.slice(0, 5).length };
      }
    }
    if (componentId === 'proof-gallery' && !ownedByNative) {
      const items = overlayProofItemsForSlide(plan, s);
      const z = slot || {};
      const component = drawOverlayProofGallery(slide, items, Object.assign({ dark }, z));
      if (component) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
    }
    if (componentId === 'risk-register' && !ownedByNative) {
      const rows = Array.isArray(s.rows) && s.rows.length ? s.rows : overlayProofItemsForSlide(plan, s);
      const z = slot || {};
      const component = deps.renderRiskRegister(componentRendererContext(slide), rows, Object.assign({ dark }, z));
      if (component.rendered) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
    }
    if (componentId === 'product-matrix' && !ownedByNative) {
      const items = overlayProofItemsForSlide(plan, s).slice(0, 3);
      if (items.length) {
        const z = slot || { x:8.04, y:4.92, w:3.58, h:0.58 };
        const x = z.x;
        const y = z.y;
        deps.addRect(slide, x, y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
          fill:{color:dark ? C.ink2 : panelFill(), transparency:dark ? 18 : 0},
          line:{color:dark ? C.darkLine : C.line, transparency:dark ? 48 : 14, width:0.38}
        });
        deps.addLabel(slide, 'SKU / PROOF MATRIX', { x:x+0.18, y:y+0.15, w:1.22, h:0.08, fontSize:4.7, color:dark ? C.cyan : C.accent, charSpace:0.35 });
        deps.addText(slide, items.map(item => compactText(itemTitle(item, 'Proof'), 16)).join('  /  '), {
          x:x+1.48, y:y+0.14, w:Math.max(1.0, z.w-1.70), h:0.12, fontSize:6.8, color:dark ? C.captionOnImage : C.body, fit:'shrink'
        });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if (componentId === 'source-note' && !ownedByNative) {
      const text = componentSourceNoteText(plan, s);
      if (text) {
        const z = slot || { x:8.10, y:7.05, w:4.20, h:0.16 };
        deps.sourceNote(slide, text, z.x, z.y, { w:z.w, h:z.h, fontSize:6.9, dark });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if (componentId === 'caption-bar' && !ownedByNative) {
      const caption = (s.proof && s.proof.explanation) || s.caption || s.subtitle || '';
      if (caption) {
        const z = slot || { x:0.86, y:6.50, w:4.80, h:0.28 };
        deps.addCaptionBar(slide, z.x, z.y, z.w, z.h, {
          label:'PROOF',
          caption,
          dark,
          transparency:dark ? 28 : 0
        });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if (componentId === 'commentary-panel' && !ownedByNative) {
      const logic = s.businessLogic || {};
      const text = logic.action || logic.metric || s.decision || s.note || '';
      if (text) {
        const z = slot || { x:9.10, y:5.72, w:2.44, h:0.52 };
        deps.addRect(slide, z.x, z.y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
          fill:{color:dark ? C.ink2 : panelFill(), transparency:dark ? 18 : 0},
          line:{color:dark ? C.darkLine : C.line, transparency:dark ? 52 : 12, width:0.42}
        });
        deps.addLabel(slide, 'COMMENTARY', { x:z.x+0.20, y:z.y+0.16, w:1.20, h:0.09, fontSize:5.2, color:dark ? C.cyan : C.accent, charSpace:0.6 });
        deps.addText(slide, text, { x:z.x+1.08, y:z.y+0.14, w:Math.max(0.92, z.w-1.30), h:0.12, fontSize:6.9, color:dark ? C.captionOnImage : C.body, fit:'shrink' });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if (chartComponentIds.has(componentId) && !ownedByNative) {
      const spec = s.chartSpec || routeChartSpec(plan, s, { index:idx, total:(plan.slides || []).length });
      if (spec) {
        const component = renderChartSpec(componentRendererContext(slide), spec, { x:4.06, y:2.16, w:7.44, h:3.76 });
        if (component.rendered) {
          recordChartConsumption(slide, spec, component, { plannedComponentId:componentId, mode:'overlay' });
          return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
        }
      }
    }
    if (ownedByNative) {
      const nativeEvidence = nativeDrawnEvidenceFor(plan, s, componentId, contract, slide);
      return nativeEvidence || {
        id:componentId,
        mode:'native-claimed-undrawn',
        rendered:false,
        rendererModule:nativeRendererModule,
        reason:'native renderer declared ownership but did not provide drawn component evidence'
      };
    }
    return { id:componentId, mode:'not-rendered', rendered:false };
  }

  return {
    componentSourceNoteText,
    overlayMetricsForSlide,
    overlayPointsForSlide,
    overlayProofItemsForSlide,
    evidenceZone,
    nativeDrawnEvidenceFor,
    renderOverlayComponent
  };
}

module.exports = {
  createOverlayRenderer
};
