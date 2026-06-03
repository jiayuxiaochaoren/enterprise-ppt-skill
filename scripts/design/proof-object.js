function createProofObjectHelpers({
  compactUnique,
  flattenText,
  highValuePageFamilies,
  layoutVariantCompatibleWithType
} = {}) {
  function proofObjectIdForSlide(s = {}) {
    const value = String(
      (s.proof && s.proof.id) ||
      s.proofObject ||
      s.proof_object ||
      s.layoutVariant ||
      s.variant ||
      ''
    );
    if (value && highValuePageFamilies.has(value) && s.type && !layoutVariantCompatibleWithType(s.type, value)) {
      return String(s.layoutVariant || s.variant || '');
    }
    return value;
  }

  function slideProofObject(slide = {}) {
    if (slide.proof && slide.proof.version === 'proof-object/v1') return slide.proof;
    const sourceIds = compactUnique([
      ...((slide.sourceTrace && slide.sourceTrace.sourceIds) || []),
      ...(slide.sourceIds || []),
      ...(slide.source_ids || [])
    ]);
    const generation = slide.assetGeneration || {};
    const generationStatus = String(generation.status || '').toLowerCase();
    const generatedAssetText = flattenText([
      slide.generatedAssetPrompt,
      generation.prompt,
      generation.provenance,
      generation.mode,
      generationStatus && generationStatus !== 'none' ? generationStatus : ''
    ]);
    const generatedIllustration = generationStatus !== 'none' && /generated|synthetic|model|示意|生成|required/i.test(generatedAssetText);
    return {
      version: 'proof-object/v1',
      id: proofObjectIdForSlide(slide) || 'unknown',
      sourceIds,
      provenance: sourceIds.length ? 'source-derived-evidence' : 'unproven',
      factual: sourceIds.length > 0,
      generatedIllustration,
      evidenceMode: generatedIllustration ? 'synthetic-illustration' : 'real-evidence'
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
