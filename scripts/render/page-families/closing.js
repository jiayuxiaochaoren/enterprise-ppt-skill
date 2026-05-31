const family = 'closing';
const types = [
  'closing',
  'closing-dark'
];

const {
  createClosingCoreRenderers
} = require('./closing-core');

function createClosingRenderers(ctx = {}) {
  return createClosingCoreRenderers(ctx);
}
function entries(renderers = {}) {
  return [
    { types:['closing', 'closing-dark'], render:renderers.closingAdaptive, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createClosingRenderers,
  entries
};
