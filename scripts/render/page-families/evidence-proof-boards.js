const { createConsumerProofPhotoGridRenderer } = require('./evidence-proof-consumer-grid');
const { createProductEvidenceStoryRenderer } = require('./evidence-proof-product-story');
const { createExecutiveProofBoardRenderer } = require('./evidence-proof-executive-board');

function createEvidenceProofBoardRenderers(ctx = {}) {
  const consumerProofPhotoGrid = createConsumerProofPhotoGridRenderer(ctx);
  const executiveProofBoard = createExecutiveProofBoardRenderer(ctx);
  const productEvidenceStory = createProductEvidenceStoryRenderer(ctx);

  return {
    consumerProofPhotoGrid,
    executiveProofBoard,
    productEvidenceStory
  };
}

module.exports = {
  createEvidenceProofBoardRenderers
};
