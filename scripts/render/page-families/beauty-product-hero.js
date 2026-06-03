const {
  productItems
} = require('./beauty-product-data');
const {
  createBeautyProductHeroBreakdown
} = require('./beauty-product-hero-breakdown');
const {
  createBeautyProductHeroPositioning
} = require('./beauty-product-hero-positioning');
const {
  createBeautyProductHeroVisual
} = require('./beauty-product-hero-visual');

function createBeautyProductHeroRenderer(ctx = {}, deps = {}) {
  const {
    designForSlide,
    itemBody,
    itemTitle,
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;
  const { drawProductHeroBreakdown } = createBeautyProductHeroBreakdown(ctx);
  const { drawProductHeroPositioning } = createBeautyProductHeroPositioning(ctx);
  const { drawProductHeroVisual } = createBeautyProductHeroVisual(ctx);

  return function renderProductHero(slide, plan, s, idx) {
    const items = productItems(s);
    const product = s.product || items[0] || {};
    const design = designForSlide(plan, s, 'product');

    drawLightPageHeader(slide, {
      kicker:'PRODUCT HERO',
      title:s.title || itemTitle(product, '核心产品展示'),
      titleW:5.6,
      titleH:0.36,
      subtitle:s.subtitle || s.claim || itemBody(product),
      subtitleW:6.2,
      subtitleH:0.22,
      idx,
      pageNumber:'chrome'
    });

    const hero = { x:0.92, y:2.00, w:6.18, h:3.78 };
    drawProductHeroVisual(slide, s, design, hero);

    const side = { x:7.62, y:2.00, w:3.78, h:3.78 };
    drawProductHeroPositioning(slide, s, product, side);

    drawProductHeroBreakdown(slide, s, items);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createBeautyProductHeroRenderer
};
