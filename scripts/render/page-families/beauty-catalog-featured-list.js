const { createCatalogFeaturedLead } = require('./beauty-catalog-featured-lead');
const { createCatalogFeaturedRows } = require('./beauty-catalog-featured-rows');
const { createCatalogNote } = require('./beauty-catalog-note');

function createCatalogFeaturedList(ctx = {}) {
  const { drawFeaturedLead } = createCatalogFeaturedLead(ctx);
  const { drawFeaturedRows } = createCatalogFeaturedRows(ctx);
  const { drawCatalogNote } = createCatalogNote(ctx);

  function renderFeaturedProductList(slide, s, productList, design) {
    const lead = productList[0];
    drawFeaturedLead(slide, lead, design);
    drawFeaturedRows(slide, productList);
    drawCatalogNote(slide, s);
  }

  return {
    renderFeaturedProductList
  };
}

module.exports = {
  createCatalogFeaturedList
};
