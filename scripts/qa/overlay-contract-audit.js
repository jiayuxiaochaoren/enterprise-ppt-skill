function rectsIntersect(a = {}, b = {}, pad = 0.015) {
  if ([a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h].some(v => v == null)) return false;
  return Math.max(a.x, b.x) < Math.min(a.x + a.w, b.x + b.w) - pad &&
    Math.max(a.y, b.y) < Math.min(a.y + a.h, b.y + b.h) - pad;
}

function rectInside(a = {}, b = {}, pad = 0.035) {
  if ([a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h].some(v => v == null)) return false;
  return a.x >= b.x - pad &&
    a.y >= b.y - pad &&
    a.x + a.w <= b.x + b.w + pad &&
    a.y + a.h <= b.y + b.h + pad;
}

function compactUnique(values = []) {
  const out = [];
  const seen = new Set();
  values.filter(v => v != null && String(v).trim()).forEach(value => {
    const key = String(value).trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  });
  return out;
}

function overlayContractAuditFromRender(renderMetaResult = {}) {
  const renderMeta = renderMetaResult.meta;
  const findings = [];
  if (!renderMeta) {
    return {
      version:'overlay-contract-audit/v1',
      status:'pass',
      renderMeta: renderMetaResult.file || '',
      findings
    };
  }
  (renderMeta.slides || []).forEach(slide => {
    const slideNo = Number(slide.slide || 0);
    const contract = slide.nativeRendererContract || {};
    const occupied = Array.isArray(contract.occupiedZones) ? contract.occupiedZones : [];
    const safeZones = Object.values(contract.safeOverlayZones || {});
    const consumed = Array.isArray(slide.consumedComponents) ? slide.consumedComponents : [];
    const slotForComponent = (id = '') => {
      const zones = contract.safeOverlayZones || {};
      return zones[id] ||
        (id === 'metric-strip' ? zones['kpi-strip'] : null) ||
        (id === 'value-chain-connector' ? zones['value-chain'] : null) ||
        null;
    };
    consumed.forEach(component => {
      if (/^blocked-/.test(component.mode || '')) {
        const required = component.required !== false;
        findings.push({
          slide: slideNo,
          level: required ? 'fail' : 'review',
          type:'unsafeOverlayBlocked',
          message:`component ${component.id} was blocked by native renderer contract (${component.mode})`
        });
      }
      if (component.mode !== 'overlay' || !component.bbox) return;
      const declaredSlot = slotForComponent(component.id);
      if (!declaredSlot) {
        findings.push({
          slide: slideNo,
          level:'fail',
          type:'overlayWithoutDeclaredSlot',
          message:`overlay ${component.id} rendered without a component-specific safe slot`
        });
        return;
      }
      if (!rectInside(component.bbox, declaredSlot)) {
        findings.push({
          slide: slideNo,
          level:'fail',
          type:'overlaySlotMismatch',
          message:`overlay ${component.id} bbox is outside its declared safe slot`
        });
      }
      const overlapsNative = occupied
        .filter(zone => zone.role !== 'native-footer')
        .some(zone => rectsIntersect(component.bbox, zone));
      const insideSafe = safeZones.some(zone => rectsIntersect(component.bbox, zone, -0.01));
      if (overlapsNative && !insideSafe) {
        findings.push({
          slide: slideNo,
          level:'fail',
          type:'overlayNativeZoneConflict',
          message:`overlay ${component.id} intersects native occupied zone outside a declared safe slot`
        });
      }
    });
    const overlayIds = consumed.filter(c => c.mode === 'overlay' && c.rendered).map(c => c.id);
    const duplicateOverlayIds = compactUnique(overlayIds.filter((id, i) => overlayIds.indexOf(id) !== i));
    duplicateOverlayIds.forEach(id => findings.push({
      slide: slideNo,
      level:'review',
      type:'duplicateOverlayComponent',
      message:`overlay component rendered more than once: ${id}`
    }));
    const decorations = Array.isArray(slide.decorations) ? slide.decorations : [];
    const loadCurves = decorations.filter(d => d.type === 'load-curve-band');
    if (loadCurves.length > 1) {
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'duplicateLoadCurveBand',
        message:`${loadCurves.length} load-curve-band decorations on one slide; expected at most one`
      });
    }
    const rings = decorations.filter(d => d.type === 'breathing-circle');
    if (rings.length > 1) {
      findings.push({
        slide: slideNo,
        level:'review',
        type:'duplicateBreathingCircle',
        message:`${rings.length} background circle decorations on one slide`
      });
    }
    const textOrCardZones = occupied.filter(zone => /text|card|caption|path/i.test(zone.role || ''));
    rings.forEach(ring => {
      const collision = textOrCardZones.find(zone => rectsIntersect(ring, zone, 0.04));
      if (collision) {
        findings.push({
          slide: slideNo,
          level:'fail',
          type:'breathingCircleTextZoneConflict',
          message:`background circle enters ${collision.id}; rings must stay in the main visual area`
        });
      }
    });
  });
  return {
    version:'overlay-contract-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    findings
  };
}

module.exports = {
  compactUnique,
  overlayContractAuditFromRender,
  rectInside,
  rectsIntersect
};
