const {
  createHealthcareTouchpointEvidenceGalleryRenderer
} = require('./evidence-industry-healthcare-touchpoints');
const {
  createSaasPrototypeFlowGalleryRenderer
} = require('./evidence-industry-saas-prototype-flow');

function createEvidenceIndustryFlowGalleries(ctx = {}, deps = {}) {
  const healthcareTouchpointEvidenceGallery = createHealthcareTouchpointEvidenceGalleryRenderer(ctx, deps);
  const saasPrototypeFlowGallery = createSaasPrototypeFlowGalleryRenderer(ctx, deps);

  return {
    healthcareTouchpointEvidenceGallery,
    saasPrototypeFlowGallery
  };
}

module.exports = {
  createEvidenceIndustryFlowGalleries
};
