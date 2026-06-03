const {
  BASE_RENDERER_CONTEXT_CONTRACT
} = require('./base-contracts');
const {
  RENDERER_FAMILY_CONTEXT_CONTRACT
} = require('./family-contracts');
const {
  RENDERER_COLOR_CONTRACT
} = require('./color-contracts');

const BASE_RENDERER_CONTEXT_GROUPS = Object.keys(BASE_RENDERER_CONTEXT_CONTRACT);
const RENDERER_CONTEXT_CONTRACT = Object.assign(
  {},
  BASE_RENDERER_CONTEXT_CONTRACT,
  RENDERER_FAMILY_CONTEXT_CONTRACT
);

function rendererContextGroups() {
  return Object.keys(RENDERER_CONTEXT_CONTRACT);
}

function familyRendererContextGroups() {
  return rendererContextGroups().filter(group => !BASE_RENDERER_CONTEXT_GROUPS.includes(group));
}

function flattenRendererContextContract(groups = rendererContextGroups()) {
  return Array.from(new Set(groups.flatMap(group => RENDERER_CONTEXT_CONTRACT[group] || [])));
}

function missingRendererContextKeys(ctx = {}, groups = rendererContextGroups()) {
  return flattenRendererContextContract(groups).filter(key => ctx[key] == null);
}

function missingRendererColorTokens(ctx = {}, groups = Object.keys(RENDERER_COLOR_CONTRACT)) {
  const colors = typeof ctx.colors === 'function' ? ctx.colors() : (ctx.colors || {});
  return groups.flatMap(group => (RENDERER_COLOR_CONTRACT[group] || [])
    .filter(token => colors[token] == null)
    .map(token => `${group}.${token}`));
}

function assertRendererContext(ctx = {}, groups = [], opts = {}) {
  const label = opts.label || 'renderer context';
  const missingKeys = missingRendererContextKeys(ctx, groups);
  const missingColors = opts.colors === false ? [] : missingRendererColorTokens(ctx, groups);
  if (missingKeys.length || missingColors.length) {
    const parts = [];
    if (missingKeys.length) parts.push(`missing helpers: ${missingKeys.join(', ')}`);
    if (missingColors.length) parts.push(`missing colors: ${missingColors.join(', ')}`);
    throw new Error(`${label} contract failed (${groups.join(', ')}): ${parts.join('; ')}`);
  }
  return ctx;
}

function createAuditedRendererContext(ctx = {}) {
  const accessed = new Set();
  const proxy = new Proxy(ctx, {
    get(target, prop, receiver) {
      if (typeof prop === 'string') accessed.add(prop);
      return Reflect.get(target, prop, receiver);
    },
    has(target, prop) {
      if (typeof prop === 'string') accessed.add(prop);
      return Reflect.has(target, prop);
    }
  });
  return {
    context: proxy,
    accessedKeys: () => Array.from(accessed).sort(),
    reset: () => accessed.clear()
  };
}

module.exports = {
  RENDERER_COLOR_CONTRACT,
  RENDERER_CONTEXT_CONTRACT,
  assertRendererContext,
  createAuditedRendererContext,
  familyRendererContextGroups,
  flattenRendererContextContract,
  missingRendererColorTokens,
  missingRendererContextKeys,
  rendererContextGroups
};
