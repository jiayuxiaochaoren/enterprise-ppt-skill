const family = 'beauty';
const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createFeatureStripRenderer
} = require('./beauty-feature-strip');
const {
  createBeautyCatalogGridRenderer
} = require('./beauty-catalog-grid');
const {
  createBeautyProductHeroRenderer
} = require('./beauty-product-hero');

const types = [
  'product-showcase'
];

function createBeautyRenderers(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    variantOf
  } = ctx;
  const renderCatalogGrid = createBeautyCatalogGridRenderer(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const renderFeatureStrip = createFeatureStripRenderer(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const renderProductHero = createBeautyProductHeroRenderer(ctx, {
    drawFooter,
    drawLightPageHeader
  });

  function productShowcase(slide, plan, s, idx) {
    const variant = variantOf(s, 'hero-object');

    if (variant === 'catalog-grid') {
      return renderCatalogGrid(slide, plan, s, idx);
    }

    if (variant === 'feature-strip') {
      return renderFeatureStrip(slide, plan, s, idx);
    }

    return renderProductHero(slide, plan, s, idx);
  }

  return {
    productShowcase
  };
}

function entries(renderers = {}) {
  return [
    { types:['product-showcase'], render:renderers.productShowcase, source:`page-family:${family}` }
  ];
}

module.exports = {
  createBeautyRenderers,
  family,
  types,
  entries
};
