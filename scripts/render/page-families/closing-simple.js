const { createPageFamilyPrimitives } = require('./primitives');
const {
  createClosingSimpleEndRenderer
} = require('./closing-simple-end');
const {
  createClosingThankYouRenderer
} = require('./closing-simple-thank-you');

function createClosingSimpleRenderers(ctx = {}, deps = {}) {
  const { drawFooter } = createPageFamilyPrimitives(ctx);
  const simpleDeps = {
    ...deps,
    drawFooter
  };
  const closingSimpleEnd = createClosingSimpleEndRenderer(ctx, simpleDeps);
  const closingThankYou = createClosingThankYouRenderer(ctx, simpleDeps);

  return {
    closingSimpleEnd,
    closingThankYou
  };
}

module.exports = {
  createClosingSimpleRenderers
};
