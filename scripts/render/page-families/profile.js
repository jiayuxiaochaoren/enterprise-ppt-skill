const family = 'profile';

const types = ['company-profile-spread', 'profile-proof', 'quote-proof'];

const {
  createProfileIndustryRenderers
} = require('./profile-industry');
const {
  createCompanyProfileSpread
} = require('./profile-company-spread');
const {
  createProfileProofRenderer
} = require('./profile-proof');
const {
  createQuoteProofRenderer
} = require('./profile-quote-proof');
const { createPageFamilyPrimitives } = require('./primitives');

function createProfileRenderers(ctx = {}) {
  const { drawDarkStageShell, drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    financeProfileProof,
    manufacturingCompanyProfileSpread
  } = createProfileIndustryRenderers(ctx);
  const companyProfileSpread = createCompanyProfileSpread(ctx, {
    drawFooter,
    drawLightPageHeader,
    manufacturingCompanyProfileSpread
  });
  const profileProof = createProfileProofRenderer(ctx, {
    drawFooter,
    drawLightPageHeader,
    financeProfileProof
  });
  const quoteProof = createQuoteProofRenderer(ctx, {
    drawDarkStageShell,
    drawFooter
  });

  return {
    companyProfileSpread,
    profileProof,
    quoteProof
  };
}

function entries(renderers = {}) {
  return [
    { types:['company-profile-spread'], render:renderers.companyProfileSpread, source:`page-family:${family}` },
    { types:['profile-proof'], render:renderers.profileProof, source:`page-family:${family}` },
    { types:['quote-proof'], render:renderers.quoteProof, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createProfileRenderers,
  entries
};
