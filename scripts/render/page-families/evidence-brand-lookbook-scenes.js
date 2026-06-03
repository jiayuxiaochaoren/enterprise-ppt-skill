const {
  createRetailLookbookPrimaryScene
} = require('./evidence-brand-lookbook-primary-scene');
const {
  createRetailLookbookSupportingScenes
} = require('./evidence-brand-lookbook-supporting-scenes');

function createRetailLookbookScenePanels(ctx = {}) {
  const {
    drawPrimaryScene
  } = createRetailLookbookPrimaryScene(ctx);
  const {
    drawSupportingScenes
  } = createRetailLookbookSupportingScenes(ctx);

  return {
    drawPrimaryScene,
    drawSupportingScenes
  };
}

module.exports = {
  createRetailLookbookScenePanels
};
