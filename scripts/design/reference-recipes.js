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

module.exports = {
  INDEX_PATH,
  MANIFEST_PATH,
  RECIPE_ROOT,
  loadAllReferenceRecipeDetails,
  loadReferenceRecipeLibrary,
  loadReferenceRecipeIndex: loadIndex,
  loadReferenceRecipeManifest: loadManifest,
  loadReferenceRecipeShard: loadShard
};
