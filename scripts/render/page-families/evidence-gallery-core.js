const {
  createEvidenceGalleryLayoutRenderers
} = require('./evidence-gallery-layouts');
const {
  assertRendererContext
} = require('../renderer-context');

function createEvidenceGalleryCoreRenderers(ctx = {}) {
  assertRendererContext(ctx, ['evidenceGallery'], { label:'evidence gallery renderer context' });
  return createEvidenceGalleryLayoutRenderers(ctx);
}

module.exports = {
  createEvidenceGalleryCoreRenderers
};
