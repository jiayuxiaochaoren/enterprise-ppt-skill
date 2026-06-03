const {
  createPrimitiveChrome
} = require('./primitive-chrome');
const {
  createPrimitiveHeaders
} = require('./primitive-headers');
const {
  createPrimitiveContent
} = require('./primitive-content');

function createPageFamilyPrimitives(ctx = {}) {
  const C = ctx.colors();
  const {
    drawChromePageNumber,
    drawFooter,
    drawLightCanvasShell,
    drawNumberPageNumber,
    drawRiskBoardFooter,
    drawTextPageNumber
  } = createPrimitiveChrome(ctx, C);
  const {
    drawDarkPageHeader,
    drawDarkStageShell,
    drawLightPageHeader
  } = createPrimitiveHeaders(ctx, C, {
    drawChromePageNumber,
    drawNumberPageNumber,
    drawTextPageNumber
  });
  const {
    drawCaptionStack,
    drawEvidenceBoard,
    drawEvidencePanel,
    drawImagePanel,
    drawMetricCard,
    drawMetricRow
  } = createPrimitiveContent(ctx, C);

  return {
    drawCaptionStack,
    drawChromePageNumber,
    drawDarkPageHeader,
    drawDarkStageShell,
    drawEvidencePanel,
    drawEvidenceBoard,
    drawFooter,
    drawImagePanel,
    drawLightCanvasShell,
    drawLightPageHeader,
    drawMetricCard,
    drawMetricRow,
    drawNumberPageNumber,
    drawRiskBoardFooter,
    drawTextPageNumber
  };
}

module.exports = {
  createPageFamilyPrimitives
};
