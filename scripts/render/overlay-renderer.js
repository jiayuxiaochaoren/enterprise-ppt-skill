const { createOverlayDataHelpers } = require('./overlay-renderer-data');
const { createOverlayRenderGuardHelpers } = require('./overlay-renderer-guards');
const { createOverlayNativeEvidence } = require('./overlay-native-evidence');
const { createOverlayComponentRenderer } = require('./overlay-component-renderer');

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
  const {
    componentSourceNoteText,
    overlayMetricsForSlide,
    overlayPointsForSlide,
    overlayProofItemsForSlide
  } = createOverlayDataHelpers({
    compactText,
    itemBody,
    itemTitle
  });
  const {
    evidenceZone,
    nativeDrawnEvidenceFor
  } = createOverlayNativeEvidence({
    chartComponentIds,
    nativeRendererModule,
    canvasWidth,
    canvasHeight,
    zone,
    mediaForRole,
    slideRole,
    slideHasChartSpecIntent,
    componentSourceNoteText
  });
  const {
    guardOverlayRender
  } = createOverlayRenderGuardHelpers({
    overlaySlotForComponent,
    componentBlockedByContract,
    componentSlotConflicts,
    overlaySlotConflicts
  });
  const {
    renderOverlayComponent
  } = createOverlayComponentRenderer(Object.assign({}, deps, {
    chartComponentIds,
    nativeRendererModule,
    colors,
    panelFill,
    compactText,
    componentRendererContext,
    fileExists,
    guardOverlayRender,
    slideRenderedDark,
    slideRole,
    mediaForRole,
    routeChartSpec,
    renderChartSpec,
    recordChartConsumption,
    nativeDrawnEvidenceFor,
    componentSourceNoteText,
    overlayMetricsForSlide,
    overlayPointsForSlide,
    overlayProofItemsForSlide,
    itemTitle
  }));

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
