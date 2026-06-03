const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createAiryConceptOpening
} = require('./cover-airy-concept');
const {
  createBeautyBrandEditorialCover
} = require('./cover-beauty-editorial');

function createSpecialtyCoverRenderers(ctx = {}, helpers = {}) {
  const colors = helpers.colors || (() => ctx.colors());
  const fileExists = helpers.fileExists || (file => typeof ctx.fileExists === 'function' ? ctx.fileExists(file) : false);
  const {
    drawFooter,
    drawLightCanvasShell
  } = createPageFamilyPrimitives(Object.assign({}, ctx, { colors }));
  const specialtyDeps = {
    colors,
    drawFooter,
    drawLightCanvasShell,
    fileExists
  };
  const airyConceptOpening = createAiryConceptOpening(ctx, specialtyDeps);
  const beautyBrandEditorialCover = createBeautyBrandEditorialCover(ctx, specialtyDeps);

  return {
    airyConceptOpening,
    beautyBrandEditorialCover
  };
}

module.exports = {
  createSpecialtyCoverRenderers
};
