const CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS = new Set([
  'brand-world-and-business-proof',
  'consumer-proof-photo-grid',
  'control-stack',
  'lookbook-story',
  'process-board',
  'product-evidence-story',
  'value-creation-process-map'
]);
const {
  CHART_ROUTE_TYPES,
  createRouteSanitizationHelpers
} = require('./slide-route-sanitization');
const {
  ASSET_GENERATION_DECISION_SOURCE
} = require('./asset-generation');

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
    semanticFrame,
    slideDesign,
    slideHasChartIntent,
    visualSystem
  } = deps;
  const {
    sanitizeRouteInput
  } = createRouteSanitizationHelpers({
    highValuePageFamilies,
    layoutVariantCompatibleWithType
  });

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

  function currentAssetGenerationDecision(decision = {}) {
    return Object.assign({
      decisionSource: ASSET_GENERATION_DECISION_SOURCE
    }, decision || {});
  }

  function normalizeSlide(plan = {}, s = {}, index = 0, total = 1) {
    const typePick = recommendSlideType(plan, s, index, total);
    const {
      previousAssetGeneration,
      previousComponentPlan,
      previousCompositionPlan,
      routedInput,
      routeChanged,
      routeSanitization
    } = sanitizeRouteInput(plan, s, typePick);
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
    if (!out.proofObject && !out.proof_object) {
      const highValueFamilyHas = value => {
        if (!value) return false;
        if (highValuePageFamilies && typeof highValuePageFamilies.has === 'function') return highValuePageFamilies.has(value);
        return Array.isArray(highValuePageFamilies) && highValuePageFamilies.includes(value);
      };
      const variantProofObject = out.layoutVariant &&
        highValueFamilyHas(out.layoutVariant) &&
        layoutVariantCompatibleWithType(out.type, out.layoutVariant)
        ? out.layoutVariant
        : '';
      const semantic = typeof semanticFrame === 'function'
        ? (semanticFrame(plan, out, contentSignals(plan, out, index, total)) || {})
        : {};
      if (variantProofObject) {
        out.proofObject = variantProofObject;
        out.proofObjectSource = out.proofObjectSource || 'layout-variant';
      } else if (semantic.proofObject) {
        out.proofObject = semantic.proofObject;
        out.proofObjectInferred = true;
        out.proofObjectSource = out.proofObjectSource || 'semantic-frame';
      }
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
    const shouldPlanChartSpec = CHART_ROUTE_TYPES.has(out.type) && !nativeVariantOwnsChartZone(out) && slideHasChartIntent(out);
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
    const previousInputComponentPlan = previousComponentPlan || out.previousComponentPlan || null;
    const previousInputCompositionPlan = previousCompositionPlan || out.previousCompositionPlan || null;
    const previousInputAssetGeneration = previousAssetGeneration || out.previousAssetGeneration || null;
    const previousIndustryEvidenceChain = previousInputComponentPlan && previousInputComponentPlan.industryEvidenceChain
      ? previousInputComponentPlan.industryEvidenceChain
      : null;
    const normalizedSignals = contentSignals(plan, out, index, total);

    out.compositionPlan = compositionPlan(plan, out, index, total, normalizedSignals, recipe, design);
    if (previousInputCompositionPlan) {
      routeSanitization.recomputed.push({
        field: 'compositionPlan',
        reason: 'composition plan recomputed after executable metadata normalization'
      });
    }
    const plannedComponents = componentPlanFor(plan, out, index, total, normalizedSignals, out.compositionPlan);
    if (routeChanged || previousInputComponentPlan) {
      routeSanitization.recomputed.push({
        field: 'componentPlan',
        reason: 'component plan recomputed after executable metadata normalization'
      });
    }
    if (previousInputComponentPlan) out.previousComponentPlan = out.previousComponentPlan || previousInputComponentPlan;
    if (previousInputCompositionPlan) out.previousCompositionPlan = out.previousCompositionPlan || previousInputCompositionPlan;
    if (previousIndustryEvidenceChain) {
      out.previousIndustryEvidenceChain = out.previousIndustryEvidenceChain || previousIndustryEvidenceChain;
      const currentChain = plannedComponents.industryEvidenceChain || {};
      if (
        String(previousIndustryEvidenceChain.chainId || '') !== String(currentChain.chainId || '') ||
        String(previousIndustryEvidenceChain.stageId || '') !== String(currentChain.stageId || '')
      ) {
        out.industryEvidenceChainConflict = out.industryEvidenceChainConflict || {
          previousChainId: previousIndustryEvidenceChain.chainId || '',
          previousStageId: previousIndustryEvidenceChain.stageId || '',
          currentChainId: currentChain.chainId || '',
          currentStageId: currentChain.stageId || '',
          resolution: 'canonical chain recomputed from current slide fields'
        };
      }
    }
    out.componentPlan = Object.assign({}, plannedComponents, {
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
    const assetGeneration = currentAssetGenerationDecision(generatedAssetPolicy(plan, out, recipe, design));
    if (routeChanged || previousInputAssetGeneration) {
      if (previousInputAssetGeneration) out.previousAssetGeneration = out.previousAssetGeneration || previousInputAssetGeneration;
      routeSanitization.recomputed.push({
        field: 'assetGeneration',
        reason: 'asset-generation decision recomputed after executable metadata normalization'
      });
      out.assetGeneration = Object.assign({}, assetGeneration, {
        previousDecisionStale: Boolean(previousInputAssetGeneration),
        staleForRoute: false
      });
    } else {
      out.assetGeneration = out.assetGeneration || assetGeneration;
    }
    if (assetGeneration.status === 'required' && !(out.image || (out.visual && out.visual.image))) {
      out.generatedAssetPrompt = out.generatedAssetPrompt || generatedAssetPrompt(plan, out, recipe);
    }
    routeSanitization.after = {
      type: out.type || '',
      layoutVariant: out.layoutVariant || '',
      variant: out.variant || '',
      proofObject: out.proofObject || out.proof_object || ''
    };
    routeSanitization.active = [
      'type',
      out.layoutVariant ? 'layoutVariant' : '',
      out.proofObject || out.proof_object ? 'proofObject' : '',
      out.chartSpec ? 'chartSpec' : '',
      out.assetGeneration ? 'assetGeneration' : '',
      out.componentPlan ? 'componentPlan' : ''
    ].filter(Boolean);
    if (routeSanitization.removed.length || routeSanitization.suppressed.length || routeSanitization.recomputed.length) {
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
