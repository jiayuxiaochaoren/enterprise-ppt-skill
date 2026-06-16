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
  createCoverStyleRenderer
} = require('./cover-style');
const {
  createSpecialtyCoverRenderers
} = require('./cover-specialty');
const {
  createCoverDarkRenderer
} = require('./cover-dark');
const {
  shouldUseCoverImage
} = require('./cover-image-policy');

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
    beautyBrandEditorialCover,
    clinicalQualityCover,
    cultureCoverSoftGeometry
  } = createSpecialtyCoverRenderers(ctx, { addCoverKicker, colors, coverTitleText, fileExists, shouldUseCoverImage });
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
    profile,
    shouldUseCoverImage
  });
  const coverShowcase = createCoverShowcaseRenderer(ctx, {
    addCoverKicker,
    colors,
    drawDarkStageShell,
    drawFooter,
    fileExists
  });
  const coverStyleRenderer = createCoverStyleRenderer(ctx, {
    addCoverKicker,
    colors,
    drawFooter,
    shouldUseCoverImage
  });
  const coverDark = createCoverDarkRenderer(ctx, {
    addCoverKicker,
    airyConceptOpening,
    beautyBrandEditorialCover,
    clinicalQualityCover,
    colors,
    coverFieldRendererFor,
    coverLightEditorial,
    coverShowcase,
    coverStyleRenderer,
    coverTitleText,
    cultureCoverSoftGeometry,
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
