function familyForType(type = '') {
  const t = String(type || '').toLowerCase();
  if (/^cover|opening|intro/.test(t)) return 'cover';
  if (/^closing|thank/.test(t)) return 'closing';
  if (/chapter|toc|agenda/.test(t)) return 'chapter';
  if (/architecture|blueprint|topology|capability|service/.test(t)) return 'architecture';
  if (/financial|finance|kpi|metric|scorecard|chart|bridge/.test(t)) return 'financial';
  if (/risk|governance|materiality|matrix/.test(t)) return 'risk';
  if (/gallery|evidence|proof|lookbook|case|photo|product|beauty/.test(t)) return 'evidence-gallery';
  return 'business';
}

function compactComponentPlan(componentPlan = {}) {
  if (!componentPlan || typeof componentPlan !== 'object') return null;
  return {
    version: componentPlan.version || '',
    componentIds: Array.isArray(componentPlan.componentIds)
      ? componentPlan.componentIds
      : (Array.isArray(componentPlan.components) ? componentPlan.components.map(c => c.id).filter(Boolean) : []),
    unknownComponents: Array.isArray(componentPlan.unknownComponents) ? componentPlan.unknownComponents : [],
    rulesApplied: Array.isArray(componentPlan.rulesApplied) ? componentPlan.rulesApplied : []
  };
}

function assetPolicyForSlide(slide = {}) {
  const generation = slide.assetGeneration || {};
  return {
    status: generation.status || 'none',
    role: generation.role || (slide.visual && slide.visual.role) || '',
    mustBind: generation.mustBind === true,
    syntheticOnly: generation.syntheticOnly === true,
    staleForRoute: generation.staleForRoute === true || generation.previousDecisionStale === true,
    hasPrompt: Boolean(slide.generatedAssetPrompt),
    hasBoundAsset: Boolean((slide.visual && slide.visual.image) || slide.image || (Array.isArray(slide.images) && slide.images.length))
  };
}

function renderRouteForSlide(plan = {}, slide = {}, idx = 0, opts = {}) {
  const match = opts.renderMatch || {};
  const requestedType = slide.type || '';
  return {
    version: 'render-route/v1',
    slide: idx,
    family: familyForType(requestedType),
    requestedType,
    renderer: {
      id: match.rendererId || match.matchedType || requestedType || '',
      name: match.rendererName || '',
      matchKind: match.matchKind || '',
      source: match.source || '',
      alias: match.alias || undefined
    },
    layoutVariant: slide.layoutVariant || slide.variant || '',
    proofObject: slide.proofObject || slide.proof_object || (slide.proof && slide.proof.id) || '',
    componentPlan: compactComponentPlan(slide.componentPlan),
    assetPolicy: assetPolicyForSlide(slide),
    routeSanitization: slide.routeSanitization || slide.normalizationAudit || null,
    qualityMode: plan.qualityMode || plan.quality_mode || ''
  };
}

function attachRenderRoute(slide = {}, route = {}) {
  slide.renderRoute = route;
  return slide;
}

module.exports = {
  assetPolicyForSlide,
  attachRenderRoute,
  compactComponentPlan,
  familyForType,
  renderRouteForSlide
};
