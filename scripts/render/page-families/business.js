const family = 'business';

const { createPageFamilyPrimitives } = require('./primitives');
const {
  createValueTilesRenderer
} = require('./business-value-tiles');
const {
  createReportBoardRenderer,
  reportBoardItems
} = require('./business-report-board');
const {
  createBusinessCoreLayoutRenderers
} = require('./business-core-layouts');

const types = [
  'cards',
  'executive-blocks',
  'comparison',
  'report-board',
  'value-tiles'
];

function createBusinessRenderers(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    comparisonSlide,
    executiveBlocks
  } = createBusinessCoreLayoutRenderers(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const valueTiles = createValueTilesRenderer(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const reportBoard = createReportBoardRenderer(ctx);

  return {
    comparisonSlide,
    executiveBlocks,
    reportBoard,
    valueTiles
  };
}

function entries(renderers = {}) {
  return [
    { types:['cards', 'executive-blocks'], render:renderers.executiveBlocks, source:`page-family:${family}` },
    { types:['comparison'], render:renderers.comparisonSlide, source:`page-family:${family}` },
    { types:['report-board'], render:renderers.reportBoard, source:`page-family:${family}` },
    { types:['value-tiles'], render:renderers.valueTiles, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createBusinessRenderers,
  entries,
  reportBoardItems
};
