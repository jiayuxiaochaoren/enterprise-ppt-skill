const { createRenderRegistry } = require('./registry');
const architecture = require('./page-families/architecture');
const beauty = require('./page-families/beauty');
const business = require('./page-families/business');
const chapter = require('./page-families/chapter');
const closing = require('./page-families/closing');
const evidenceGallery = require('./page-families/evidence-gallery');
const financial = require('./page-families/financial');
const risk = require('./page-families/risk');
const timeline = require('./page-families/timeline');
const toc = require('./page-families/toc');

const PAGE_FAMILY_MODULES = {
  [architecture.family]: architecture.types,
  [beauty.family]: beauty.types,
  [business.family]: business.types,
  [chapter.family]: chapter.types,
  [closing.family]: closing.types,
  [evidenceGallery.family]: evidenceGallery.types,
  [financial.family]: financial.types,
  [risk.family]: risk.types,
  [timeline.family]: timeline.types,
  [toc.family]: toc.types
};

function createSlideRenderRegistry(renderers = {}) {
  const businessEntries = business.entries(renderers);
  return createRenderRegistry([
    ...beauty.entries(renderers).filter(entry => entry.types.includes('cover')),
    ...closing.entries(renderers),
    ...chapter.entries(renderers),
    ...toc.entries(renderers),
    ...businessEntries.filter(entry => entry.types.includes('comparison')),
    { types:['company-profile-spread'], render:renderers.companyProfileSpread },
    { types:['profile-proof'], render:renderers.profileProof },
    { types:['quote-proof'], render:renderers.quoteProof },
    { types:['two-column', 'two-column-clean'], render:renderers.twoColumnClean },
    ...businessEntries.filter(entry => entry.types.includes('report-board')),
    { types:['cards', 'executive-blocks'], render:renderers.executiveBlocks },
    ...beauty.entries(renderers).filter(entry => entry.types.includes('product-showcase')),
    ...financial.entries(renderers),
    { types:['strategy-map'], render:renderers.strategyMap },
    { types:['manifesto'], render:renderers.manifestoSlide },
    { types:['module-matrix'], render:renderers.moduleMatrix },
    ...architecture.entries(renderers),
    ...timeline.entries(renderers),
    ...businessEntries.filter(entry => entry.types.includes('value-tiles')),
    ...evidenceGallery.entries(renderers),
    ...risk.entries(renderers),
    { fallback:true, render:renderers.fallbackBulletsSlide }
  ]);
}

module.exports = {
  PAGE_FAMILY_MODULES,
  createSlideRenderRegistry
};
