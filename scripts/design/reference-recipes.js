const fs = require('fs');
const path = require('path');
const { ASSET_DIR } = require('./config');

const MANIFEST_PATH = path.join(ASSET_DIR, 'reference-recipe-library.json');
const INDEX_PATH = path.join(ASSET_DIR, 'reference-recipes', 'index.json');
const RECIPE_ROOT = path.join(ASSET_DIR, 'reference-recipes');

let manifestCache = null;
let indexCache = null;
const shardCache = new Map();

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function loadManifest() {
  if (!manifestCache) {
    manifestCache = readJson(MANIFEST_PATH, {
      name: 'premium-commercial-reference-recipe-library',
      version: 'reference-recipe-library-manifest/v1',
      coverage: {},
      shards: {},
      recipes: []
    });
  }
  return manifestCache;
}

function loadIndex() {
  if (!indexCache) {
    const manifest = loadManifest();
    const fallback = manifest.recipes && manifest.recipes.length ? manifest : {
      name: manifest.name,
      version: 'reference-recipe-index/v1',
      coverage: manifest.coverage || {},
      shards: manifest.shards || {},
      recipes: []
    };
    indexCache = readJson(INDEX_PATH, fallback);
  }
  return indexCache;
}

function loadShard(keyOrFile = '') {
  const manifest = loadManifest();
  const shard = (manifest.shards || {})[keyOrFile] || { file: keyOrFile };
  const file = shard.file || '';
  if (!file) return { recipes: [] };
  if (!shardCache.has(file)) {
    shardCache.set(file, readJson(path.join(RECIPE_ROOT, file), { recipes: [] }));
  }
  return shardCache.get(file);
}

function loadAllReferenceRecipeDetails() {
  const manifest = loadManifest();
  const recipes = [];
  for (const key of Object.keys(manifest.shards || {})) {
    recipes.push(...(loadShard(key).recipes || []));
  }
  if (!recipes.length && Array.isArray(manifest.recipes)) recipes.push(...manifest.recipes);
  return recipes;
}

function loadReferenceRecipeLibrary(options = {}) {
  const manifest = loadManifest();
  if (options.details) {
    return Object.assign({}, manifest, {
      recipes: loadAllReferenceRecipeDetails()
    });
  }
  const index = loadIndex();
  return Object.assign({}, manifest, {
    version: index.version || manifest.version,
    coverage: index.coverage || manifest.coverage || {},
    recipes: index.recipes || [],
    indexPath: path.relative(path.dirname(MANIFEST_PATH), INDEX_PATH),
    shards: index.shards || manifest.shards || {}
  });
}

function createReferenceRecipeHelpers({
  compactUnique = values => Array.from(new Set((values || []).filter(Boolean))),
  contentSignals = () => ({}),
  flattenText = value => String(value || ''),
  highValuePageFamilies = new Set(),
  industryMatchIds = value => [value].filter(Boolean),
  priorityPageFamilyRecipes = [],
  referenceLayoutLibrary = {},
  referenceRecipeLibrary = {},
  slideRole = () => '',
  textKeywords = text => String(text || '').toLowerCase().split(/[^a-z0-9\u4e00-\u9fff%％+-]+/).filter(Boolean),
  themeIntentFor = () => ''
} = {}) {
  function referenceRecipeCandidates(plan = {}, s = {}, opts = {}) {
    const signals = opts.signals || contentSignals(plan, s);
    const recipes = [
      ...(referenceLayoutLibrary.recipes || []),
      ...(referenceRecipeLibrary.recipes || []),
      ...priorityPageFamilyRecipes
    ];
    if (!recipes.length) return [];
    const text = flattenText(s);
    const words = new Set(textKeywords(text));
    const industry = plan.industry || 'general-operations';
    const industryIds = new Set(industryMatchIds(industry));
    const documentType = plan.documentType ||
      (plan.materialIntelligence && plan.materialIntelligence.pptType) ||
      plan.ppt_type ||
      plan.pptType ||
      '';
    const role = slideRole(s);
    const themeIntent = s.themeIntent || (s.compositionPlan && s.compositionPlan.themeIntent) || themeIntentFor(plan, s, signals.index || 0, signals.total || 1, signals);
    const requestedVariant = String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '').trim();
    const requestedVariantIsPriority = highValuePageFamilies.has(requestedVariant);
    const explicitReferenceCategories = compactUnique([
      ...(Array.isArray(plan.referenceCategoryIds) ? plan.referenceCategoryIds : []),
      ...(Array.isArray(s.referenceCategoryIds) ? s.referenceCategoryIds : []),
      s.referenceCategoryId,
      s.categoryId
    ]);
    const scores = recipes.map(recipe => {
      let score = 0;
      const recipeFamilies = new Set([
        recipe.renderType,
        recipe.slideType,
        ...(recipe.pageFamilies || []),
        ...((recipe.designSyntax && recipe.designSyntax.suitablePageFamilies) || [])
      ].filter(Boolean));
      const exactVariantMatch = Boolean(requestedVariant && (
        recipe.layoutVariant === requestedVariant ||
        recipe.proofObject === requestedVariant ||
        (recipe.designSyntax && recipe.designSyntax.proofObject === requestedVariant)
      ));
      if (exactVariantMatch) score += requestedVariantIsPriority ? 24 : 10;
      else if (requestedVariantIsPriority) score -= 4;
      if (s.type && s.type !== 'auto') {
        if (recipeFamilies.has(s.type)) score += 3;
        else score -= exactVariantMatch ? 1 : 6;
      }
      const recipeIndustryFit = compactUnique([
        ...(recipe.industryFit || []),
        ...((recipe.designSyntax && recipe.designSyntax.industry) || []),
        ...(recipe.industry || [])
      ]);
      const recipeHasIndustryFit = recipeIndustryFit.length > 0;
      const industryMatches = recipeIndustryFit.some(id => industryIds.has(id));
      if ((recipe.roles || []).includes(role)) score += 3;
      if (industryMatches) score += 5;
      else if (recipeHasIndustryFit && highValuePageFamilies.has(recipe.layoutVariant || recipe.proofObject || '')) score -= 7;
      if (documentType && (recipe.signals || []).includes(documentType)) score += 4;
      if (documentType && recipe.taxonomy && recipe.taxonomy.documentType === documentType) score += 5;
      if (documentType && recipe.designSyntax && recipe.designSyntax.materialType === documentType) score += 5;
      if (plan.pagePurpose && (recipe.signals || []).includes(plan.pagePurpose)) score += 3;
      if (plan.visualIntent && (recipe.signals || []).includes(plan.visualIntent)) score += 2;
      if (recipe.renderType && recipe.renderType === s.type) score += 4;
      if (recipe.slideType === s.type) score += 4;
      if (recipe.layoutVariant && recipe.layoutVariant === (s.layoutVariant || s.variant)) score += 6;
      if (recipe.layoutVariant && recipe.layoutVariant === (s.proofObject || s.proof_object)) score += 5;
      if (recipe.proofObject && recipe.proofObject === (s.proofObject || s.proof_object)) score += 5;
      if (recipe.themeIntent && recipe.themeIntent === themeIntent) score += 2;
      if (recipe.source && explicitReferenceCategories.includes(recipe.source.categoryId)) score += 8;
      if (recipe.taxonomy && recipe.taxonomy.pageRole && String(text).toLowerCase().includes(String(recipe.taxonomy.pageRole).toLowerCase())) score += 2;
      (recipe.signals || []).forEach(sig => {
        const normalized = String(sig).toLowerCase();
        if (words.has(normalized) || String(text).toLowerCase().includes(normalized)) score += 2;
      });
      ((recipe.taxonomy && recipe.taxonomy.labels) || []).forEach(label => {
        const normalized = String(label).toLowerCase();
        if (normalized && String(text).toLowerCase().includes(normalized)) score += 1.4;
      });
      if (recipe.id.includes('kpi') && signals.hasMetrics) score += 5;
      if (recipe.id.includes('value-creation') && signals.hasStrategyMap) score += 5;
      if (recipe.id.includes('gallery') && signals.hasGallery) score += 5;
      if (recipe.id.includes('manifesto') && signals.hasManifesto) score += 5;
      if (recipe.id.includes('risk') && signals.hasRisk) score += 5;
      if (recipe.id.includes('architecture') && signals.hasArchitecture) score += 4;
      if (recipe.id.includes('before-after') && signals.hasComparison) score += 4;
      if (recipe.id.includes('flow') && signals.hasTimeline) score += 4;
      if (recipe.slideType === s.type) score += 4;
      if (recipe.layoutVariant && /beauty|consumer|brand-world|proof-photo|product-evidence/i.test(recipe.layoutVariant) && /美妆|美容|消费|品牌|产品|门店|会员|lookbook|retail|beauty|fashion/i.test(text)) score += 5;
      if (recipe.layoutVariant && /culture|mission|people|principle/i.test(recipe.layoutVariant) && /文化|使命|愿景|价值观|团队|招聘|people|culture|mission/i.test(text)) score += 5;
      if (recipe.layoutVariant && /materiality|governance|guidance|risk/i.test(recipe.layoutVariant) && /重要性|治理|风险|指引|合规|governance|materiality|guidance/i.test(text)) score += 5;
      if (recipe.scores && Number.isFinite(recipe.scores.overall)) score += Math.max(0, Math.min(4, (recipe.scores.overall - 66) / 5));
      return Object.assign({ score }, recipe);
    })
      .filter(recipe => recipe.score > 0)
      .sort((a,b) => b.score - a.score);
    return typeof opts.limit === 'number' ? scores.slice(0, opts.limit) : scores;
  }

  function selectReferenceRecipe(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    const scores = referenceRecipeCandidates(plan, s, { signals });
    const best = scores[0];
    if (!best) return null;
    return best;
  }

  function recipeCompatibleWithSlideType(recipe = null, type = '') {
    if (!recipe || !type) return false;
    const families = new Set([
      recipe.renderType,
      recipe.slideType,
      ...(recipe.pageFamilies || []),
      ...((recipe.designSyntax && recipe.designSyntax.suitablePageFamilies) || [])
    ].filter(Boolean));
    return families.has(type);
  }

  return {
    recipeCompatibleWithSlideType,
    referenceRecipeCandidates,
    selectReferenceRecipe
  };
}

module.exports = {
  INDEX_PATH,
  MANIFEST_PATH,
  RECIPE_ROOT,
  createReferenceRecipeHelpers,
  loadAllReferenceRecipeDetails,
  loadReferenceRecipeLibrary,
  loadReferenceRecipeIndex: loadIndex,
  loadReferenceRecipeManifest: loadManifest,
  loadReferenceRecipeShard: loadShard
};
