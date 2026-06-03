const {
  productItems
} = require('./beauty-product-data');
const {
  createBeautyCatalogGridCardsRenderer
} = require('./beauty-catalog-grid-cards');
const {
  createFourProductCatalogRenderer
} = require('./beauty-catalog-four-products');
const {
  catalogGridLayout
} = require('./beauty-catalog-grid-layout');

function createBeautyCatalogGridRenderer(ctx = {}, chrome = {}) {
  const C = ctx.colors();
  const {
    addText,
    designForSlide
  } = ctx;
  const { drawFooter, drawLightPageHeader } = chrome;
  const { drawCatalogGridCards } = createBeautyCatalogGridCardsRenderer(ctx);
  const renderFourProductCatalog = createFourProductCatalogRenderer(ctx, {
    drawFooter
  });

  return function renderCatalogGrid(slide, plan, s, idx, options = {}) {
    const items = options.items || productItems(s);
    const design = options.design || (designForSlide ? designForSlide(plan, s, 'product') : {});

    drawLightPageHeader(slide, {
      kicker:'PRODUCT LINEUP',
      title:s.title || '产品组合展示',
      subtitle:s.subtitle || s.claim,
      subtitleW:6.4,
      idx
    });
    const productList = items.slice(0,8);
    if (productList.length === 4) {
      renderFourProductCatalog(slide, plan, s, productList, design);
      return;
    }
    drawCatalogGridCards(slide, productList, catalogGridLayout(productList));
    addText(slide, s.note || '产品对象、应用场景和证据说明保持在同一张产品谱系页。', { x:0.92, y:6.62, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createBeautyCatalogGridRenderer
};
