const { createCatalogFeaturedList } = require('./beauty-catalog-featured-list');
const { createCatalogProductGrid } = require('./beauty-catalog-product-grid');

function createFourProductCatalogPanels(ctx = {}) {
  const { renderFeaturedProductList } = createCatalogFeaturedList(ctx);
  const { renderProductGrid } = createCatalogProductGrid(ctx);
  return {
    renderFeaturedProductList,
    renderProductGrid
  };
}

module.exports = {
  createFourProductCatalogPanels
};
