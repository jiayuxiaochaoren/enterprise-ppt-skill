const path = require('path');
const { enrichAssetDecision } = require('./asset-decision-meta');

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
      push(mediaForRole(plan, s, typeof slideRole === 'function' ? slideRole(s) : undefined));
    }
    const unique = new Map();
    refs.forEach(ref => {
      const key = /^https?:\/\//i.test(ref) ? ref : path.resolve(typeof cwd === 'function' ? cwd() : String(cwd || process.cwd()), ref);
      if (!unique.has(key)) unique.set(key, ref);
    });
    return [...unique.values()];
  }

  function sourceTraceForMeta(s = {}) {
    return (s.proof && s.proof.sourceTrace) || s.sourceTrace || {};
  }

  function assetDecisionForMeta(plan = {}, s = {}) {
    const generation = s.assetGeneration || {};
    const refs = assetRefsForSlide(plan, s);
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
    const proofEligibility = [...new Set(provenance.map(item => item.proofEligibility || '').filter(Boolean))];
    const provenanceClasses = [...new Set(provenance.map(item => item.provenanceClass || item.provenance || '').filter(Boolean))];
    const authorizationStatuses = [...new Set([
      trace.assetAuthorizationStatus,
      ...provenance.map(item => item.authorizationStatus)
    ].filter(Boolean))];
    const enriched = enrichAssetDecision({ generation, provenance, refs, role, slide:s, status, mode, trace });
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
      riskLevel: enriched.riskLevel,
      reason,
      source: enriched.source,
      generatedAssetPrompt: Boolean(s.generatedAssetPrompt),
      generatedAssetPromptHash: s.generatedAssetPrompt ? hash(String(s.generatedAssetPrompt)) : '',
      boundAssetCount: refs.length,
      boundAssetRefs: refs,
      hasBoundAsset: refs.length > 0,
      authorizationStatus: authorizationStatuses[0] || '',
      provenanceClass,
      provenanceClasses,
      proofEligibility: proofEligibilityValues,
      proofEligibilitySummary: enriched.proofEligibilitySummary || proofEligibilityValues[0] || 'none',
      imageProvenanceCount: provenance.length,
      skippedCriticalVisual: enriched.skippedCriticalVisual,
      reviewRequired: enriched.reviewRequired,
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
    recordChartConsumption,
    sourceTraceForMeta
  };
}

module.exports = {
  createRenderMetaHelpers
};
