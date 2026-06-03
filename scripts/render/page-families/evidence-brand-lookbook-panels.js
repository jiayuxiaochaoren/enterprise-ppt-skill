const {
  lookbookStoryItems
} = require('./evidence-brand-lookbook-data');
const {
  createRetailLookbookLogicPanel
} = require('./evidence-brand-lookbook-logic');
const {
  createRetailLookbookScenePanels
} = require('./evidence-brand-lookbook-scenes');

function createRetailLookbookPanels(ctx = {}) {
  const {
    galleryImages
  } = ctx;
  const {
    drawMerchandisingLogic
  } = createRetailLookbookLogicPanel(ctx);
  const {
    drawPrimaryScene,
    drawSupportingScenes
  } = createRetailLookbookScenePanels(ctx);

  function drawLookbookStory(slide, plan, s) {
    const images = galleryImages(plan, s);
    const storyItems = lookbookStoryItems(s);
    drawPrimaryScene(slide, images, storyItems);
    drawSupportingScenes(slide, images, storyItems);
    drawMerchandisingLogic(slide, s);
  }

  return {
    drawLookbookStory
  };
}

module.exports = {
  createRetailLookbookPanels
};
