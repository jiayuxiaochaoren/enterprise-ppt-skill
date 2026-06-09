const path = require('path');
const { enrichAssetDecision } = require('./asset-decision-meta');
const {
  assetTargetContract
} = require('../design/asset-generation');
const {
  imageAuthorizationStatus,
  imageProofEligibility,
  imageProvenanceClass,
  normalizeAuthorizationStatus,
  preferredAuthorizationStatus,
  sourceTraceForSlide
} = require('../design/source-evidence');

function createRenderMetaHelpers(deps = {}) {
  const {
    chartConsumedFields,
    chartSpecToComponentId,
    cwd = () => process.cwd(),
    mediaForRole,
    shortHash,
    slideRole,
    visualRole
  } = deps;

  const hash = typeof shortHash === 'function'
    ? shortHash
    : value => String(value || '').slice(0, 16);

  function assetRefsForSlide(plan = {}, s = {}) {
    const refs = [];
    const push = value => {
      if (Array.isArray(value)) value.forEach(push);
      else if (value) refs.push(String(value));
    };
    push(s.image);
    push(s.images);
    if (s.visual) {
      push(s.visual.image);
      push(s.visual.images);
    }
    if (typeof mediaForRole === 'function') {
      push(mediaForRole(plan, s, typeof slideRole === 'function' ? slideRole(s) : undefined, { includeDefault:false }));
    }
    const unique = new Map();
    refs.forEach(ref => {
      const key = /^https?:\/\//i.test(ref) ? ref : path.resolve(typeof cwd === 'function' ? cwd() : String(cwd || process.cwd()), ref);
      if (!unique.has(key)) unique.set(key, ref);
    });
    return [...unique.values()];
  }

  function defaultMediaRefsForSlide(plan = {}, s = {}) {
    if (typeof mediaForRole !== 'function') return [];
    const role = typeof slideRole === 'function' ? slideRole(s) : undefined;
    const defaultRef = mediaForRole(plan, s, role);
    const explicitRef = mediaForRole(plan, s, role, { includeDefault:false });
    if (!defaultRef || explicitRef === defaultRef) return [];
    return [defaultRef];
  }

  function sourceTraceForMeta(s = {}) {
    return sourceTraceForSlide(s);
  }

  function authorizationRiskLevel(status = '') {
    const normalized = normalizeAuthorizationStatus(status);
    if (normalized === 'blocked') return 'high';
    if (normalized === 'unknown') return 'medium';
    return '';
  }

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
      return generation.boundAssets.map(item => Object.assign({}, item, {
        imageAspectRatio: numericAspect(item.imageAspectRatio),
        targetAspectRatio: numericAspect(item.targetAspectRatio || (item.assetTarget && item.assetTarget.aspectRatio)),
        aspectMismatch: numericAspect(item.aspectMismatch),
        targetSource: item.targetSource || (item.assetTarget && item.assetTarget.targetSource) || '',
        fitPolicy: item.fitPolicy || (item.assetTarget && item.assetTarget.fitPolicy) || ''
      }));
    }
    return refs.map((ref, i) => {
      const provenanceItem = provenanceForRef(ref, provenance) || provenance[i] || {};
      const fit = fitDecisions[i] || {};
      const imageAspectRatio = numericAspect(provenanceItem.imageAspectRatio) ?? numericAspect(fit.imageAspectRatio);
      const targetAspectRatio = numericAspect(provenanceItem.targetAspectRatio) ?? numericAspect(target && target.aspectRatio);
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
        aspectMismatchAllowed: provenanceItem.aspectMismatchAllowed || undefined,
        targetSlot: (provenanceItem.assetTarget && provenanceItem.assetTarget.slot) || (target && target.slot) || undefined,
        targetSource: (provenanceItem.assetTarget && provenanceItem.assetTarget.targetSource) || (target && target.targetSource) || '',
        fitPolicy: (provenanceItem.assetTarget && provenanceItem.assetTarget.fitPolicy) || (target && target.fitPolicy) || '',
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

  function assetDecisionForMeta(plan = {}, s = {}, renderedSlide = null) {
    const generation = s.assetGeneration || {};
    const refs = assetRefsForSlide(plan, s);
    const defaultMediaRefs = defaultMediaRefsForSlide(plan, s);
    const trace = sourceTraceForMeta(s);
    const provenance = Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [];
    const status = generation.status || (refs.length ? 'bound' : (s.generatedAssetPrompt ? 'required' : 'none'));
    const role = generation.role || (s.visual && s.visual.role) || (typeof visualRole === 'function' ? visualRole(plan, s) : '') || '';
    let mode = 'none';
    if (status === 'blocked') mode = 'blocked';
    else if (refs.length) mode = 'bound';
    else if (status === 'none') mode = 'structure-only';
    else if (s.generatedAssetPrompt) mode = 'pending-generation';
    else if (status === 'required' || generation.mustBind) mode = 'needs-generation';
    else if (status === 'optional') mode = 'optional-generation';
    const proofEligibility = [...new Set(provenance.map(imageProofEligibility).filter(Boolean))];
    const provenanceClasses = [...new Set(provenance.map(imageProvenanceClass).filter(Boolean))];
    const authorizationStatuses = [...new Set([
      trace.assetAuthorizationStatus,
      ...((trace.assetAuthorizationStatuses) || []),
      ...provenance.map(imageAuthorizationStatus)
    ].filter(Boolean))];
    const preferredStatus = preferredAuthorizationStatus(authorizationStatuses);
    const authorizationStatus = preferredStatus || 'none';
    const authorizationStatusNormalized = preferredStatus
      ? normalizeAuthorizationStatus(preferredStatus)
      : 'none';
    const enriched = enrichAssetDecision({ generation, provenance, refs, role, slide:s, status, mode, trace });
    const target = generation.target || assetTargetContract(plan, s, generation.originalRole || role, {
      resolvedRole: generation.resolvedRole || generation.role || role
    });
    const fitDecisions = (renderedSlide && Array.isArray(renderedSlide.__codexImageFits)) ? renderedSlide.__codexImageFits : [];
    const fitDecision = fitDecisions[0] || null;
    const boundAssets = boundAssetsForMeta(generation, provenance, refs, fitDecisions, target);
    const firstBoundAsset = boundAssets[0] || {};
    const imageDimensions = generation.imageDimensions || firstBoundAsset.dimensions || firstProvenanceDimensions(provenance) || (fitDecision && fitDecision.imageDimensions) || null;
    const imageAspectRatio = numericAspect(generation.imageAspectRatio) ??
      numericAspect(firstBoundAsset.imageAspectRatio) ??
      numericAspect(provenance.find(item => item && item.imageAspectRatio) && provenance.find(item => item && item.imageAspectRatio).imageAspectRatio) ??
      numericAspect(fitDecision && fitDecision.imageAspectRatio);
    const targetAspectRatio = numericAspect(generation.targetAspectRatio) ?? numericAspect(target && target.aspectRatio);
    const worstAspectMismatch = numericAspect(generation.worstAspectMismatch) ??
      numericAspect(generation.aspectMismatch) ??
      maxAspectMismatch(boundAssets);
    const aspectMismatch = numericAspect(generation.aspectMismatch) ??
      worstAspectMismatch ??
      numericAspect(provenance.find(item => item && item.aspectMismatch != null) && provenance.find(item => item && item.aspectMismatch != null).aspectMismatch) ??
      numericAspect(
        imageAspectRatio && targetAspectRatio
          ? Math.abs(imageAspectRatio - targetAspectRatio) / targetAspectRatio
          : null
      );
    const authorizationRisk = authorizationRiskLevel(preferredStatus);
    const riskLevel = authorizationRisk === 'high'
      ? 'high'
      : (authorizationRisk === 'medium' && enriched.riskLevel === 'low' ? 'medium' : enriched.riskLevel);
    const reviewRequired = Boolean(enriched.reviewRequired || authorizationRisk);
    const proofEligibilityValues = enriched.action === 'skip_image' && !refs.length
      ? [enriched.proofEligibilitySummary || 'none']
      : proofEligibility.length
      ? proofEligibility
      : [enriched.proofEligibilitySummary || 'none'].filter(Boolean);
    const provenanceClass = enriched.provenanceClass || provenanceClasses[0] || 'none';
    const reason = generation.reason ||
      (enriched.action === 'skip_image' ? 'image skipped by asset decision' : '') ||
      (refs.length ? 'asset bound from slide media' : '') ||
      (s.generatedAssetPrompt ? 'generated asset prompt pending binding' : '') ||
      (status === 'blocked' ? 'asset generation blocked for proof safety' : '') ||
      'no image required for resolved slide route';
    return {
      version: 'asset-decision/v1',
      status,
      mode,
      action: enriched.action,
      role,
      originalRole: enriched.originalRole || role || 'none',
      resolvedRole: enriched.resolvedRole || role || 'none',
      visualMode: (s.visual && s.visual.mode) || s.visualMode || '',
      mustBind: generation.mustBind === true,
      syntheticOnly: generation.syntheticOnly === true,
      staleForRoute: generation.staleForRoute === true,
      riskLevel,
      reason,
      source: enriched.source,
      generatedAssetPrompt: Boolean(s.generatedAssetPrompt),
      generatedAssetPromptHash: s.generatedAssetPrompt ? hash(String(s.generatedAssetPrompt)) : '',
      assetTarget: target || null,
      targetSlot: target && target.slot ? target.slot : null,
      targetAspectRatio,
      targetOrientation: target ? target.orientation : '',
      targetSource: target ? target.targetSource : '',
      targetPixelSize: target && target.targetPixelSize ? target.targetPixelSize : null,
      imagegenSizeHint: target && target.imagegenSizeHint ? target.imagegenSizeHint : null,
      targetReviewRequired: Boolean(target && target.reviewRequired),
      imageDimensions,
      imageAspectRatio,
      aspectMismatch,
      worstAspectMismatch,
      aspectMismatchAllowed: generation.aspectMismatchAllowed === true || provenance.some(item => item && item.aspectMismatchAllowed === true),
      fitDecision: fitDecision ? fitDecision.fit : (target && target.fitPolicy) || '',
      renderedSlot: fitDecision && fitDecision.slot ? fitDecision.slot : null,
      renderedSlotAspectRatio: fitDecision ? fitDecision.slotAspectRatio : undefined,
      fitFallbackContain: Boolean(fitDecision && fitDecision.fallbackContain),
      boundAssetCount: refs.length,
      boundAssetRefs: refs,
      boundAssets,
      defaultMediaCount: defaultMediaRefs.length,
      defaultMediaRefs,
      hasBoundAsset: refs.length > 0,
      authorizationStatus,
      authorizationStatusNormalized,
      provenanceClass,
      provenanceClasses,
      proofEligibility: proofEligibilityValues,
      proofEligibilitySummary: enriched.proofEligibilitySummary || proofEligibilityValues[0] || 'none',
      imageProvenanceCount: provenance.length,
      skippedCriticalVisual: enriched.skippedCriticalVisual,
      reviewRequired,
      proofUse: proofEligibilityValues.includes('factual-proof')
        ? 'factual-proof'
        : (proofEligibilityValues.includes('synthetic-only') || generation.syntheticOnly ? 'synthetic-only' : '')
    };
  }

  function compactChartSpecForMeta(spec = {}) {
    if (!spec) return null;
    return {
      version: spec.version,
      id: spec.id || '',
      kind: spec.kind || '',
      requestedKind: spec.requestedKind || '',
      source: spec.source || '',
      routeSource: spec.routeSource || '',
      componentId: typeof chartSpecToComponentId === 'function' ? chartSpecToComponentId(spec) : '',
      industryTemplate: spec.industryTemplate || '',
      title: spec.title || '',
      insight: spec.insight || '',
      categories: spec.categories || [],
      unit: spec.unit || '',
      period: spec.period || '',
      baseline: spec.baseline || '',
      proofObject: spec.proofObject || '',
      sourceTrace: spec.sourceTrace || null,
      dataQuality: spec.dataQuality || null,
      informationGap: spec.informationGap || null,
      chartContractError: spec.chartContractError || null
    };
  }

  function recordChartConsumption(slide, spec = {}, result = {}, opts = {}) {
    if (!slide || !spec) return;
    const componentId = typeof chartSpecToComponentId === 'function' ? chartSpecToComponentId(spec) : '';
    slide.__codexChartConsumption = {
      plannedKind: spec.requestedKind || spec.kind || '',
      actualKind: spec.kind || '',
      plannedComponentId: opts.plannedComponentId || componentId,
      actualComponentId: result.componentId || componentId,
      rendererModule: result.rendererModule || '',
      mode: opts.mode || 'native',
      rendered: Boolean(result.rendered),
      degraded: Boolean(spec.requestedKind && spec.requestedKind !== spec.kind) || spec.kind === 'informationGap',
      consumedFields: typeof chartConsumedFields === 'function' ? chartConsumedFields(spec) : [],
      visualChecks: result.visualChecks || {},
      spec: compactChartSpecForMeta(spec)
    };
  }

  return {
    assetDecisionForMeta,
    assetRefsForSlide,
    compactChartSpecForMeta,
    defaultMediaRefsForSlide,
    recordChartConsumption,
    sourceTraceForMeta
  };
}

module.exports = {
  createRenderMetaHelpers
};
