const fs = require('fs');
const path = require('path');

const ASSET_DIR = path.resolve(__dirname, '..', '..', 'assets');

function readJson(relativePath, fallback) {
  const file = path.join(ASSET_DIR, relativePath);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function loadVisualSystem() {
  return readJson('visual-system.json', {
    fonts: { zh: 'PingFang SC', latin: 'Avenir Next', number: 'DIN Alternate' },
    palettes: {},
    visualRouter: {},
    mediaDefaults: {},
    motifs: {}
  });
}

function loadReferenceLibrary() {
  return readJson('reference-layout-library.json', { recipes: [], generatedAssetPromptPatterns: {} });
}

function loadIndustryPackLibrary() {
  return readJson('industry-packs.json', { packs: [] });
}

function loadCopyPolicy() {
  return readJson('copy-policy.json', { version: 'copy-policy/v1', global: { rendererFallbacks: {} }, industries: {} });
}

function loadIndustryBenchmarks() {
  return readJson('industry-benchmarks.json', { version: 'industry-benchmarks/v1', industries: {}, aliases: {} });
}

module.exports = {
  ASSET_DIR,
  loadVisualSystem,
  loadReferenceLibrary,
  loadIndustryPackLibrary,
  loadCopyPolicy,
  loadIndustryBenchmarks,
  readJson
};
