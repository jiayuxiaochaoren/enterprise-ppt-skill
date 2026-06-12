const {
  createDefaultStrategyValueMapRenderer
} = require('./strategy-value-map-default');

function createStrategyMapRenderer(ctx = {}, deps = {}) {
  const {
    variantOf
  } = ctx;
  const {
    brandWorldBusinessProof,
    singleObjectConceptMapSlide,
    valueCreationProcessMapSlide
  } = deps;
  const { drawDefaultStrategyValueMap } = createDefaultStrategyValueMapRenderer(ctx, {
    drawFooter:deps.drawFooter,
    drawLightPageHeader:deps.drawLightPageHeader
  });

  return function strategyMap(slide, plan, s, idx) {
    const strategyVariant = variantOf(s, '');
    if (strategyVariant === 'value-creation-process-map') return valueCreationProcessMapSlide(slide, plan, s, idx);
    if (strategyVariant === 'single-object-concept-map') return singleObjectConceptMapSlide(slide, plan, s, idx);
    if (strategyVariant === 'brand-world-and-business-proof') return brandWorldBusinessProof(slide, plan, s, idx);
    return drawDefaultStrategyValueMap(slide, plan, s, idx);
  };
}

module.exports = {
  createStrategyMapRenderer
};
