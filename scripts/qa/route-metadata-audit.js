function routeMetadataAuditFromRender(renderMetaResult = {}) {
  const renderMeta = renderMetaResult.meta;
  const findings = [];
  if (!renderMeta || !Array.isArray(renderMeta.slides)) {
    return {
      version:'route-metadata-audit/v1',
      status:'pass',
      renderMeta: renderMetaResult.file || '',
      findings
    };
  }
  (renderMeta.slides || []).forEach((slide, i) => {
    const slideNo = Number(slide.slide || i + 1);
    const route = slide.routeSanitization || slide.normalizationAudit || null;
    if (route) {
      ['removed', 'suppressed', 'recomputed', 'staleForRoute', 'active'].forEach(field => {
        if (!Array.isArray(route[field])) {
          findings.push({
            slide: slideNo,
            level:'fail',
            type:'routeMetadataAuditFieldMissing',
            message:`routeSanitization.${field} must be an array when route metadata was normalized`
          });
        }
      });
      const active = new Set(Array.isArray(route.active) ? route.active : []);
      (route.staleForRoute || []).forEach(entry => {
        if (!entry || !entry.field) {
          findings.push({
            slide: slideNo,
            level:'fail',
            type:'staleRouteMetadataEntryInvalid',
            message:'routeSanitization.staleForRoute entries must include field'
          });
          return;
        }
        if (!['removed', 'suppressed', 'recomputed'].includes(entry.resolution || '')) {
          findings.push({
            slide: slideNo,
            level:'fail',
            type:'staleRouteMetadataResolutionMissing',
            message:`stale route metadata ${entry.field} must record removed/suppressed/recomputed resolution`
          });
        }
        if (active.has(entry.field) && (entry.active === true || ['active', 'kept'].includes(entry.resolution || ''))) {
          findings.push({
            slide: slideNo,
            level:'fail',
            type:'staleRouteMetadataStillActive',
            message:`stale route metadata ${entry.field} is still active after route normalization`
          });
        }
      });
    }
    const asset = slide.assetDecision || {};
    if (asset.staleForRoute === true) {
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'staleAssetDecisionForRoute',
        message:'assetDecision.staleForRoute=true cannot pass formal route metadata audit'
      });
    }
    const staleConsumed = (slide.consumedComponents || []).filter(component => component.staleForRoute === true);
    staleConsumed.forEach(component => {
      findings.push({
        slide: slideNo,
        level:'fail',
        type:'staleComponentConsumptionForRoute',
        message:`component ${component.id || 'unknown'} was consumed from stale route metadata`
      });
    });
  });
  return {
    version:'route-metadata-audit/v1',
    status: findings.some(f => f.level === 'fail') ? 'fail' : (findings.length ? 'review' : 'pass'),
    renderMeta: renderMetaResult.file || '',
    findings
  };
}

module.exports = {
  routeMetadataAuditFromRender
};
