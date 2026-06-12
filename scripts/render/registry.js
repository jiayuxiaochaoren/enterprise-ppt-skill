function createRenderRegistry(entries = []) {
  const exact = new Map();
  const aliases = new Map();
  let fallback = null;

  const rendererName = render => (render && render.name) || 'anonymousRenderer';
  const rendererId = (entry = {}, render, type = '') => entry.id || entry.rendererId || type || rendererName(render);
  const source = entry => entry.source || 'render-registry';

  for (const entry of entries) {
    if (!entry) continue;
    const render = entry.render;
    const base = {
      render,
      rendererId: rendererId(entry, render, (entry.types || [])[0] || 'fallback'),
      rendererName: rendererName(render),
      source: source(entry)
    };
    if (entry.fallback) {
      fallback = Object.assign({}, base, {
        matchedType: entry.type || 'fallback',
        matchKind: 'fallback'
      });
      continue;
    }
    for (const type of entry.types || []) {
      exact.set(type, Object.assign({}, base, {
        matchedType: type,
        matchKind: 'exact'
      }));
    }
    for (const alias of entry.aliases || []) {
      aliases.set(alias, Object.assign({}, base, {
        matchedType: (entry.types || [])[0] || alias,
        alias,
        matchKind: 'alias'
      }));
    }
  }

  return {
    matchFor(type = '') {
      const requestedType = String(type || '');
      const match = exact.get(requestedType) || aliases.get(requestedType) || fallback;
      if (!match) return null;
      return Object.assign({ requestedType }, match);
    },
    renderFor(type = '') {
      const match = this.matchFor(type);
      return match && match.render;
    }
  };
}

module.exports = {
  createRenderRegistry
};
