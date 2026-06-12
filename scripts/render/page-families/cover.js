const family = 'cover';

const types = [
  'cover',
  'cover-dark'
];

const {
  createCoverCoreRenderers
} = require('./cover-core');

function createCoverRenderers(ctx = {}) {
  return createCoverCoreRenderers(ctx);
}
function entries(renderers = {}) {
  return [
    { types:['cover', 'cover-dark'], render:renderers.coverDark, source:`page-family:${family}` }
  ];
}

module.exports = {
  createCoverRenderers,
  family,
  types,
  entries
};
