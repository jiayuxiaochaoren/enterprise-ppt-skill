const {
  createRiskBoardLayoutRenderers
} = require('./risk-board-layouts');
const {
  assertRendererContext
} = require('../renderer-context');

function createRiskBoardRenderers(ctx = {}) {
  assertRendererContext(ctx, ['risk'], { label:'risk renderer context' });
  return createRiskBoardLayoutRenderers(ctx);
}

module.exports = {
  createRiskBoardRenderers
};
