const {
  CHART_COMPONENT_IDS,
  OVERLAY_PRONE_COMPONENT_IDS
} = require('./component-capability-manifest');
const {
  plannedComponentsForSlide,
  reportBoardNeedsRightOverlayRail
} = require('./overlay-component-planning');
const { createOverlayZoneHelpers } = require('./overlay-contract-zones');
const {
  CHART_META_SUPPRESSED_NATIVE_VARIANTS,
  NATIVE_VARIANT_COMPONENTS,
  createNativeComponentIdHelpers,
  energyNativeOwnedComponentIds,
  isEnergyNativeRenderer,
  nativeOwnedComponentIdsFor,
  nativeVariantSuppressesChartMeta
} = require('./overlay-native-ownership');

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
  const {
    defaultSafeOverlayZonesFor,
    energyOccupiedZonesForRenderer,
    genericOccupiedZonesForSlide
  } = createOverlayZoneHelpers({
    H,
    W,
    reportBoardNeedsRightOverlayRail,
    z
  });
  const {
    nativeComponentIdsFor
  } = createNativeComponentIdHelpers({
    chartComponentIds: CHART_COMPONENT_IDS
  });

  function nativeRendererContractFor(plan = {}, s = {}, rendererName = '') {
    const type = String(s.type || '');
    const variant = String(s.layoutVariant || s.variant || '');
    const owned = nativeComponentIdsFor(plan, s);
    if (isEnergyNativeRenderer(plan, rendererName)) {
      energyNativeOwnedComponentIds().forEach(id => owned.add(id));
    }
    const safeOverlayZones = isEnergyNativeRenderer(plan, rendererName)
      ? { 'source-note': z('source-note-footer', 8.10, 7.02, 4.20, 0.22, 'safe-overlay') }
      : defaultSafeOverlayZonesFor(plan, s);
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
