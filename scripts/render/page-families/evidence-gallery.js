const family = 'evidenceGallery';

const types = [
  'case-gallery',
  'gallery',
  'portfolio'
];

function entries(renderers = {}) {
  return [
    { types:['case-gallery', 'gallery', 'portfolio'], render:renderers.caseGallery, source:'page-family:evidence-gallery' }
  ];
}

module.exports = {
  family,
  types,
  entries
};
