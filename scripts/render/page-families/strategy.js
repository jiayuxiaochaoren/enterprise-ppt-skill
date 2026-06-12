const family = 'strategy';
const {
  createStrategyEvidenceRenderers
} = require('./strategy-evidence');
const {
  createModuleMatrixRenderer
} = require('./strategy-module-matrix');
const {
  createStrategyMapRenderer
} = require('./strategy-value-map');
const { createPageFamilyPrimitives } = require('./primitives');

const types = [
  'strategy-map',
  'module-matrix'
];

function createStrategyRenderers(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const evidenceRenderers = createStrategyEvidenceRenderers(ctx);
  const {
    brandWorldBusinessProof,
    singleObjectConceptMapSlide,
    valueCreationProcessMapSlide
  } = evidenceRenderers;
  const moduleMatrix = createModuleMatrixRenderer(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const strategyMap = createStrategyMapRenderer(ctx, {
    brandWorldBusinessProof,
    drawFooter,
    drawLightPageHeader,
    singleObjectConceptMapSlide,
    valueCreationProcessMapSlide
  });

  return {
    ...evidenceRenderers,
    moduleMatrix,
    strategyMap
  };
}

function entries(renderers = {}) {
  return [
    { types:['strategy-map'], render:renderers.strategyMap, source:`page-family:${family}` },
    { types:['module-matrix'], render:renderers.moduleMatrix, source:`page-family:${family}` }
  ];
}

module.exports = {
  createStrategyRenderers,
  createStrategyEvidenceRenderers,
  family,
  types,
  entries
};
