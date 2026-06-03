const CHART_ROUTE_TYPES = new Set(['metric-comparison', 'industry-chart', 'finance-bridge']);

function createRouteSanitizationHelpers(deps = {}) {
  const {
    highValuePageFamilies = new Set(),
    layoutVariantCompatibleWithType = () => true
  } = deps;

  function sanitizeRouteInput(plan = {}, s = {}, typePick = {}) {
    const routedInput = Object.assign({}, s);
    const routeSanitization = {
      version: 'route-sanitization/v1',
      mode: plan.normalizationMode || plan.normalization_mode || (plan.finalized || plan.plannerFinalized ? 'finalized' : 'compat'),
      before: {
        type: s.type || '',
        layoutVariant: s.layoutVariant || '',
        variant: s.variant || '',
        proofObject: s.proofObject || s.proof_object || ''
      },
      after: {},
      removed: [],
      suppressed: [],
      recomputed: [],
      staleForRoute: [],
      active: []
    };
    const normalizedType = typePick.type || '';
    const valueKind = value => value && typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') : typeof value;
    const previousRefFor = field => `previous${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const recordStale = (field, value, reason, resolution) => {
      routeSanitization.staleForRoute.push({
        field,
        reason,
        resolution,
        previousValueRef: previousRefFor(field),
        previousKind: valueKind(value)
      });
    };
    const recordRemoval = (field, value, reason) => {
      routeSanitization.removed.push({
        field,
        reason,
        previousValueRef: previousRefFor(field),
        previousKind: valueKind(value)
      });
      recordStale(field, value, reason, 'removed');
    };
    const recordSuppression = (field, value, reason, resolution = 'suppressed') => {
      routeSanitization.suppressed.push({
        field,
        reason,
        previousValueRef: previousRefFor(field),
        previousKind: valueKind(value)
      });
      recordStale(field, value, reason, resolution);
    };
    if (routedInput.layoutVariant && !layoutVariantCompatibleWithType(normalizedType, routedInput.layoutVariant)) {
      recordRemoval('layoutVariant', routedInput.layoutVariant, `layoutVariant incompatible with normalized type ${normalizedType}`);
      routedInput.previousLayoutVariant = routedInput.previousLayoutVariant || routedInput.layoutVariant;
      delete routedInput.layoutVariant;
    }
    if (routedInput.variant && (!routedInput.layoutVariant || routedInput.variant !== routedInput.layoutVariant) && !layoutVariantCompatibleWithType(normalizedType, routedInput.variant)) {
      recordRemoval('variant', routedInput.variant, `variant incompatible with normalized type ${normalizedType}`);
      routedInput.previousVariant = routedInput.previousVariant || routedInput.variant;
      delete routedInput.variant;
    }
    const proofObjectVariant = String(routedInput.proofObject || routedInput.proof_object || '').trim();
    if (proofObjectVariant && highValuePageFamilies.has(proofObjectVariant) && !layoutVariantCompatibleWithType(normalizedType, proofObjectVariant)) {
      recordRemoval('proofObject', proofObjectVariant, `proofObject incompatible with normalized type ${normalizedType}`);
      routedInput.previousProofObject = routedInput.previousProofObject || proofObjectVariant;
      delete routedInput.proofObject;
      delete routedInput.proof_object;
    }
    if (!CHART_ROUTE_TYPES.has(normalizedType) && routedInput.chartSpec) {
      recordRemoval('chartSpec', routedInput.chartSpec, `chartSpec not valid for normalized type ${normalizedType}`);
      routedInput.previousChartSpec = routedInput.previousChartSpec || routedInput.chartSpec;
      delete routedInput.chartSpec;
      delete routedInput.chartSpecInferred;
    }
    if (!CHART_ROUTE_TYPES.has(normalizedType) && (routedInput.dataComponent || routedInput.data_component)) {
      recordRemoval('dataComponent', routedInput.dataComponent || routedInput.data_component, `dataComponent not valid for normalized type ${normalizedType}`);
      routedInput.previousDataComponent = routedInput.previousDataComponent || routedInput.dataComponent || routedInput.data_component;
      delete routedInput.dataComponent;
      delete routedInput.data_component;
    }
    const routeChanged = routeSanitization.removed.length > 0;
    const previousComponentPlan = routeChanged && routedInput.componentPlan ? routedInput.componentPlan : null;
    const previousCompositionPlan = routeChanged && routedInput.compositionPlan ? routedInput.compositionPlan : null;
    const previousAssetGeneration = routeChanged && routedInput.assetGeneration ? routedInput.assetGeneration : null;
    if (previousComponentPlan) {
      routedInput.previousComponentPlan = routedInput.previousComponentPlan || previousComponentPlan;
      recordSuppression('componentPlan', previousComponentPlan, 'component plan suppressed before recompute because route-sensitive metadata changed', 'recomputed');
      delete routedInput.componentPlan;
    }
    if (previousCompositionPlan) {
      routedInput.previousCompositionPlan = routedInput.previousCompositionPlan || previousCompositionPlan;
      recordSuppression('compositionPlan', previousCompositionPlan, 'composition plan suppressed before recompute because route-sensitive metadata changed', 'recomputed');
      delete routedInput.compositionPlan;
    }
    if (previousAssetGeneration) {
      routedInput.previousAssetGeneration = routedInput.previousAssetGeneration || previousAssetGeneration;
      recordSuppression('assetGeneration', previousAssetGeneration, 'asset-generation decision suppressed before recompute because route-sensitive metadata changed', 'recomputed');
      delete routedInput.assetGeneration;
    }
    if (routeChanged && routedInput.generatedAssetPrompt) {
      routedInput.previousGeneratedAssetPrompt = routedInput.previousGeneratedAssetPrompt || routedInput.generatedAssetPrompt;
      recordRemoval('generatedAssetPrompt', routedInput.generatedAssetPrompt, 'generated asset prompt removed because route-sensitive metadata changed');
      delete routedInput.generatedAssetPrompt;
    }
    return {
      previousAssetGeneration,
      previousComponentPlan,
      previousCompositionPlan,
      routedInput,
      routeChanged,
      routeSanitization
    };
  }

  return {
    sanitizeRouteInput
  };
}

module.exports = {
  CHART_ROUTE_TYPES,
  createRouteSanitizationHelpers
};
