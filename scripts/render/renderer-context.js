const {
  RENDERER_COLOR_CONTRACT,
  RENDERER_CONTEXT_CONTRACT,
  assertRendererContext,
  createAuditedRendererContext,
  familyRendererContextGroups,
  flattenRendererContextContract,
  missingRendererColorTokens,
  missingRendererContextKeys,
  rendererContextGroups
} = require('./context/contracts');

function createRendererContext(api = {}) {
  return Object.freeze(Object.assign({}, api, {
    colors() {
      return typeof api.colors === 'function' ? api.colors() : (api.colors || {});
    }
  }));
}

module.exports = {
  RENDERER_COLOR_CONTRACT,
  RENDERER_CONTEXT_CONTRACT,
  assertRendererContext,
  createAuditedRendererContext,
  createRendererContext,
  familyRendererContextGroups,
  flattenRendererContextContract,
  missingRendererColorTokens,
  missingRendererContextKeys,
  rendererContextGroups
};
