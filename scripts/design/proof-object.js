function createProofObjectHelpers({
  compactUnique,
  flattenText,
  highValuePageFamilies,
  layoutVariantCompatibleWithType,
  normalizeProofObject = value => String(value || '').trim().toLowerCase()
} = {}) {
  const unique = typeof compactUnique === 'function'
    ? compactUnique
    : values => Array.from(new Set((values || []).filter(Boolean)));
  const flatten = typeof flattenText === 'function'
    ? flattenText
    : value => JSON.stringify(value);
  const pageFamilies = highValuePageFamilies && typeof highValuePageFamilies.has === 'function'
    ? highValuePageFamilies
    : new Set();
  const variantCompatible = typeof layoutVariantCompatibleWithType === 'function'
    ? layoutVariantCompatibleWithType
    : () => true;

  function toArray(value) {
    if (value == null || value === '') return [];
    return Array.isArray(value) ? value : [value];
  }

  function hasOwnValue(object = {}, key) {
    return Object.prototype.hasOwnProperty.call(object, key) && object[key] != null;
  }

  function booleanValue(value) {
    if (value === true || value === false) return value;
    if (/^(true|yes|1)$/i.test(String(value))) return true;
    if (/^(false|no|0)$/i.test(String(value))) return false;
    return Boolean(value);
  }

  function proofObjectIdForSlide(s = {}) {
    const value = normalizeProofObject(
      s.proofObject ||
      s.proof_object ||
      (s.proof && s.proof.id) ||
      s.layoutVariant ||
      s.variant ||
      '',
      { slide: s, text: flatten(s), industry: s.industry || '' }
    );
    if (value && pageFamilies.has(value) && s.type && !variantCompatible(s.type, value)) {
      return normalizeProofObject(s.layoutVariant || s.variant || '', { slide: s, text: flatten(s), industry: s.industry || '' });
    }
    return value;
  }

  function slideProofObject(slide = {}) {
    const rawProof = slide.proof || {};
    if (rawProof.version === 'proof-object/v1') return rawProof;
    const proofTrace = rawProof.sourceTrace || rawProof.source_trace || {};
    const slideTrace = slide.sourceTrace || slide.source_trace || {};
    const sourceIds = unique([
      ...toArray(rawProof.sourceIds),
      ...toArray(rawProof.source_ids),
      ...toArray(proofTrace.sourceIds),
      ...toArray(proofTrace.source_ids),
      ...toArray(slideTrace.sourceIds),
      ...toArray(slideTrace.source_ids),
      ...toArray(slide.sourceIds),
      ...toArray(slide.source_ids)
    ]);
    const generation = slide.assetGeneration || {};
    const generationStatus = String(generation.status || '').toLowerCase();
    const generatedAssetText = flatten([
      slide.generatedAssetPrompt,
      generation.prompt,
      generation.provenance,
      generation.mode,
      generationStatus && generationStatus !== 'none' ? generationStatus : ''
    ]);
    const inferredGeneratedIllustration = generationStatus !== 'none' && /generated|synthetic|model|示意|生成|required/i.test(generatedAssetText);
    const generatedIllustration = hasOwnValue(rawProof, 'generatedIllustration')
      ? booleanValue(rawProof.generatedIllustration)
      : hasOwnValue(rawProof, 'generated_illustration')
      ? booleanValue(rawProof.generated_illustration)
      : inferredGeneratedIllustration;
    const factual = hasOwnValue(rawProof, 'factual')
      ? booleanValue(rawProof.factual)
      : sourceIds.length > 0;
    return {
      version: 'proof-object/v1',
      id: proofObjectIdForSlide(slide) || 'unknown',
      sourceIds,
      provenance: rawProof.provenance || (sourceIds.length ? 'source-derived-evidence' : 'unproven'),
      factual,
      generatedIllustration,
      evidenceMode: rawProof.evidenceMode || rawProof.evidence_mode || (generatedIllustration ? 'synthetic-illustration' : 'real-evidence')
    };
  }

  return {
    proofObjectIdForSlide,
    slideProofObject
  };
}

module.exports = {
  createProofObjectHelpers
};
