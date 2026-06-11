const {
  assertRendererContext
} = require('../renderer-context');
const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createCoverFieldRenderers
} = require('./cover-fields');
const {
  createCoverCopyHelpers
} = require('./cover-copy');
const {
  createCoverLightEditorialRenderer
} = require('./cover-light-editorial');
const {
  createCoverShowcaseRenderer
} = require('./cover-showcase');
const {
  createSpecialtyCoverRenderers
} = require('./cover-specialty');
const {
  createCoverDarkRenderer
} = require('./cover-dark');

function createCoverCoreRenderers(ctx = {}) {
  assertRendererContext(ctx, ['cover'], { label:'cover renderer context' });
  const {
    drawDarkStageShell,
    drawFooter
  } = createPageFamilyPrimitives(ctx);
  const colors = () => ctx.colors();
  const canvasWidth = () => typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const canvasHeight = () => typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const profile = () => typeof ctx.profile === 'function' ? ctx.profile() : {};
  const fileExists = file => typeof ctx.fileExists === 'function' ? ctx.fileExists(file) : false;
  const {
    addCoverKicker,
    coverTitleText,
    splitEnergyTitle
  } = createCoverCopyHelpers(ctx);
  const {
    airyConceptOpening,
    beautyBrandEditorialCover
  } = createSpecialtyCoverRenderers(ctx, { colors, coverTitleText, fileExists });
  const {
    coverFieldRendererFor
  } = createCoverFieldRenderers(ctx, { colors });
  const coverLightEditorial = createCoverLightEditorialRenderer(ctx, {
    addCoverKicker,
    canvasHeight,
    canvasWidth,
    colors,
    drawFooter,
    fileExists,
    profile
  });
  const coverShowcase = createCoverShowcaseRenderer(ctx, {
    addCoverKicker,
    colors,
    drawDarkStageShell,
    drawFooter,
    fileExists
  });
  const coverDark = createCoverDarkRenderer(ctx, {
    addCoverKicker,
    airyConceptOpening,
    beautyBrandEditorialCover,
    colors,
    coverFieldRendererFor,
    coverLightEditorial,
    coverShowcase,
    coverTitleText,
    fileExists,
    splitEnergyTitle
  });

  return {
    coverDark
  };
}


module.exports = {
  createCoverCoreRenderers
};
