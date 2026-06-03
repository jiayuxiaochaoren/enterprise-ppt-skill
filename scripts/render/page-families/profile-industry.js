const { createPageFamilyPrimitives } = require('./primitives');
const {
  createFinanceProfileProof
} = require('./profile-finance-proof');
const {
  createManufacturingCompanyProfileSpread
} = require('./profile-manufacturing-spread');

function createProfileIndustryRenderers(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const financeProfileProof = createFinanceProfileProof(ctx);
  const manufacturingCompanyProfileSpread = createManufacturingCompanyProfileSpread(ctx, {
    drawFooter,
    drawLightPageHeader
  });

  return {
    financeProfileProof,
    manufacturingCompanyProfileSpread
  };
}

module.exports = {
  createProfileIndustryRenderers
};
