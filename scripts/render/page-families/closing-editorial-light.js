const {
  createClosingEditorialActionsRenderer
} = require('./closing-editorial-light-actions');
const {
  createClosingEditorialChromeRenderer
} = require('./closing-editorial-light-chrome');
const {
  createClosingEditorialCopyRenderer
} = require('./closing-editorial-light-copy');
const {
  createClosingEditorialMetaRenderer
} = require('./closing-editorial-light-meta');
const { createPageFamilyPrimitives } = require('./primitives');

function createClosingEditorialLightRenderer(ctx = {}, helpers = {}) {
  const {
    closingActions,
    closingMeta
  } = helpers;
  const { drawFooter } = createPageFamilyPrimitives(ctx);
  const { drawClosingEditorialActions } = createClosingEditorialActionsRenderer(ctx);
  const { drawClosingEditorialChrome } = createClosingEditorialChromeRenderer(ctx);
  const { drawClosingEditorialCopy } = createClosingEditorialCopyRenderer(ctx);
  const { drawClosingEditorialMeta } = createClosingEditorialMetaRenderer(ctx);

  return function closingEditorialLight(slide, plan, s, idx) {
    drawClosingEditorialChrome(slide, idx);
    drawClosingEditorialCopy(slide, plan, s);

    const actions = closingActions(s);
    drawClosingEditorialActions(slide, actions);
    drawClosingEditorialMeta(slide, plan, s, closingMeta);
    drawFooter(slide, plan, { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, fit:'shrink' });
  };
}

module.exports = {
  createClosingEditorialLightRenderer
};
