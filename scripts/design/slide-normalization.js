const {
  CHART_ROUTE_TYPES,
  createRouteSanitizationHelpers
} = require('./slide-route-sanitization');
const {
  CHART_SPEC_SUPPRESSED_NATIVE_VARIANTS,
  createSlideNormalizationUtilityHelpers
} = require('./slide-normalization-utils');
const {
  routeIntentDecisionFor
} = require('./route-intent-decision');
const {
  createRouteProofNormalizer
} = require('./slide-normalization-route-proof');

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
    industryPackFor,
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
  const {
    channelEfficiencyVariantNeedsDowngrade,
    currentAssetGenerationDecision,
    deriveMetricsFromSlide,
    nativeVariantOwnsChartZone
  } = createSlideNormalizationUtilityHelpers({ flattenText });
  const {
    applyRouteProofNormalization
  } = createRouteProofNormalizer({
    contentSignals,
    flattenText,
    highValuePageFamilies,
    industryPackFor,
    layoutVariantCompatibleWithType,
    pickLayoutVariant,
    recipeCompatibleWithSlideType,
    semanticFrame
  });

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
      routeLocked: routedInput.routeLocked === true || routedInput.route_lock === true || typePick.locked === true,
      layoutRationale: routedInput.layoutRationale || typePick.reason,
      routeIntentDecision: routeIntentDecisionFor({ typePick, recipe }),
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
    applyRouteProofNormalization({ plan, out, routedInput, recipe, signals, routeSanitization, index, total });
    if (out.type === 'industry-chart' && channelEfficiencyVariantNeedsDowngrade(out)) {
      out.previousLayoutVariant = out.previousLayoutVariant || out.layoutVariant;
      out.previousVariant = out.previousVariant || out.variant;
      out.layoutVariant = 'fact-metrics';
      out.variant = 'fact-metrics';
      routeSanitization.recomputed.push({
        field: 'layoutVariant',
        reason: 'channel-efficiency-matrix requires channel/media/provenance fields; metric-board evidence downgraded to fact-metrics'
      });
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
    if (design.coverStyle) {
      out.coverStyle = out.coverStyle || design.coverStyle;
      out.coverStyleSource = out.coverStyleSource || design.coverStyleSource || '';
      out.contentTheme = out.contentTheme || design.contentTheme || null;
      out.compositionPlan = Object.assign({}, out.compositionPlan, {
        coverStyle: design.coverStyle,
        coverStyleSource: design.coverStyleSource || '',
        contentTheme: design.contentTheme || null
      });
    }
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
    const assetGeneration = Object.assign(
      {},
      currentAssetGenerationDecision(generatedAssetPolicy(plan, out, recipe, design)),
      design.coverStyle ? { coverStyle: design.coverStyle } : {}
    );
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
    const effectiveAssetGeneration = out.assetGeneration || assetGeneration || {};
    const effectiveAssetStatus = String(effectiveAssetGeneration.status || '').toLowerCase();
    const effectiveAssetAction = String(
      effectiveAssetGeneration.action ||
      effectiveAssetGeneration.decision ||
      effectiveAssetGeneration.assetDecisionAction ||
      effectiveAssetGeneration.asset_decision_action ||
      ''
    ).toLowerCase();
    const effectiveAssetMode = String(effectiveAssetGeneration.mode || '').toLowerCase();
    const effectiveAssetReason = String(effectiveAssetGeneration.reason || '').toLowerCase();
    const assetExplicitlySkipped = effectiveAssetAction === 'skip_image' ||
      effectiveAssetMode === 'structure-only' ||
      /skip|structure-only|native structure|结构页|跳过/.test(effectiveAssetReason);
    if (assetExplicitlySkipped || effectiveAssetStatus === 'none') {
      delete out.generatedAssetPrompt;
    }
    const hasBoundImage = Boolean(out.coverImage || out.coverImagePath || out.cover_image || out.cover_image_path ||
      out.image || (out.visual && out.visual.image));
    if (effectiveAssetStatus === 'required' && !assetExplicitlySkipped && !hasBoundImage) {
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
