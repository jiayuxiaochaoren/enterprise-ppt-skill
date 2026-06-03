const {
  createPrimitiveStageShell
} = require('./primitive-stage-shell');
const {
  createLightPageHeader
} = require('./primitive-light-header');
const {
  createDarkPageHeader
} = require('./primitive-dark-header');

function createPrimitiveHeaders(ctx = {}, C = ctx.colors(), chrome = {}) {
  const {
    drawDarkStageShell
  } = createPrimitiveStageShell(ctx, C, chrome);
  const drawLightPageHeader = createLightPageHeader(ctx, C, chrome);
  const drawDarkPageHeader = createDarkPageHeader(ctx, C, chrome);

  return {
    drawDarkPageHeader,
    drawDarkStageShell,
    drawLightPageHeader
  };
}

module.exports = {
  createPrimitiveHeaders
};
