const {
  imageProvenanceCanSatisfyFactualProof,
  imageProvenanceIsSyntheticOnly,
  sourceTraceForSlide
} = require('../../design/source-evidence');

function hasTrustedCoverImageEvidence(slide = {}) {
  const generation = slide.assetGeneration || slide.asset_generation || {};
  if (generation.syntheticOnly === true) return false;

  const trace = sourceTraceForSlide(slide);
  const provenance = Array.isArray(trace.imageProvenance) ? trace.imageProvenance : [];
  if (!provenance.length) return generation.syntheticOnly !== true;

  if (provenance.some(imageProvenanceCanSatisfyFactualProof)) return true;
  return provenance.some(item => !imageProvenanceIsSyntheticOnly(item));
}

function shouldUseCoverImage(slide = {}, design = {}, opts = {}) {
  if (!design || !design.imagePath) return false;
  if (!opts || !opts.requireTrustedEvidence) return true;
  return hasTrustedCoverImageEvidence(slide);
}

module.exports = {
  hasTrustedCoverImageEvidence,
  shouldUseCoverImage
};
