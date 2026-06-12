function finitePositiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function requestedSlideCountFrom(extraction = {}, options = {}) {
  const doc = extraction.document || {};
  return finitePositiveNumber(
    options.targetSlides ||
    options.requestedSlideCount ||
    doc.targetSlides ||
    doc.target_slides ||
    doc.requestedSlideCount ||
    doc.requested_slide_count ||
    extraction.targetSlides ||
    extraction.target_slides ||
    extraction.requestedSlideCount ||
    extraction.requested_slide_count
  );
}

function materialDensityProfile(extraction = {}, bundle = {}) {
  const claims = Array.isArray(extraction.claim_spine) ? extraction.claim_spine : [];
  const evidence = Array.isArray(extraction.evidence) ? extraction.evidence : [];
  const facts = Array.isArray(extraction.facts) ? extraction.facts : [];
  const imageCount = Array.isArray(bundle.images) ? bundle.images.length : 0;
  const numberCount = ((bundle.textSummary && bundle.textSummary.numbers) || []).length;
  const sourceCount = Array.isArray(bundle.sources) ? bundle.sources.length : 0;
  const textChars = Number((bundle.textSummary && bundle.textSummary.charCount) || 0);
  const score =
    claims.length * 1.9 +
    evidence.length * 1.3 +
    facts.length * 0.8 +
    imageCount * 1.4 +
    Math.min(12, numberCount) * 0.45 +
    Math.min(8, sourceCount) * 0.6 +
    Math.min(12, Math.floor(textChars / 900)) * 0.45;
  const density = score >= 34 ? 'high' : (score >= 18 ? 'medium' : 'low');
  return {
    version: 'material-density/v1',
    density,
    score: Number(score.toFixed(1)),
    claimCount: claims.length,
    evidenceCount: evidence.length,
    factCount: facts.length,
    imageCount,
    numberCount,
    sourceCount,
    textChars
  };
}

function targetSlideContract(extraction = {}, bundle = {}, options = {}, context = {}) {
  const requested = requestedSlideCountFrom(extraction, options);
  const density = materialDensityProfile(extraction, bundle);
  const claimCount = Number(context.claimCount || ((extraction.claim_spine || []).length));
  const baseSlides = Number(context.baseSlides || 3);
  const minSlides = Math.max(baseSlides + 1, context.companyIntro ? 5 : 4);
  const availableSlides = Math.max(baseSlides, baseSlides + claimCount);
  const maxByDensity = density.density === 'high' ? 20 : (density.density === 'medium' ? 12 : 8);
  const recommended = Math.max(minSlides, Math.min(maxByDensity, availableSlides));
  const legacyMaxBody = finitePositiveNumber(options.maxSlides);
  const resolved = requested
    ? Math.max(minSlides, Math.min(20, Math.round(requested)))
    : (legacyMaxBody ? Math.min(maxByDensity, baseSlides + legacyMaxBody) : recommended);
  const bodyLimit = Math.max(0, resolved - baseSlides);
  const enoughMaterial = claimCount >= bodyLimit;
  return {
    version: 'target-slides/v1',
    requested: requested || null,
    resolved,
    targetSlides: resolved,
    baseSlides,
    bodyLimit,
    availableSlides,
    density,
    enoughMaterial,
    policy: enoughMaterial
      ? 'respect-requested-count'
      : 'do-not-hard-fill-without-evidence',
    adjustmentReason: enoughMaterial
      ? ''
      : `only ${claimCount} claim slides are available for ${bodyLimit} requested body slots`
  };
}

module.exports = {
  materialDensityProfile,
  requestedSlideCountFrom,
  targetSlideContract
};
