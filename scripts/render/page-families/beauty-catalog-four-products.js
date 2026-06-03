const {
  createFourProductCatalogPanels
} = require('./beauty-catalog-four-product-panels');

function createFourProductCatalogRenderer(ctx = {}, deps = {}) {
  const {
    chooseFourImageLayout,
    fileExists,
    imagePathFromItem
  } = ctx;
  const { drawFooter } = deps;
  const {
    renderFeaturedProductList,
    renderProductGrid
  } = createFourProductCatalogPanels(ctx);

  return function renderFourProductCatalog(slide, plan, s, productList = [], design = {}) {
    const imagePaths = productList.map(it => imagePathFromItem(it)).filter(p => p && fileExists(p));
    const catalogLayout = chooseFourImageLayout(imagePaths, {
      role:'product',
      layout:s.catalogLayout || s.imageLayout,
      featured: !!(productList[0] && (productList[0].featured || productList[0].hero))
    });
    if (imagePaths.length >= 3 && catalogLayout === 'grid-2x2') {
      renderProductGrid(slide, s, productList);
      drawFooter(slide, plan);
      return;
    }
    renderFeaturedProductList(slide, s, productList, design);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createFourProductCatalogRenderer
};
