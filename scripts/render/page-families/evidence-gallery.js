const family = 'evidenceGallery';
const types = [
  'case-gallery',
  'gallery',
  'portfolio'
];

const {
  createEvidenceGalleryCoreRenderers
} = require('./evidence-gallery-core');

function createEvidenceGalleryRenderers(ctx = {}) {
  return createEvidenceGalleryCoreRenderers(ctx);
}
function entries(renderers = {}) {
  return [
    { types:['case-gallery', 'gallery', 'portfolio'], render:renderers.caseGallery, source:'page-family:evidence-gallery' }
  ];
}

module.exports = {
  family,
  types,
  createEvidenceGalleryRenderers,
  entries
};
