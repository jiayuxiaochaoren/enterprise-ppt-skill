const {
  normalizeLayoutVariant,
  normalizeProofObject,
  renderFamilyForProof
} = require('./proof-taxonomy');

function createRouteProofNormalizer({
  contentSignals,
  flattenText,
  highValuePageFamilies,
  industryPackFor,
  layoutVariantCompatibleWithType,
  pickLayoutVariant,
  recipeCompatibleWithSlideType,
  semanticFrame
} = {}) {
  function highValueFamilyHas(value) {
    if (!value) return false;
    if (highValuePageFamilies && typeof highValuePageFamilies.has === 'function') return highValuePageFamilies.has(value);
    return Array.isArray(highValuePageFamilies) && highValuePageFamilies.includes(value);
  }

  function inferProofObject(plan = {}, out = {}, index = 0, total = 1) {
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

  function chooseLayoutVariant(plan = {}, out = {}, routedInput = {}, recipe = null, signals = {}) {
    if (out.layoutVariant) return;
    const pickedVariant = pickLayoutVariant(plan, routedInput, out.type, signals);
    out.layoutVariant = pickedVariant !== undefined
      ? pickedVariant
      : (recipe && recipe.score >= 8 && recipeCompatibleWithSlideType(recipe, out.type) ? recipe.layoutVariant : undefined);
  }

  function normalizeVariant(plan = {}, out = {}, signals = {}, routeSanitization = {}) {
    const rawVariant = out.layoutVariant != null && String(out.layoutVariant).trim() !== ''
      ? out.layoutVariant
      : (out.variant || '');
    const recomputed = routeSanitization.recomputed || [];
    const normalizedVariant = normalizeLayoutVariant(rawVariant, {
      plan,
      industry: plan.industry || '',
      industryPackFor,
      text: flattenText(out),
      proofIntent: out.proofIntent || out.proof_intent,
      displayCopy: out.displayCopy || out.display_copy,
      slide: out,
      signals,
      routeAudit: recomputed
    });
    if (
      rawVariant !== '' &&
      normalizedVariant !== rawVariant &&
      (normalizedVariant === '' || layoutVariantCompatibleWithType(out.type, normalizedVariant))
    ) {
      out.previousLayoutVariant = out.previousLayoutVariant || out.layoutVariant || rawVariant;
      out.previousVariant = out.previousVariant || out.variant || rawVariant;
      out.layoutVariant = normalizedVariant;
      out.variant = normalizedVariant;
      recomputed.push({
        field: 'layoutVariant',
        reason: `layout variant normalized to ${normalizedVariant || '[empty]'}`
      });
    } else if (
      out.layoutVariant != null &&
      out.variant == null &&
      !['case-gallery', 'gallery', 'portfolio'].includes(out.type)
    ) {
      out.variant = out.layoutVariant;
    }
  }

  function normalizeProof(plan = {}, out = {}, signals = {}, routeSanitization = {}, index = 0, total = 1) {
    if (!out.proofObject && !out.proof_object) inferProofObject(plan, out, index, total);
    const recomputed = routeSanitization.recomputed || [];
    const rawProofObject = out.proofObject || out.proof_object || out.layoutVariant || out.variant || '';
    const normalizedProofObject = normalizeProofObject(rawProofObject, {
      industry: plan.industry || '',
      text: flattenText(out),
      proofIntent: out.proofIntent || out.proof_intent,
      displayCopy: out.displayCopy || out.display_copy,
      slide: out,
      signals,
      routeAudit: recomputed
    });
    if (!normalizedProofObject) return;
    out.proofObjectNormalized = normalizedProofObject;
    out.proof_object_normalized = normalizedProofObject;
    out.proofObjectRecommendedFamily = renderFamilyForProof(normalizedProofObject) || '';
    out.proof_object_recommended_family = out.proofObjectRecommendedFamily;
    const recommendedVariant = out.proofObjectRecommendedFamily.startsWith(`${out.type}:`)
      ? out.proofObjectRecommendedFamily.split(':').slice(1).join(':')
      : '';
    if (
      recommendedVariant &&
      recommendedVariant !== out.layoutVariant &&
      layoutVariantCompatibleWithType(out.type, recommendedVariant)
    ) {
      out.previousLayoutVariant = out.previousLayoutVariant || out.layoutVariant;
      out.previousVariant = out.previousVariant || out.variant;
      out.layoutVariant = recommendedVariant;
      out.variant = recommendedVariant;
      recomputed.push({
        field: 'layoutVariant',
        reason: `layout variant aligned to normalized proof object ${recommendedVariant}`
      });
    }
    if (normalizedProofObject !== rawProofObject) {
      out.previousProofObject = out.previousProofObject || rawProofObject;
      out.proofObject = normalizedProofObject;
      recomputed.push({
        field: 'proofObject',
        reason: `proof object normalized to ${normalizedProofObject}`
      });
    } else if (!out.proofObject && out.proof_object) {
      out.proofObject = normalizedProofObject;
    }
  }

  function assignRenderFamily(out = {}) {
    const renderFamilyFromProof = out.proofObjectRecommendedFamily &&
      out.proofObjectRecommendedFamily.startsWith(`${out.type}:`)
      ? out.proofObjectRecommendedFamily
      : '';
    out.renderFamilySelected = renderFamilyFromProof ||
      (out.layoutVariant || out.variant ? `${out.type}:${out.layoutVariant || out.variant}` : out.type);
    out.render_family_selected = out.renderFamilySelected;
  }

  function applyRouteProofNormalization({ plan = {}, out = {}, routedInput = {}, recipe = null, signals = {}, routeSanitization = {}, index = 0, total = 1 } = {}) {
    chooseLayoutVariant(plan, out, routedInput, recipe, signals);
    normalizeVariant(plan, out, signals, routeSanitization);
    normalizeProof(plan, out, signals, routeSanitization, index, total);
    assignRenderFamily(out);
    return out;
  }

  return {
    applyRouteProofNormalization
  };
}

module.exports = {
  createRouteProofNormalizer
};
