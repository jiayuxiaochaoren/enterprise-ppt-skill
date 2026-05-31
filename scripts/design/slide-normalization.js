const CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS = new Set([
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'control-stack',
  'lookbook-story',
  'process-board',
  'product-evidence-story',
  'value-creation-process-map'
]);

function createSlideNormalizationHelpers(deps = {}) {
  const {
    applyPlanAuthoredSourceTrace,
    clampText,
    compactUnique,
    componentPlanFor,
    compositionPlan,
    contentSignals,
    flattenText,
    generatedAssetPolicy,
    generatedAssetPrompt,
    highValuePageFamilies,
    layoutVariantCompatibleWithType,
    palettes,
    pickLayoutVariant,
    recipeCompatibleWithSlideType,
    recommendSlideType,
    routeChartSpec,
    selectPaletteName,
    selectReferenceRecipe,
    slideDesign,
    slideHasChartIntent,
    visualSystem
  } = deps;

  function nativeVariantOwnsChartZone(s = {}) {
    const variant = String(s.layoutVariant || s.variant || '');
    return CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS.has(variant) && !(s.chartSpec && s.chartSpec.version === 'chartSpec/v1');
  }

  function deriveMetricsFromSlide(s = {}) {
    if (Array.isArray(s.metrics)) return s.metrics;
    const cards = Array.isArray(s.cards) ? s.cards : [];
    const fromCards = cards.map(c => {
      const text = `${c.title || ''} ${c.body || ''}`;
      const num = (text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|倍|亿元|万元|件|台)?/) || [''])[0];
      return num ? { label: c.title || '核心指标', value: num, note: c.body || '' } : null;
    }).filter(Boolean);
    if (fromCards.length) return fromCards;
    const text = flattenText(s);
    const nums = text.match(/[+-]?\d[\d,]*(?:\.\d+)?\s*(?:%|％|pt|倍|亿元|万元|件|台)?/g) || [];
    return nums.slice(0, 3).map((value, i) => ({ label: ['核心指标', '变化幅度', '目标进度'][i] || '指标', value, note: s.claim || s.subtitle || '' }));
  }

  function normalizeSlide(plan = {}, s = {}, index = 0, total = 1) {
    const typePick = recommendSlideType(plan, s, index, total);
    const routedInput = Object.assign({}, s);
    const routeSanitization = {
      version: 'route-sanitization/v1',
      mode: plan.normalizationMode || plan.normalization_mode || (plan.finalized || plan.plannerFinalized ? 'finalized' : 'compat'),
      removed: [],
      recomputed: [],
      active: []
    };
    const recordRemoval = (field, value, reason) => {
      routeSanitization.removed.push({
        field,
        reason,
        previousValueRef: `previous${field.charAt(0).toUpperCase()}${field.slice(1)}`,
        previousKind: value && typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') : typeof value
      });
    };
    if (routedInput.layoutVariant && !layoutVariantCompatibleWithType(typePick.type, routedInput.layoutVariant)) {
      recordRemoval('layoutVariant', routedInput.layoutVariant, `layoutVariant incompatible with normalized type ${typePick.type}`);
      routedInput.previousLayoutVariant = routedInput.previousLayoutVariant || routedInput.layoutVariant;
      delete routedInput.layoutVariant;
    }
    if (routedInput.variant && (!routedInput.layoutVariant || routedInput.variant !== routedInput.layoutVariant) && !layoutVariantCompatibleWithType(typePick.type, routedInput.variant)) {
      recordRemoval('variant', routedInput.variant, `variant incompatible with normalized type ${typePick.type}`);
      routedInput.previousVariant = routedInput.previousVariant || routedInput.variant;
      delete routedInput.variant;
    }
    const proofObjectVariant = String(routedInput.proofObject || routedInput.proof_object || '').trim();
    if (proofObjectVariant && highValuePageFamilies.has(proofObjectVariant) && !layoutVariantCompatibleWithType(typePick.type, proofObjectVariant)) {
      recordRemoval('proofObject', proofObjectVariant, `proofObject incompatible with normalized type ${typePick.type}`);
      routedInput.previousProofObject = routedInput.previousProofObject || proofObjectVariant;
      delete routedInput.proofObject;
      delete routedInput.proof_object;
    }
    if (!['metric-comparison', 'industry-chart', 'finance-bridge'].includes(typePick.type) && routedInput.chartSpec) {
      recordRemoval('chartSpec', routedInput.chartSpec, `chartSpec not valid for normalized type ${typePick.type}`);
      routedInput.previousChartSpec = routedInput.previousChartSpec || routedInput.chartSpec;
      delete routedInput.chartSpec;
      delete routedInput.chartSpecInferred;
    }
    if (!['metric-comparison', 'industry-chart', 'finance-bridge'].includes(typePick.type) && (routedInput.dataComponent || routedInput.data_component)) {
      recordRemoval('dataComponent', routedInput.dataComponent || routedInput.data_component, `dataComponent not valid for normalized type ${typePick.type}`);
      routedInput.previousDataComponent = routedInput.previousDataComponent || routedInput.dataComponent || routedInput.data_component;
      delete routedInput.dataComponent;
      delete routedInput.data_component;
    }
    const signals = contentSignals(plan, s, index, total);
    const recipe = selectReferenceRecipe(plan, Object.assign({}, routedInput, { type:typePick.type }), signals);
    const out = Object.assign({}, routedInput, {
      type: typePick.type,
      layoutRationale: routedInput.layoutRationale || typePick.reason,
      referenceRecipe: routedInput.referenceRecipe || (recipe ? {
        id: recipe.id,
        score: recipe.score,
        layout: recipe.layout,
        proofObject: recipe.proofObject,
        assetRole: recipe.assetRole,
        generatedAsset: recipe.generatedAsset,
        mainVisualMethod: recipe.designSyntax && recipe.designSyntax.mainVisualMethod
      } : undefined)
    });
    if (!out.layoutVariant) {
      const pickedVariant = pickLayoutVariant(plan, routedInput, out.type, signals);
      out.layoutVariant = pickedVariant || (recipe && recipe.score >= 8 && recipeCompatibleWithSlideType(recipe, out.type) ? recipe.layoutVariant : undefined);
    }
    const claimRules = (visualSystem.contentIntelligence && visualSystem.contentIntelligence.claimSpine) || {};
    if (!out.claim) {
      out.claim = clampText(flattenText([
        out.coverInsight,
        out.subtitle,
        out.intro,
        out.businessLogic && (out.businessLogic.action || out.businessLogic.impact || out.businessLogic.currentState),
        out.note,
        out.title
      ]), claimRules.introMaxChars || 68);
    }
    if (Array.isArray(out.cards)) {
      out.cards = out.cards.map(card => Object.assign({}, card, {
        body: clampText(card.body || card.text || '', claimRules.cardBodyMaxChars || 54)
      }));
    }
    if (out.type === 'metric-comparison' && !Array.isArray(out.metrics)) {
      out.metrics = deriveMetricsFromSlide(out).slice(0, 4);
    }
    const shouldPlanChartSpec = ['metric-comparison', 'industry-chart', 'finance-bridge'].includes(out.type) && !nativeVariantOwnsChartZone(out) && slideHasChartIntent(out);
    if (shouldPlanChartSpec && (!out.chartSpec || out.chartSpec.version !== 'chartSpec/v1')) {
      const chartSpec = routeChartSpec(plan, out, { index:index + 1, total });
      if (chartSpec) {
        out.chartSpec = chartSpec;
        out.chartSpecInferred = true;
      }
    }
    if (out.type === 'manifesto' && !Array.isArray(out.values) && Array.isArray(out.items)) {
      out.values = out.items.slice(0, 4).map(v => ({ title: String(v), body: '' }));
    }
    if (out.type === 'closing' && out.referenceRecipe && out.referenceRecipe.id === 'closing-editorial-statement' && !out.closingVariant) {
      const tone = (((palettes[selectPaletteName(plan)] || {}).presentation || {}).coverTone) || '';
      out.closingVariant = (tone === 'light' || tone === 'split') ? 'editorial-light' : 'decision-board';
    }
    const design = slideDesign(plan, out);
    out.compositionPlan = out.compositionPlan || compositionPlan(plan, out, index, total, contentSignals(plan, out, index, total), recipe, design);
    const plannedComponents = componentPlanFor(plan, out, index, total, contentSignals(plan, out, index, total), out.compositionPlan);
    if (routeSanitization.removed.length) {
      routeSanitization.recomputed.push({
        field: 'componentPlan',
        reason: 'component plan recomputed after route-sensitive metadata normalization'
      });
    }
    out.componentPlan = Object.assign({}, plannedComponents, out.componentPlan && out.componentPlan.version ? out.componentPlan : {}, {
      components: plannedComponents.components,
      componentIds: plannedComponents.componentIds,
      rulesApplied: plannedComponents.rulesApplied
    });
    out.compositionPlan = Object.assign({}, out.compositionPlan, {
      microComponents: compactUnique([
        ...((out.compositionPlan && out.compositionPlan.microComponents) || []),
        ...(out.componentPlan.componentIds || [])
      ])
    });
    out.themeIntent = out.themeIntent || out.compositionPlan.themeIntent;
    out.accentRole = out.accentRole || out.compositionPlan.accentRole;
    out.layoutEnergy = out.layoutEnergy || out.compositionPlan.layoutEnergy;
    out.visualDensity = out.visualDensity || out.compositionPlan.visualDensity || out.compositionPlan.density;
    out.rhythmTransition = out.rhythmTransition || out.compositionPlan.rhythmTransition;
    const assetGeneration = generatedAssetPolicy(plan, out, recipe, design);
    if (routeSanitization.removed.length && out.assetGeneration) {
      out.previousAssetGeneration = out.previousAssetGeneration || out.assetGeneration;
      routeSanitization.recomputed.push({
        field: 'assetGeneration',
        reason: 'asset-generation decision recomputed after route-sensitive metadata normalization'
      });
      out.assetGeneration = Object.assign({}, assetGeneration, {
        previousDecisionStale: true,
        staleForRoute: false
      });
    } else {
      out.assetGeneration = out.assetGeneration || assetGeneration;
    }
    if (routeSanitization.removed.length && out.generatedAssetPrompt) {
      out.previousGeneratedAssetPrompt = out.previousGeneratedAssetPrompt || out.generatedAssetPrompt;
      delete out.generatedAssetPrompt;
      routeSanitization.removed.push({
        field: 'generatedAssetPrompt',
        reason: 'generated asset prompt removed because route-sensitive metadata changed',
        previousValueRef: 'previousGeneratedAssetPrompt',
        previousKind: 'string'
      });
    }
    if (assetGeneration.status === 'required' && !(out.image || (out.visual && out.visual.image))) {
      out.generatedAssetPrompt = out.generatedAssetPrompt || generatedAssetPrompt(plan, out, recipe);
    }
    routeSanitization.active = [
      'type',
      out.layoutVariant ? 'layoutVariant' : '',
      out.proofObject || out.proof_object ? 'proofObject' : '',
      out.chartSpec ? 'chartSpec' : '',
      out.assetGeneration ? 'assetGeneration' : '',
      out.componentPlan ? 'componentPlan' : ''
    ].filter(Boolean);
    if (routeSanitization.removed.length || routeSanitization.recomputed.length) {
      out.routeSanitization = routeSanitization;
    }
    return applyPlanAuthoredSourceTrace(plan, out, index);
  }

  return {
    deriveMetricsFromSlide,
    nativeVariantOwnsChartZone,
    normalizeSlide
  };
}

module.exports = {
  CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS,
  createSlideNormalizationHelpers
};
