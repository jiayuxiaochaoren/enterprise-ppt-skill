const {
  createRetailLookbookStory
} = require('./evidence-brand-lookbook');
const {
  createBrandStoryChrome
} = require('./evidence-brand-story-chrome');
const {
  createPeopleProofMosaic
} = require('./evidence-brand-people-mosaic');
const {
  createSustainabilityProofSpread
} = require('./evidence-brand-sustainability');

function createEvidenceBrandStoryRenderers(ctx = {}) {
  const {
    drawBrandStoryHeader,
    drawFooter
  } = createBrandStoryChrome(ctx);
  const sustainabilityProofSpread = createSustainabilityProofSpread(ctx, {
    drawBrandStoryHeader,
    drawFooter
  });
  const retailLookbookStory = createRetailLookbookStory(ctx, {
    drawBrandStoryHeader,
    drawFooter
  });
  const peopleProofMosaic = createPeopleProofMosaic(ctx, {
    drawBrandStoryHeader,
    drawFooter
  });

  return {
    peopleProofMosaic,
    retailLookbookStory,
    sustainabilityProofSpread
  };
}

module.exports = {
  createEvidenceBrandStoryRenderers
};
