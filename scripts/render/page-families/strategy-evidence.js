const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createBrandWorldBusinessProofRenderer
} = require('./strategy-brand-world-proof');
const {
  createSingleObjectConceptMapRenderer
} = require('./strategy-single-object-concept');
const {
  createValueCreationProcessMapRenderer
} = require('./strategy-value-creation-process');

function createStrategyEvidenceRenderers(ctx = {}) {
  const primitives = createPageFamilyPrimitives(ctx);
  const brandWorldBusinessProof = createBrandWorldBusinessProofRenderer(ctx);
  const singleObjectConceptMapSlide = createSingleObjectConceptMapRenderer(ctx, primitives);
  const valueCreationProcessMapSlide = createValueCreationProcessMapRenderer(ctx, primitives);

  return {
    brandWorldBusinessProof,
    singleObjectConceptMapSlide,
    valueCreationProcessMapSlide
  };
}

module.exports = {
  createStrategyEvidenceRenderers
};
