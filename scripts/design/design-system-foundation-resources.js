const path = require('path');
const {
  ASSET_DIR,
  loadCopyPolicy,
  loadIndustryBenchmarks,
  loadIndustryPackLibrary,
  loadReferenceLibrary,
  loadVisualSystem
} = require('./config');
const {
  loadReferenceRecipeLibrary
} = require('./reference-recipes');
const {
  FACTUAL_GENERATED_ASSET_RISK,
  INDUSTRY_EXPRESSION_RULES,
  INDUSTRY_KNOWLEDGE_BASE,
  SEMANTIC_RELATION_PATTERNS,
  VISIBLE_PRODUCTION_COPY_BANS
} = require('./industry-knowledge');
const {
  HIGH_VALUE_PAGE_FAMILIES,
  PRIORITY_PAGE_FAMILY_RECIPES,
  layoutVariantCompatibleWithType
} = require('./page-family-routing');

function createFoundationResourceSet() {
  const VISUAL_SYSTEM = loadVisualSystem();
  const REFERENCE_LAYOUT_LIBRARY = loadReferenceLibrary();
  const REFERENCE_RECIPE_LIBRARY = loadReferenceRecipeLibrary();
  const INDUSTRY_PACK_LIBRARY = loadIndustryPackLibrary();
  const COPY_POLICY = loadCopyPolicy();
  const INDUSTRY_BENCHMARKS = loadIndustryBenchmarks();
  const PALETTES = VISUAL_SYSTEM.palettes || {};
  const VISUAL_ROUTER = VISUAL_SYSTEM.visualRouter || {};
  const INDUSTRY_DESIGN_DIALECTS = VISUAL_SYSTEM.industryDesignDialects || {};
  const FONT_STACK = Object.assign(
    { zh: 'PingFang SC', latin: 'Avenir Next', number: 'DIN Alternate' },
    VISUAL_SYSTEM.fonts || {}
  );
  const MEDIA_ASSETS = {
    energyStorageCover: path.join(ASSET_DIR, 'media', 'energy-storage-cover.jpg'),
    energyStorageDetail: path.join(ASSET_DIR, 'media', 'energy-storage-detail.jpg'),
    energyStorageBand: path.join(ASSET_DIR, 'media', 'energy-storage-band.jpg'),
    energyStorageLoop: path.join(ASSET_DIR, 'media', 'energy-storage-cover-loop.mp4')
  };

  return {
    ASSET_DIR,
    COPY_POLICY,
    FACTUAL_GENERATED_ASSET_RISK,
    FONT_STACK,
    HIGH_VALUE_PAGE_FAMILIES,
    INDUSTRY_BENCHMARKS,
    INDUSTRY_DESIGN_DIALECTS,
    INDUSTRY_EXPRESSION_RULES,
    INDUSTRY_KNOWLEDGE_BASE,
    INDUSTRY_PACK_LIBRARY,
    MEDIA_ASSETS,
    PALETTES,
    PRIORITY_PAGE_FAMILY_RECIPES,
    REFERENCE_LAYOUT_LIBRARY,
    REFERENCE_RECIPE_LIBRARY,
    SEMANTIC_RELATION_PATTERNS,
    VISIBLE_PRODUCTION_COPY_BANS,
    VISUAL_ROUTER,
    VISUAL_SYSTEM
  };
}

module.exports = {
  createFoundationResourceSet,
  FACTUAL_GENERATED_ASSET_RISK,
  HIGH_VALUE_PAGE_FAMILIES,
  INDUSTRY_EXPRESSION_RULES,
  INDUSTRY_KNOWLEDGE_BASE,
  PRIORITY_PAGE_FAMILY_RECIPES,
  SEMANTIC_RELATION_PATTERNS,
  VISIBLE_PRODUCTION_COPY_BANS,
  layoutVariantCompatibleWithType
};
