function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(...objects) {
  const out = {};
  objects.filter(Boolean).forEach(obj => {
    Object.entries(obj).forEach(([key, value]) => {
      if (isPlainObject(value) && isPlainObject(out[key])) out[key] = deepMerge(out[key], value);
      else if (isPlainObject(value)) out[key] = deepMerge(value);
      else if (Array.isArray(value)) out[key] = value.slice();
      else if (value !== undefined) out[key] = value;
    });
  });
  return out;
}

function createIndustryPolicyHelpers({
  compactUnique,
  flattenText,
  getSlideRole,
  industryDesignDialects,
  visualIndustryId,
  visualRouter
} = {}) {
  function industryVisualPolicy(plan = {}) {
    const industries = visualRouter.industries || {};
    const base = visualRouter.default || {};
    const industryId = visualIndustryId(plan.industry);
    const industry = industries[plan.industry] || industries[industryId] || {};
    return Object.assign({}, base, industry, {
      defaultImageRoles: Object.assign({}, base.defaultImageRoles || {}, industry.defaultImageRoles || {})
    });
  }

  function industryDesignDialect(plan = {}) {
    const industryId = visualIndustryId(plan.industry);
    return industryDesignDialects[plan.industry] ||
      industryDesignDialects[industryId] ||
      industryDesignDialects['general-operations'] ||
      {
        name: 'executive-operations-system',
        defaultPalette: 'japan-editorial-navy',
        principle: 'Use restrained commercial structure with clear claim, proof object, and decision action.',
        motif: 'executive-rule-grid',
        primaryColorLogic: 'Use primary color for structure and decision emphasis.',
        components: { common: ['page-number', 'section-kicker'] },
        colorCarriers: { common: ['page-number', 'accent-rail'] },
        avoidComponents: []
      };
  }

  function dialectBucketsFor(plan = {}, s = {}, field = 'components') {
    const dialect = industryDesignDialect(plan);
    const buckets = dialect[field] || {};
    const role = getSlideRole(s);
    const keys = compactUnique(['common', role, s.type, s.layoutVariant]);
    return compactUnique(keys.flatMap(key => Array.isArray(buckets[key]) ? buckets[key] : []));
  }

  function dialectComponentsFor(plan = {}, s = {}) {
    return dialectBucketsFor(plan, s, 'components').filter(component => component !== 'load-curve-band');
  }

  function dialectColorCarriersFor(plan = {}, s = {}) {
    return dialectBucketsFor(plan, s, 'colorCarriers');
  }

  return {
    dialectBucketsFor,
    dialectColorCarriersFor,
    dialectComponentsFor,
    industryDesignDialect,
    industryVisualPolicy
  };
}

module.exports = {
  createIndustryPolicyHelpers,
  deepMerge,
  isPlainObject
};
