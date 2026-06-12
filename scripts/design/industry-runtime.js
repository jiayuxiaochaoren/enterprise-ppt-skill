const INDUSTRY_RUNTIME_ALIASES = {
  'industrial-energy': 'manufacturing-operations',
  'saas-ai-technology': 'saas-technology',
  'beauty-consumer': 'brand-retail',
  'healthcare-wellness': 'healthcare-operations',
  'lifestyle-food-tourism-fashion': 'brand-retail',
  'people-culture': 'brand-retail',
  'people-culture-company': 'people-culture',
  'government-public-sector': 'general-operations'
};

function compactUnique(values = []) {
  return [...new Set((values || []).filter(v => v != null && String(v).trim() !== '').map(v => String(v)))];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizedAliasList(pack = {}) {
  return (pack.aliases || [])
    .map(value => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

function tokenBoundaryMatch(text = '', alias = '') {
  const value = String(alias || '').trim().toLowerCase();
  if (value.length < 4) return false;
  if (!/[-_\s]/.test(value)) return false;
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(String(text || ''));
}

function createIndustryRuntime(options = {}) {
  const industryDesignDialects = options.industryDesignDialects || {};
  const visualRouter = options.visualRouter || {};
  const industryPackLibrary = options.industryPackLibrary || {};
  const copyPolicy = options.copyPolicy || {};
  const industryBenchmarks = options.industryBenchmarks || {};
  const runtimeAliases = Object.assign({}, INDUSTRY_RUNTIME_ALIASES, options.aliases || {});

  function normalizeIndustryId(industry = '') {
    return String(industry || '').trim();
  }

  function visualIndustryId(industry = '') {
    const id = normalizeIndustryId(industry);
    if (!id) return '';
    if (industryDesignDialects[id] || (visualRouter.industries || {})[id]) return id;
    return runtimeAliases[id] || id;
  }

  function industryMatchIds(industry = '') {
    const id = normalizeIndustryId(industry);
    const visualId = visualIndustryId(id);
    const ids = [id, visualId];
    Object.entries(runtimeAliases).forEach(([alias, target]) => {
      if (id === target || visualId === target) ids.push(alias);
    });
    return compactUnique(ids);
  }

  function industryPackFor(planOrIndustry = {}) {
    const id = typeof planOrIndustry === 'string'
      ? normalizeIndustryId(planOrIndustry)
      : normalizeIndustryId(planOrIndustry.industry);
    if (!id) return null;
    const ids = new Set(industryMatchIds(id));
    const text = String(id).toLowerCase();
    const packs = industryPackLibrary.packs || [];
    const exact = packs.find(pack => pack && pack.id === id);
    if (exact) return exact;
    const aliasExact = packs.find(pack => {
      if (!pack) return false;
      if (ids.has(pack.id)) return true;
      return normalizedAliasList(pack).includes(text);
    });
    if (aliasExact) return aliasExact;
    return packs.find(pack => {
      if (!pack) return false;
      return normalizedAliasList(pack).some(alias => tokenBoundaryMatch(text, alias));
    }) || null;
  }

  function copyPolicyFor(planOrIndustry = {}) {
    const id = typeof planOrIndustry === 'string'
      ? normalizeIndustryId(planOrIndustry)
      : normalizeIndustryId(planOrIndustry.industry);
    const industries = copyPolicy.industries || {};
    const ids = compactUnique(industryMatchIds(id || 'general-operations'));
    ids.push('general-operations');
    let policy = null;
    for (const candidate of ids) {
      const row = industries[candidate];
      if (!row) continue;
      policy = row.aliasOf ? industries[row.aliasOf] || row : row;
      break;
    }
    return {
      version: copyPolicy.version || 'copy-policy/v1',
      global: copyPolicy.global || {},
      industry: policy || industries['general-operations'] || {}
    };
  }

  function copyPolicyText(planOrIndustry = {}, key = '', fallback = '') {
    const policy = copyPolicyFor(planOrIndustry);
    const industryText = ((policy.industry || {}).rendererFallbacks || {})[key];
    const globalText = ((policy.global || {}).rendererFallbacks || {})[key];
    return industryText || globalText || fallback || '';
  }

  function copyPolicyList(planOrIndustry = {}, key = '', fallback = []) {
    const policy = copyPolicyFor(planOrIndustry);
    const industryList = (policy.industry || {})[key];
    const globalList = (policy.global || {})[key];
    const list = Array.isArray(industryList) ? industryList : (Array.isArray(globalList) ? globalList : fallback);
    return Array.isArray(list) ? clone(list) : [];
  }

  function industryBenchmarksFor(planOrIndustry = {}) {
    const id = typeof planOrIndustry === 'string'
      ? normalizeIndustryId(planOrIndustry)
      : normalizeIndustryId(planOrIndustry.industry);
    const aliases = industryBenchmarks.aliases || {};
    const industries = industryBenchmarks.industries || {};
    const ids = compactUnique([id, visualIndustryId(id), aliases[id], aliases[visualIndustryId(id)]].filter(Boolean));
    for (const candidate of ids) {
      if (Array.isArray(industries[candidate])) return clone(industries[candidate]);
    }
    return [];
  }

  return {
    aliases: runtimeAliases,
    normalizeIndustryId,
    visualIndustryId,
    industryMatchIds,
    industryPackFor,
    copyPolicyFor,
    copyPolicyText,
    copyPolicyList,
    industryBenchmarksFor
  };
}

module.exports = {
  INDUSTRY_RUNTIME_ALIASES,
  createIndustryRuntime
};
