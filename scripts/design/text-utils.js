const TEXT_METADATA_OMIT_KEYS = new Set([
  'previousComponentPlan',
  'previousComponentHints',
  'previousComponentSuggestions',
  'previousCompositionPlan',
  'previousAssetGeneration',
  'previousVisualMode',
  'previousAssetMode',
  'previousIndustryEvidenceChain',
  'previousGeneratedAssetPrompt',
  'proofObjectInferred',
  'proofObjectSource',
  'industryEvidenceChainConflict',
  'routeSanitization',
  'normalizationAudit',
  'generatedAssetPrompt',
  'assetGeneration',
  'compositionPlan',
  'componentPlan'
]);

const TEXT_FLATTEN_OMIT_KEYS = new Set([
  'image',
  'images',
  'visual',
  'media',
  'referenceRecipe',
  'previousLayoutVariant',
  'previousVariant',
  'previousProofObject',
  'previousChartSpec',
  ...TEXT_METADATA_OMIT_KEYS,
  'semanticIntent',
  'semanticConfidence',
  'semanticPurpose',
  'semanticRelations',
  'semanticScores',
  'industryEntities',
  'candidateProofObjects',
  'narrativeRole',
  'proofObject',
  'proof',
  'layoutPlan',
  'sourceTrace',
  'sourceIds',
  'source_ids',
  'evidenceIds',
  'evidence_ids',
  'sources',
  'materialIntelligence'
]);

function compactUnique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    return Object.keys(value)
      .filter(key => !TEXT_FLATTEN_OMIT_KEYS.has(key))
      .map(key => flattenText(value[key]))
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function keywordHit(text, names = []) {
  const lower = String(text || '').toLowerCase();
  return names.some(keyword => lower.includes(String(keyword).toLowerCase()));
}

function matchKeywordList(text, names = []) {
  const lower = String(text || '').toLowerCase();
  return names
    .filter(keyword => lower.includes(String(keyword).toLowerCase()))
    .map(String);
}

function textKeywords(text) {
  return String(text || '').toLowerCase().split(/[^a-z0-9\u4e00-\u9fff%％+-]+/).filter(Boolean);
}

function clampText(text, maxChars) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!maxChars || value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}

module.exports = {
  TEXT_METADATA_OMIT_KEYS,
  TEXT_FLATTEN_OMIT_KEYS,
  clampText,
  compactUnique,
  flattenText,
  keywordHit,
  matchKeywordList,
  textKeywords
};
