const {
  industryVisualGrammarDecisionFor
} = require('./industry-visual-grammar');
const {
  createIndustryComponentRenderer
} = require('./industry-component-renderers');
const {
  visibleSourceNotesEnabled
} = require('../design/source-evidence');

function createOverlayComponentRenderer(deps = {}) {
  const chartComponentIds = deps.chartComponentIds || new Set();
  const nativeRendererModule = deps.nativeRendererModule || 'generate_pptx/native-page-renderer';
  const colors = deps.colors || (() => ({}));
  const panelFill = deps.panelFill || (() => (colors().white || 'FFFFFF'));
  const compactText = deps.compactText || ((text = '', maxChars = 32) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars));
  const componentRendererContext = deps.componentRendererContext || (slide => ({ slide }));
  const fileExists = deps.fileExists || (() => false);
  const guardOverlayRender = deps.guardOverlayRender || (() => ({ slot:null, ownedByNative:false, blocked:null }));
  const slideRenderedDark = deps.slideRenderedDark || (() => false);
  const slideRole = deps.slideRole || (() => '');
  const mediaForRole = deps.mediaForRole || (() => '');
  const routeChartSpec = deps.routeChartSpec || (() => null);
  const renderChartSpec = deps.renderChartSpec || (() => ({ rendered:false }));
  const renderProductMatrix = deps.renderProductMatrix || (() => ({ rendered:false }));
  const recordChartConsumption = deps.recordChartConsumption || (() => {});
  const nativeDrawnEvidenceFor = deps.nativeDrawnEvidenceFor || (() => null);
  const componentSourceNoteText = deps.componentSourceNoteText || (() => '');
  const overlayMetricsForSlide = deps.overlayMetricsForSlide || (() => []);
  const overlayPointsForSlide = deps.overlayPointsForSlide || (() => []);
  const overlayProductItemsForSlide = deps.overlayProductItemsForSlide || (() => []);
  const overlayProofItemsForSlide = deps.overlayProofItemsForSlide || (() => []);
  const itemTitle = deps.itemTitle || ((value, fallback = '') => typeof value === 'string' ? value : ((value && (value.title || value.label || value.name || value.value)) || fallback));
  const {
    industryComponentResult,
    overlayImagesForSlide
  } = createIndustryComponentRenderer(Object.assign({}, deps, {
    colors,
    compactText,
    componentSourceNoteText,
    mediaForRole,
    panelFill,
    slideRole
  }));

  function drawOverlayValueChain(slide, points = [], opts = {}) {
    const result = deps.renderValueChain(componentRendererContext(slide), points, opts);
    return result && result.rendered ? result : false;
  }

  function drawOverlayProofGallery(slide, items = [], opts = {}) {
    const result = deps.renderProofGallery(componentRendererContext(slide), items, opts);
    return result && result.rendered ? result : false;
  }

  function renderOverlayComponent(slide, plan, s, idx, componentId, nativeIds, contract = {}, existingOverlays = []) {
    const C = colors();
    const dark = slideRenderedDark(slide, s);
    const showSourceNote = visibleSourceNotesEnabled(plan);
    const grammarDecision = industryVisualGrammarDecisionFor(plan, s) || {};
    const { slot, ownedByNative, blocked } = guardOverlayRender(componentId, nativeIds, contract, existingOverlays);
    if (blocked) return blocked;
    if (ownedByNative) {
      const nativeEvidence = nativeDrawnEvidenceFor(plan, s, componentId, contract, slide);
      return nativeEvidence || {
        id:componentId,
        mode:'native-claimed-undrawn',
        rendered:false,
        rendererModule:nativeRendererModule,
        rendererMethod:'nativeDrawnEvidenceFor',
        reason:'native renderer declared ownership but did not provide drawn component evidence'
      };
    }
    const industryDrawn = industryComponentResult(slide, plan, s, componentId, slot, dark);
    if (industryDrawn) return industryDrawn;
    if (componentId === 'hero-image') {
      const image = mediaForRole(plan, s, slideRole(s));
      if (image && fileExists(image)) {
        const z = slot || { x:8.18, y:1.08, w:3.20, h:2.48 };
        deps.addSmartPhotoPanel(slide, image, z.x, z.y, z.w, z.h, { role:'evidence', tone:dark ? 'dark' : 'light', fit:'cover' });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if (componentId === 'kpi-strip' || componentId === 'metric-strip') {
      const metrics = overlayMetricsForSlide(plan, s);
      if (metrics.length) {
        const z = slot || { x:0.86, y:['cover', 'cover-dark'].includes(s.type || '') ? 5.90 : 6.12, w:10.30, h:0.58 };
        const component = deps.metricStrip(slide, metrics, z.x, z.y, z.w, { h:z.h || 0.58, max:4, transparency:dark ? 18 : 0 });
        return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
      }
    }
    if (componentId === 'chart-commentary-panel') {
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
    if (componentId === 'value-chain' || componentId === 'system-rail') {
      const points = overlayPointsForSlide(s);
      const z = slot || {};
      const component = drawOverlayValueChain(slide, points, Object.assign({ dark }, z));
      if (component) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
    }
    if (componentId === 'process-rail') {
      const points = overlayPointsForSlide(s);
      if (points.length >= 2) {
        const z = slot || { x:0.94, y:6.18, w:4.48, h:0.54 };
        deps.processRail(slide, points, z.x, z.y + 0.06, z.w, { max:5, dark, line:dark ? C.darkLine : C.line, lineTransparency:dark ? 44 : 18 });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z, itemCount:points.slice(0, 5).length };
      }
    }
    if (componentId === 'proof-gallery') {
      const items = overlayProofItemsForSlide(plan, s);
      const images = overlayImagesForSlide(plan, s);
      if (!items.length && !images.length) return { id:componentId, mode:'not-rendered', rendered:false, reason:'no-explicit-proof-gallery-content' };
      const z = slot || {};
      const proof = s.proof || {};
      const component = drawOverlayProofGallery(slide, items, Object.assign({
        dark,
        images,
        labelPrefix:grammarDecision.proofLabel,
        caption:s.caption || (s.visual && s.visual.caption) || proof.caption || proof.sourceNote || proof.source_note || '',
        showSourceNote,
        sourceNote:componentSourceNoteText(plan, s)
      }, z));
      if (component) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
    }
    if (componentId === 'risk-register') {
      const rows = Array.isArray(s.rows) && s.rows.length ? s.rows : overlayProofItemsForSlide(plan, s);
      const z = slot || {};
      const component = deps.renderRiskRegister(componentRendererContext(slide), rows, Object.assign({ dark }, z));
      if (component.rendered) return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
    }
    if (componentId === 'product-matrix') {
      const items = overlayProductItemsForSlide(plan, s).slice(0, 4);
      if (items.length) {
        const z = slot || { x:8.04, y:4.92, w:3.58, h:0.58 };
        const component = renderProductMatrix(componentRendererContext(slide), items, {
          bbox: z,
          dark,
          itemTitle,
          label:grammarDecision.productMatrixLabel || 'PRODUCT PROOF MATRIX'
        });
        if (component.rendered) return Object.assign({ id:componentId, mode:'overlay' }, component);
      }
    }
    if (componentId === 'source-note') {
      const text = componentSourceNoteText(plan, s);
      if (text) {
        const z = slot || { x:8.10, y:7.05, w:4.20, h:0.16 };
        deps.sourceNote(slide, text, z.x, z.y, { w:z.w, h:z.h, fontSize:6.9, dark });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if (componentId === 'caption-bar') {
      const proof = s.proof || {};
      const caption = s.caption || (s.visual && s.visual.caption) || proof.caption || proof.sourceNote || proof.source_note || '';
      if (caption) {
        const z = slot || { x:0.86, y:6.50, w:4.80, h:0.28 };
        deps.addCaptionBar(slide, z.x, z.y, z.w, z.h, {
          label:grammarDecision.captionLabel || '证据',
          caption,
          dark,
          transparency:dark ? 72 : 86
        });
        return { id:componentId, mode:'overlay', rendered:true, bbox:z };
      }
    }
    if (componentId === 'commentary-panel') {
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
    if (chartComponentIds.has(componentId)) {
      const spec = s.chartSpec || routeChartSpec(plan, s, { index:idx, total:(plan.slides || []).length });
      if (spec) {
        const component = renderChartSpec(componentRendererContext(slide), spec, { x:4.06, y:2.16, w:7.44, h:3.76, showSourceNote });
        if (component.rendered) {
          recordChartConsumption(slide, spec, component, { plannedComponentId:componentId, mode:'overlay' });
          return Object.assign({ id:componentId, mode:'overlay', rendered:true }, component);
        }
      }
    }
    return { id:componentId, mode:'not-rendered', rendered:false };
  }

  return {
    renderOverlayComponent
  };
}

module.exports = {
  createOverlayComponentRenderer
};
