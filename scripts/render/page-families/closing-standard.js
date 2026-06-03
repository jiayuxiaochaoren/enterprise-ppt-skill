const {
  assertRendererContext
} = require('../renderer-context');
const {
  createClosingExecutiveRenderers
} = require('./closing-executive');
const {
  createClosingEditorialLightRenderer
} = require('./closing-editorial-light');
const {
  createClosingImageStatement
} = require('./closing-image-statement');
const {
  createClosingSimpleRenderers
} = require('./closing-simple');
const {
  createClosingDarkRenderer
} = require('./closing-dark-standard');
const {
  createClosingDecisionBoardRenderer
} = require('./closing-decision-board');

function createClosingStandardRenderers(ctx = {}, options = {}) {
  assertRendererContext(ctx, ['closing'], { label:'closing renderer context' });
  const { closingActions, closingMeta } = options;
  const closingEditorialLight = createClosingEditorialLightRenderer(ctx, {
    closingActions,
    closingMeta
  });
  const closingImageStatement = createClosingImageStatement(ctx, {
    closingActions,
    closingMeta
  });
  const simpleRenderers = createClosingSimpleRenderers(ctx, {
    closingMeta
  });
  const closingDark = createClosingDarkRenderer(ctx);
  const closingDecisionBoard = createClosingDecisionBoardRenderer(ctx, {
    closingActions,
    closingMeta
  });

  const executiveRenderers = createClosingExecutiveRenderers(ctx, {
    closingActions,
    closingMeta
  });

  return Object.assign({
    closingDark,
    closingDecisionBoard,
    closingEditorialLight,
    closingImageStatement,
    closingSimpleEnd: simpleRenderers.closingSimpleEnd,
    closingThankYou: simpleRenderers.closingThankYou
  }, executiveRenderers);
}


module.exports = {
  createClosingStandardRenderers
};
