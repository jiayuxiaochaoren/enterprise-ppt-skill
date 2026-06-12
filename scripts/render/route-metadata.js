const crypto = require('crypto');

const ROUTE_SENSITIVE_RENDER_FIELDS = [
  'type',
  'layoutVariant',
  'variant',
  'proofObject',
  'proof_object',
  'chartSpec',
  'dataComponent',
  'data_component',
  'componentPlan',
  'assetGeneration',
  'generatedAssetPrompt'
];

function stableStringify(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function shortHash(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex').slice(0, 16);
}

function compactDiffValue(value) {
  if (value == null) return value;
  if (typeof value !== 'object') return value;
  const text = stableStringify(value);
  return text.length > 240 ? `${text.slice(0, 237)}...` : text;
}

function normalizationModeFor(plan = {}) {
  return plan.normalizationMode || plan.normalization_mode ||
    (plan.finalized || plan.plannerFinalized ? 'finalized' : 'compat');
}

function routeSensitiveDiffs(inputPlan = {}, normalizedPlan = {}) {
  const inputSlides = Array.isArray(inputPlan.slides) ? inputPlan.slides : [];
  const normalizedSlides = Array.isArray(normalizedPlan.slides) ? normalizedPlan.slides : [];
  return normalizedSlides.map((slide, i) => {
    const input = inputSlides[i] || {};
    const changes = [];
    ROUTE_SENSITIVE_RENDER_FIELDS.forEach(field => {
      const before = input[field];
      const after = slide[field];
      if (stableStringify(before) !== stableStringify(after)) {
        changes.push({
          field,
          before: compactDiffValue(before),
          after: compactDiffValue(after)
        });
      }
    });
    return {
      slide: i + 1,
      changed: changes.length > 0,
      changes
    };
  }).filter(item => item.changed);
}

function isStrictRenderMode(plan = {}) {
  const mode = String(plan.qualityMode || plan.quality_mode || plan.normalizationMode || plan.normalization_mode || '').toLowerCase();
  return plan.strictRendering === true || ['formal', 'delivery', 'strict', 'finalized'].includes(mode);
}

function qualityModeForPlan(plan = {}) {
  const mode = String(plan.qualityMode || plan.quality_mode || plan.outputIntent || '').trim().toLowerCase().replace(/_/g, '-');
  if (mode === 'formal-review') return 'formal';
  if (['draft', 'formal', 'delivery'].includes(mode)) return mode;
  if (plan.formalMaterialGeneration === true || plan.strictRendering === true) return 'formal';
  return 'draft';
}

function compactRenderMatch(match = {}) {
  return {
    requestedType: match.requestedType || '',
    matchedType: match.matchedType || '',
    matchKind: match.matchKind || '',
    rendererId: match.rendererId || '',
    rendererName: match.rendererName || '',
    source: match.source || '',
    alias: match.alias || undefined
  };
}

module.exports = {
  ROUTE_SENSITIVE_RENDER_FIELDS,
  compactDiffValue,
  compactRenderMatch,
  isStrictRenderMode,
  normalizationModeFor,
  qualityModeForPlan,
  routeSensitiveDiffs,
  shortHash,
  stableStringify
};
