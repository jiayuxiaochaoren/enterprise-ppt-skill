const CHART_ROUTE_TYPES = new Set(['metric-comparison', 'industry-chart', 'finance-bridge']);
const TRUSTED_ASSET_DECISION_SOURCES = new Set([
  'asset-decision-gate/v1',
  'asset-binder/v1',
  'asset-resolution-facade/v1'
]);

function createRouteSanitizationHelpers(deps = {}) {
  const {
    highValuePageFamilies = new Set(),
    layoutVariantCompatibleWithType = () => true
  } = deps;

  function structuralArchetype(plan = {}, slide = {}, role = 'cover') {
    const camel = `${role}Archetype`;
    const snake = `${role}_archetype`;
    return String(
      slide[camel] ||
      slide[snake] ||
      plan[camel] ||
      plan[snake] ||
      ''
    ).trim().toLowerCase();
  }

  function industryDisallowsVariant(plan = {}, slide = {}, normalizedType = '', variant = '') {
    const key = String(variant || '').trim().toLowerCase();
    if (!key) return false;
    const industry = String(plan.industry || '').trim().toLowerCase();
    const coverArchetype = structuralArchetype(plan, slide, 'cover');
    const closingArchetype = structuralArchetype(plan, slide, 'closing');
    const manufacturingCover =
      industry === 'manufacturing-operations' ||
      coverArchetype === 'native-industrial-structure-cover';
    const manufacturingClosing =
      industry === 'manufacturing-operations' ||
      closingArchetype === 'decision-rollout-close';
    if (manufacturingCover && ['cover', 'cover-dark'].includes(normalizedType)) {
      return ['airy-concept-opening', 'editorial-cover'].includes(key);
    }
    if (manufacturingClosing && ['closing', 'closing-dark'].includes(normalizedType)) {
      return ['premium-closing-anchor'].includes(key);
    }
    return false;
  }

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
    const authoritativeCoverStyleSource = source => (
      ['slide', 'plan', 'art-direction', 'asset-decision-gate', 'asset-decision-gate/v1']
        .includes(String(source || '').trim().toLowerCase())
    );
    const isCurrentAssetDecision = generation => {
      if (!generation || typeof generation !== 'object') return false;
      const source = String(generation.decisionSource || generation.decision_source || '').trim();
      if (TRUSTED_ASSET_DECISION_SOURCES.has(source)) return true;
      if (generation.bound === true || Number(generation.boundCount || 0) > 0) return true;
      return false;
    };
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
    if (routedInput.layoutVariant && industryDisallowsVariant(plan, routedInput, normalizedType, routedInput.layoutVariant)) {
      recordRemoval('layoutVariant', routedInput.layoutVariant, `layoutVariant conflicts with industry-specific structural archetype for ${normalizedType}`);
      routedInput.previousLayoutVariant = routedInput.previousLayoutVariant || routedInput.layoutVariant;
      delete routedInput.layoutVariant;
    }
    if (routedInput.layoutVariant && !layoutVariantCompatibleWithType(normalizedType, routedInput.layoutVariant)) {
      recordRemoval('layoutVariant', routedInput.layoutVariant, `layoutVariant incompatible with normalized type ${normalizedType}`);
      routedInput.previousLayoutVariant = routedInput.previousLayoutVariant || routedInput.layoutVariant;
      delete routedInput.layoutVariant;
    }
    if (routedInput.variant && (!routedInput.layoutVariant || routedInput.variant !== routedInput.layoutVariant) && industryDisallowsVariant(plan, routedInput, normalizedType, routedInput.variant)) {
      recordRemoval('variant', routedInput.variant, `variant conflicts with industry-specific structural archetype for ${normalizedType}`);
      routedInput.previousVariant = routedInput.previousVariant || routedInput.variant;
      delete routedInput.variant;
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
    const previousComponentPlan = routedInput.componentPlan || routedInput.component_plan || null;
    const previousCompositionPlan = routedInput.compositionPlan || routedInput.composition_plan || null;
    const inputAssetGeneration = routedInput.assetGeneration || routedInput.asset_generation || null;
    const previousAssetGeneration = inputAssetGeneration && !(routeChanged === false && isCurrentAssetDecision(inputAssetGeneration))
      ? inputAssetGeneration
      : null;
    if (previousComponentPlan) {
      routedInput.previousComponentPlan = routedInput.previousComponentPlan || previousComponentPlan;
      recordSuppression(
        'componentPlan',
        previousComponentPlan,
        routeChanged
          ? 'component plan suppressed before recompute because route-sensitive metadata changed'
          : 'input component plan suppressed before canonical normalization',
        'recomputed'
      );
      delete routedInput.componentPlan;
      delete routedInput.component_plan;
    }
    if (previousCompositionPlan) {
      routedInput.previousCompositionPlan = routedInput.previousCompositionPlan || previousCompositionPlan;
      recordSuppression(
        'compositionPlan',
        previousCompositionPlan,
        routeChanged
          ? 'composition plan suppressed before recompute because route-sensitive metadata changed'
          : 'input composition plan suppressed before canonical normalization',
        'recomputed'
      );
      delete routedInput.compositionPlan;
      delete routedInput.composition_plan;
    }
    const coverStyleSource = routedInput.coverStyleSource || routedInput.cover_style_source || '';
    const explicitVisualCoverStyle = routedInput.visual && (routedInput.visual.coverStyle || routedInput.visual.cover_style);
    const preserveExplicitCoverStyle = Boolean(explicitVisualCoverStyle) ||
      authoritativeCoverStyleSource(coverStyleSource);
    if ((previousCompositionPlan || previousAssetGeneration) && routedInput.coverStyle && !preserveExplicitCoverStyle) {
      routedInput.previousCoverStyle = routedInput.previousCoverStyle || routedInput.coverStyle;
      recordRemoval(
        'coverStyle',
        routedInput.coverStyle,
        previousCompositionPlan
          ? 'cover style removed because composition metadata is being recomputed'
          : 'cover style removed because asset-generation decision is being recomputed'
      );
      delete routedInput.coverStyle;
      delete routedInput.cover_style;
      delete routedInput.coverStyleSource;
      delete routedInput.cover_style_source;
    }
    if ((previousCompositionPlan || previousAssetGeneration) && routedInput.contentTheme) {
      routedInput.previousContentTheme = routedInput.previousContentTheme || routedInput.contentTheme;
      recordRemoval(
        'contentTheme',
        routedInput.contentTheme,
        previousCompositionPlan
          ? 'content theme removed because composition metadata is being recomputed'
          : 'content theme removed because asset-generation decision is being recomputed'
      );
      delete routedInput.contentTheme;
      delete routedInput.content_theme;
    }
    if (previousAssetGeneration) {
      routedInput.previousAssetGeneration = routedInput.previousAssetGeneration || previousAssetGeneration;
      recordSuppression(
        'assetGeneration',
        previousAssetGeneration,
        routeChanged
          ? 'asset-generation decision suppressed before recompute because route-sensitive metadata changed'
          : 'input asset-generation decision suppressed before canonical normalization',
        'recomputed'
      );
      delete routedInput.assetGeneration;
      delete routedInput.asset_generation;
    }
    if (previousAssetGeneration && routedInput.visual && String(routedInput.visual.mode || '').toLowerCase() === 'generated') {
      routedInput.previousVisualMode = routedInput.previousVisualMode || routedInput.visual.mode;
      recordRemoval(
        'visual.mode',
        routedInput.visual.mode,
        'generated visual mode removed because asset-generation decision is being recomputed'
      );
      routedInput.visual = Object.assign({}, routedInput.visual);
      delete routedInput.visual.mode;
    }
    if (previousAssetGeneration && String(routedInput.visualMode || '').toLowerCase() === 'generated') {
      routedInput.previousVisualMode = routedInput.previousVisualMode || routedInput.visualMode;
      recordRemoval(
        'visualMode',
        routedInput.visualMode,
        'generated visual mode removed because asset-generation decision is being recomputed'
      );
      delete routedInput.visualMode;
    }
    if (previousAssetGeneration && String(routedInput.assetMode || '').toLowerCase() === 'generated') {
      routedInput.previousAssetMode = routedInput.previousAssetMode || routedInput.assetMode;
      recordRemoval(
        'assetMode',
        routedInput.assetMode,
        'generated asset mode removed because asset-generation decision is being recomputed'
      );
      delete routedInput.assetMode;
    }
    if ((routeChanged || previousAssetGeneration) && routedInput.generatedAssetPrompt) {
      routedInput.previousGeneratedAssetPrompt = routedInput.previousGeneratedAssetPrompt || routedInput.generatedAssetPrompt;
      recordRemoval(
        'generatedAssetPrompt',
        routedInput.generatedAssetPrompt,
        routeChanged
          ? 'generated asset prompt removed because route-sensitive metadata changed'
          : 'generated asset prompt removed because asset-generation decision is being recomputed'
      );
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
