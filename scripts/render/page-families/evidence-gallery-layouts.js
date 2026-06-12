const { createEvidenceBrandStoryRenderers } = require('./evidence-brand-stories');
const { createEvidenceIndustryRenderers } = require('./evidence-industry');
const { createEvidenceProofBoardRenderers } = require('./evidence-proof-boards');
const { createEvidenceGalleryStandardRenderers } = require('./evidence-gallery-standard');
const { assertRendererContext } = require('../renderer-context');

function createEvidenceGalleryLayoutRenderers(ctx = {}) {
  assertRendererContext(ctx, ['evidenceGallery'], {
    label: 'evidence gallery renderer context'
  });

  const brandStory = createEvidenceBrandStoryRenderers(ctx);
  const industry = createEvidenceIndustryRenderers(ctx);
  const proofBoard = createEvidenceProofBoardRenderers(ctx);
  const externalRenderers = Object.assign(
    {
      brandWorldBusinessProof: ctx.brandWorldBusinessProof
    },
    brandStory,
    industry,
    proofBoard
  );
  const standard = createEvidenceGalleryStandardRenderers(ctx, externalRenderers);

  return Object.assign({}, standard, proofBoard, industry, brandStory);
}

module.exports = {
  createEvidenceGalleryLayoutRenderers
};
