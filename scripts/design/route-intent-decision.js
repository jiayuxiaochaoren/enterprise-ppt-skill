const ROUTE_INTENT_DECISION_VERSION = 'route-intent-decision/v1';

const SEMANTIC_LOCKED_ROUTE_TYPES = new Set([
  'agenda',
  'chapter-divider',
  'closing',
  'risk-table',
  'timeline',
  'timeline-dark',
  'toc',
  'toc-clean'
]);

const CHART_ROUTE_TYPES = new Set(['metric-comparison', 'industry-chart', 'finance-bridge', 'portfolio-table']);

function routePriorityFor(reason = '', type = '') {
  const text = String(reason || '').toLowerCase();
  if (/explicit|first slide|closing signal|last slide/.test(text)) return 'user-explicit-route';
  if (CHART_ROUTE_TYPES.has(type) && /chart|metrics?|number-heavy|oee|portfolio|bridge|funnel|waterfall|trend/.test(text)) return 'chart-data-contract';
  if (/depth-domain|industry proof object|industry evidence|chain/.test(text)) return 'industry-evidence-chain';
  if (/proof object|product|lookbook|profile proof|quote/.test(text)) return 'proofObject';
  if (/reference recipe/.test(text)) return 'referenceRecipe';
  return 'visual-rhythm';
}

function recipeRewriteCandidate(recipe = null) {
  if (!recipe) return '';
  return [
    recipe.renderType,
    recipe.slideType,
    recipe.id,
    recipe.proofObject,
    recipe.assetRole,
    recipe.generatedAsset,
    recipe.layoutVariant,
    recipe.themeIntent,
    recipe.designSyntax && recipe.designSyntax.mainVisualMethod
  ].filter(Boolean).join(' ');
}

function routeIntentDecisionFor({ typePick = {}, recipe = null } = {}) {
  const type = typePick.type || '';
  const reason = typePick.reason || '';
  const semanticLock = SEMANTIC_LOCKED_ROUTE_TYPES.has(type);
  const priority = routePriorityFor(reason, type);
  const candidateText = recipeRewriteCandidate(recipe);
  const candidateRoute = recipe && (recipe.renderType || recipe.slideType) || '';
  const rejectedRewrites = [];
  if (
    semanticLock &&
    candidateRoute &&
    candidateRoute !== type &&
    /proof|cover|editorial|scene|gallery|image|photo|chart|visual/i.test(candidateText)
  ) {
    rejectedRewrites.push({
      source: 'referenceRecipe',
      candidateType: candidateRoute,
      reason: 'semantic locked route keeps process/risk/toc/chapter/closing intent ahead of recipe visual wording'
    });
  }
  return {
    version: ROUTE_INTENT_DECISION_VERSION,
    type,
    reason,
    sourcePriority: priority,
    locked: typePick.locked === true || semanticLock,
    semanticLock,
    rejectedRewrites
  };
}

module.exports = {
  ROUTE_INTENT_DECISION_VERSION,
  SEMANTIC_LOCKED_ROUTE_TYPES,
  routeIntentDecisionFor,
  routePriorityFor
};
