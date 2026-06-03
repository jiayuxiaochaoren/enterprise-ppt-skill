const {
  evidenceGalleryRendererKey
} = require('./evidence-gallery-routing');
const {
  createCaseFeaturedGallery
} = require('./evidence-gallery-case-featured');
const {
  createCaseTriptychGallery
} = require('./evidence-gallery-case-triptych');

function createCaseGalleryRenderer(ctx = {}, deps = {}) {
  const {
    galleryImages
  } = ctx;
  const {
    drawLightPageHeader,
    variantRenderers
  } = deps;
  const { renderCaseFeaturedGallery } = createCaseFeaturedGallery(ctx, deps);
  const { renderCaseTriptychGallery } = createCaseTriptychGallery(ctx, deps);

  return function caseGallery(slide, plan, s, idx) {
    const variant = ctx.variantOf(s, 'triptych-gallery');
    const rendererKey = evidenceGalleryRendererKey(variant, plan);
    if (rendererKey) {
      const renderer = variantRenderers[rendererKey];
      if (typeof renderer !== 'function') throw new Error(`missing evidence gallery renderer: ${rendererKey}`);
      return renderer(slide, plan, s, idx);
    }
    drawLightPageHeader(slide, {
      kicker:'CASE EVIDENCE',
      title:s.title || '案例与素材证据',
      titleSize:23.5,
      subtitle:s.subtitle || s.intro,
      subtitleW:5.9,
      subtitleSize:9.0,
      idx
    });

    const images = galleryImages(plan, s);
    const items = s.items || s.cards || [];
    if (images.length >= 3 && items.length <= 4) {
      renderCaseTriptychGallery(slide, plan, s, images, items);
      return;
    }
    renderCaseFeaturedGallery(slide, plan, s, images, items);
  };
}

module.exports = {
  createCaseGalleryRenderer
};
