const path = require('path');

function firstProvenanceDimensions(provenance = []) {
  const item = provenance.find(value => value && value.dimensions);
  return item ? item.dimensions : null;
}

function provenanceForRef(ref = '', provenance = []) {
  const value = String(ref || '');
  return provenance.find(item => {
    const file = String((item && (item.file || item.path)) || '');
    return file === value || path.basename(file) === path.basename(value);
  }) || null;
}

function numericAspect(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(3)) : null;
}

function boundAssetsForMeta(generation = {}, provenance = [], refs = [], fitDecisions = [], target = null) {
  if (Array.isArray(generation.boundAssets) && generation.boundAssets.length) {
    return generation.boundAssets.map(item => {
      const fitPolicy = item.fitPolicy || (item.assetTarget && item.assetTarget.fitPolicy) || '';
      const fitMode = String(fitPolicy || '').toLowerCase();
      const aspectMismatchAllowed = item.aspectMismatchAllowed === true ||
        fitMode === 'contain' ||
        fitMode === 'cover' ||
        fitMode === 'crop';
      return Object.assign({}, item, {
      imageAspectRatio: numericAspect(item.imageAspectRatio),
      targetAspectRatio: numericAspect(item.targetAspectRatio || (item.assetTarget && item.assetTarget.aspectRatio)),
      aspectMismatch: numericAspect(item.aspectMismatch),
      targetSource: item.targetSource || (item.assetTarget && item.assetTarget.targetSource) || '',
        fitPolicy,
        aspectMismatchAllowed: aspectMismatchAllowed || undefined
      });
    });
  }
  return refs.map((ref, i) => {
    const provenanceItem = provenanceForRef(ref, provenance) || provenance[i] || {};
    const fit = fitDecisions[i] || {};
    const imageAspectRatio = numericAspect(provenanceItem.imageAspectRatio) ?? numericAspect(fit.imageAspectRatio);
    const targetAspectRatio = numericAspect(provenanceItem.targetAspectRatio) ??
      numericAspect(fit.slotAspectRatio) ??
      numericAspect(target && target.aspectRatio);
    const fitMode = String(fit.fit || '').toLowerCase();
    const fitAllowsMismatch = fit.fallbackContain === true ||
      fitMode === 'contain' ||
      fitMode === 'cover' ||
      fitMode === 'crop';
    return {
      path: ref,
      dimensions: provenanceItem.dimensions || fit.imageDimensions || null,
      imageAspectRatio,
      targetAspectRatio,
      aspectMismatch: numericAspect(provenanceItem.aspectMismatch) ?? numericAspect(
        imageAspectRatio && targetAspectRatio
          ? Math.abs(imageAspectRatio - targetAspectRatio) / targetAspectRatio
          : null
      ),
      aspectMismatchAllowed: provenanceItem.aspectMismatchAllowed || fitAllowsMismatch || undefined,
      targetSlot: (provenanceItem.assetTarget && provenanceItem.assetTarget.slot) || fit.slot || (target && target.slot) || undefined,
      targetSource: (provenanceItem.assetTarget && provenanceItem.assetTarget.targetSource) || (fit.slot ? 'renderer-recorded-slot' : ((target && target.targetSource) || '')),
      fitPolicy: (provenanceItem.assetTarget && provenanceItem.assetTarget.fitPolicy) || fit.fit || (target && target.fitPolicy) || '',
      assetTarget: provenanceItem.assetTarget || target || undefined
    };
  });
}

function maxAspectMismatch(items = []) {
  const values = items
    .map(item => numericAspect(item && item.aspectMismatch))
    .filter(value => value != null);
  return values.length ? Math.max(...values) : null;
}

module.exports = {
  boundAssetsForMeta,
  firstProvenanceDimensions,
  maxAspectMismatch,
  numericAspect
};
