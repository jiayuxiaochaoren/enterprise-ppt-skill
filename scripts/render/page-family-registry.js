const { createRenderRegistry } = require('./registry');
const architecture = require('./page-families/architecture');
const beauty = require('./page-families/beauty');
const business = require('./page-families/business');
const chapter = require('./page-families/chapter');
const closing = require('./page-families/closing');
const cover = require('./page-families/cover');
const evidenceGallery = require('./page-families/evidence-gallery');
const financial = require('./page-families/financial');
const general = require('./page-families/general');
const manifesto = require('./page-families/manifesto');
const profile = require('./page-families/profile');
const risk = require('./page-families/risk');
const strategy = require('./page-families/strategy');
const timeline = require('./page-families/timeline');
const toc = require('./page-families/toc');

const PAGE_FAMILY_MODULES = {
  [architecture.family]: architecture.types,
  [beauty.family]: beauty.types,
  [business.family]: business.types,
  [chapter.family]: chapter.types,
  [closing.family]: closing.types,
  [cover.family]: cover.types,
  [evidenceGallery.family]: evidenceGallery.types,
  [financial.family]: financial.types,
  [general.family]: general.types,
  [manifesto.family]: manifesto.types,
  [profile.family]: profile.types,
  [risk.family]: risk.types,
  [strategy.family]: strategy.types,
  [timeline.family]: timeline.types,
  [toc.family]: toc.types
};

function createSlideRenderRegistry(renderers = {}) {
  const businessEntries = business.entries(renderers);
  return createRenderRegistry([
    ...cover.entries(renderers),
    ...closing.entries(renderers),
    ...chapter.entries(renderers),
    ...toc.entries(renderers),
    ...businessEntries.filter(entry => entry.types.includes('comparison')),
    ...profile.entries(renderers),
    ...general.entries(renderers),
    ...businessEntries.filter(entry => entry.types.includes('report-board')),
    { types:['cards', 'executive-blocks'], render:renderers.executiveBlocks },
    ...beauty.entries(renderers).filter(entry => entry.types.includes('product-showcase')),
    ...financial.entries(renderers),
    ...strategy.entries(renderers).filter(entry => entry.types.includes('strategy-map')),
    ...manifesto.entries(renderers),
    ...strategy.entries(renderers).filter(entry => entry.types.includes('module-matrix')),
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
