const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createAiryConceptOpening
} = require('./cover-airy-concept');
const {
  createBeautyBrandEditorialCover
} = require('./cover-beauty-editorial');
const {
  createCultureCoverSoftGeometry
} = require('./manifesto-culture-cover');

function createSpecialtyCoverRenderers(ctx = {}, helpers = {}) {
  const colors = helpers.colors || (() => ctx.colors());
  const fileExists = helpers.fileExists || (file => typeof ctx.fileExists === 'function' ? ctx.fileExists(file) : false);
  const {
    drawDarkStageShell,
    drawFooter,
    drawLightCanvasShell
  } = createPageFamilyPrimitives(Object.assign({}, ctx, { colors }));
  const specialtyDeps = {
    colors,
    coverTitleText: helpers.coverTitleText || (value => String(value || '').replace(/\s*\n\s*/g, ' ')),
    drawFooter,
    drawLightCanvasShell,
    fileExists
  };
  const airyConceptOpening = createAiryConceptOpening(ctx, specialtyDeps);
  const beautyBrandEditorialCover = createBeautyBrandEditorialCover(ctx, specialtyDeps);
  const cultureCoverSoftGeometry = createCultureCoverSoftGeometry(ctx, {
    drawDarkStageShell,
    drawFooter
  });

  return {
    airyConceptOpening,
    beautyBrandEditorialCover,
    cultureCoverSoftGeometry
  };
}

module.exports = {
  createSpecialtyCoverRenderers
};
