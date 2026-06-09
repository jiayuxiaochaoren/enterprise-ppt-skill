function compactUnique(values = []) {
  const list = Array.isArray(values) ? values : [];
  return [...new Set(list.filter(value => value != null && String(value).trim() !== '').map(value => String(value)))];
}

function normalizeMinHits(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function normalizeStageCoveragePolicy(stageOrPolicy = {}) {
  const raw = stageOrPolicy.coveragePolicy || stageOrPolicy.coverage_policy || stageOrPolicy.coverage || stageOrPolicy;
  const legacyComponents = compactUnique(stageOrPolicy.components || raw.components || []);
  const requiredAll = compactUnique(raw.requiredAll || raw.required_all || []);
  const requiredWhenVisible = compactUnique(raw.requiredWhenVisible || raw.required_when_visible || []);
  const explicitRequiredAny = raw.requiredAny || raw.required_any;
  const requiredAny = compactUnique(explicitRequiredAny != null ? explicitRequiredAny : (requiredAll.length ? [] : legacyComponents));
  const optional = compactUnique(raw.optional || raw.optionalComponents || raw.optional_components || []);
  const components = compactUnique([
    ...requiredAll,
    ...requiredWhenVisible,
    ...requiredAny,
    ...optional,
    ...legacyComponents
  ]);
  const defaultMinHits = requiredAny.length ? 1 : (requiredAll.length ? requiredAll.length : 0);
  return {
    version: 'chain-coverage-policy/v1',
    requiredAll,
    requiredWhenVisible,
    requiredAny,
    optional,
    minHits: normalizeMinHits(raw.minHits != null ? raw.minHits : raw.min_hits, defaultMinHits),
    legacyComponents,
    components
  };
}

function activateCoveragePolicyConditions(policy = {}, opts = {}) {
  const requiredWhenVisible = compactUnique(policy.requiredWhenVisible || policy.required_when_visible || []);
  const activeVisibleRequirements = opts.visibleSources ? requiredWhenVisible : [];
  const requiredAll = compactUnique([
    ...(policy.requiredAll || []),
    ...activeVisibleRequirements
  ]);
  const requiredAny = compactUnique(policy.requiredAny || []);
  const optional = compactUnique(policy.optional || []);
  const components = compactUnique([
    ...requiredAll,
    ...requiredAny,
    ...optional,
    ...requiredWhenVisible,
    ...(policy.components || [])
  ]);
  return Object.assign({}, policy, {
    requiredAll,
    requiredWhenVisible,
    requiredAny,
    optional,
    components,
    conditionalRequirements: {
      visibleSources: requiredWhenVisible
    },
    activeConditionalRequirements: {
      visibleSources: activeVisibleRequirements
    },
    inactiveConditionalRequirements: {
      visibleSources: opts.visibleSources ? [] : requiredWhenVisible
    }
  });
}

function filterStageCoveragePolicy(policy = {}, predicate = () => true) {
  const requiredAll = compactUnique(policy.requiredAll || []).filter(predicate);
  const requiredWhenVisible = compactUnique(policy.requiredWhenVisible || []).filter(predicate);
  const requiredAny = compactUnique(policy.requiredAny || []).filter(predicate);
  const optional = compactUnique(policy.optional || []).filter(predicate);
  const components = compactUnique([...requiredAll, ...requiredWhenVisible, ...requiredAny, ...optional]);
  const minHits = Math.min(normalizeMinHits(policy.minHits, requiredAny.length ? 1 : requiredAll.length), components.length);
  const activeConditionalRequirements = policy.activeConditionalRequirements || {};
  return Object.assign({}, policy, {
    requiredAll,
    requiredWhenVisible,
    requiredAny,
    optional,
    minHits,
    components,
    activeConditionalRequirements: Object.assign({}, activeConditionalRequirements, {
      visibleSources: compactUnique(activeConditionalRequirements.visibleSources || []).filter(predicate)
    })
  });
}

function coverageRoleForComponent(policy = {}, id = '') {
  const componentId = String(id || '');
  if ((policy.requiredAll || []).includes(componentId)) return 'requiredAll';
  if ((policy.requiredWhenVisible || []).includes(componentId)) return 'requiredWhenVisible';
  if ((policy.requiredAny || []).includes(componentId)) return 'requiredAny';
  if ((policy.optional || []).includes(componentId)) return 'optional';
  return 'unclassified';
}

function coverageStatusForComponents(policy = {}, presentComponents = []) {
  const present = new Set(compactUnique(presentComponents));
  const requiredAllMissing = compactUnique(policy.requiredAll || []).filter(id => !present.has(id));
  const requiredAny = compactUnique(policy.requiredAny || []);
  const requiredAnyHits = requiredAny.filter(id => present.has(id));
  const optionalMissing = compactUnique(policy.optional || []).filter(id => !present.has(id));
  const optionalHits = compactUnique(policy.optional || []).filter(id => present.has(id));
  const expectedHits = compactUnique(policy.components || []).filter(id => present.has(id));
  const minHits = normalizeMinHits(policy.minHits, requiredAny.length ? 1 : compactUnique(policy.requiredAll || []).length);
  const minimumHitsMissing = Math.max(0, minHits - expectedHits.length);
  const expectedTotal = compactUnique(policy.components || []).length;
  const coverageScore = expectedTotal ? expectedHits.length / expectedTotal : 1;
  return {
    version: 'chain-coverage-status/v1',
    status: requiredAllMissing.length || (requiredAny.length && !requiredAnyHits.length) || minimumHitsMissing ? 'fail' : 'pass',
    coverageScore,
    expectedTotal,
    expectedHits,
    hitCount: expectedHits.length,
    minHits,
    minimumHitsMissing,
    optionalHits,
    optionalHitCount: optionalHits.length,
    optionalMissing,
    optionalMissingCount: optionalMissing.length,
    requiredAllMissing,
    requiredAnyHits,
    requiredAnyMissing: requiredAny.length && !requiredAnyHits.length ? requiredAny : []
  };
}

function coveragePolicyShapeIssues(policy = {}) {
  const issues = [];
  [
    ['requiredAll', 'requiredAll'],
    ['required_all', 'requiredAll'],
    ['requiredWhenVisible', 'requiredWhenVisible'],
    ['required_when_visible', 'requiredWhenVisible'],
    ['requiredAny', 'requiredAny'],
    ['required_any', 'requiredAny'],
    ['optional', 'optional'],
    ['optionalComponents', 'optional'],
    ['optional_components', 'optional']
  ].forEach(([field, label]) => {
    if (policy[field] == null) return;
    if (!Array.isArray(policy[field]) || policy[field].some(value => typeof value !== 'string' || !value.trim())) {
      issues.push(`coveragePolicy.${label} must be an array of non-empty strings when present`);
    }
  });
  const minHits = policy.minHits != null ? policy.minHits : policy.min_hits;
  if (minHits != null && !isNonNegativeIntegerValue(minHits)) {
    issues.push('coveragePolicy.minHits must be a non-negative integer when present');
  }
  return issues;
}

function isNonNegativeIntegerValue(value) {
  if (typeof value === 'number') return Number.isInteger(value) && value >= 0;
  if (typeof value === 'string') return /^\d+$/.test(value.trim());
  return false;
}

module.exports = {
  activateCoveragePolicyConditions,
  coveragePolicyShapeIssues,
  coverageRoleForComponent,
  coverageStatusForComponents,
  filterStageCoveragePolicy,
  normalizeStageCoveragePolicy
};
