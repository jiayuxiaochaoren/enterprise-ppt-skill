function createOverlayRenderGuardHelpers(deps = {}) {
  const overlaySlotForComponent = deps.overlaySlotForComponent || (() => null);
  const componentBlockedByContract = deps.componentBlockedByContract || (() => false);
  const componentSlotConflicts = deps.componentSlotConflicts || (() => false);
  const overlaySlotConflicts = deps.overlaySlotConflicts || (() => null);

  function guardOverlayRender(componentId, nativeIds, contract = {}, existingOverlays = []) {
    const slot = overlaySlotForComponent(contract, componentId);
    const ownedByNative = nativeIds && typeof nativeIds.has === 'function' && nativeIds.has(componentId);
    if (componentBlockedByContract(contract, componentId)) {
      return {
        slot,
        ownedByNative,
        blocked: {
          id: componentId,
          mode: 'blocked-unsafe-overlay',
          rendered: false,
          reason: 'no safe overlay zone declared by native renderer contract'
        }
      };
    }
    if (!ownedByNative && componentSlotConflicts(contract, slot)) {
      return {
        slot,
        ownedByNative,
        blocked: {
          id: componentId,
          mode: 'blocked-native-zone-conflict',
          rendered: false,
          bbox: slot,
          reason: 'safe overlay zone conflicts with native occupied zone'
        }
      };
    }
    const overlayConflict = !ownedByNative ? overlaySlotConflicts(existingOverlays, slot) : null;
    if (overlayConflict) {
      return {
        slot,
        ownedByNative,
        blocked: {
          id: componentId,
          mode: 'blocked-overlay-zone-conflict',
          rendered: false,
          bbox: slot,
          reason: `safe overlay zone conflicts with already rendered component ${overlayConflict.id || overlayConflict.componentId || 'overlay'}`
        }
      };
    }
    return {
      slot,
      ownedByNative,
      blocked: null
    };
  }

  return {
    guardOverlayRender
  };
}

module.exports = {
  createOverlayRenderGuardHelpers
};
