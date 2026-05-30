const family = 'beauty';

const types = [
  'cover',
  'cover-dark',
  'product-showcase'
];

function entries(renderers = {}) {
  return [
    { types:['cover', 'cover-dark'], render:renderers.coverDark, source:`page-family:${family}` },
    { types:['product-showcase'], render:renderers.productShowcase, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  entries
};
