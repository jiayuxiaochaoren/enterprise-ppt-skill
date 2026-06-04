function createPageFolioPolicy(deps = {}) {
  const {
    addRect,
    currentColors,
    safeTypeSize
  } = deps;

  function isPageFolioText(text, opts = {}) {
    const value = String(text || '').trim();
    const fontSize = Number(opts.fontSize || safeTypeSize('number', 12.0));
    return /^[0-9]{1,2}$/.test(value) &&
      Number(opts.x || 0) >= 11.45 &&
      Number(opts.y || 0) <= 1.18 &&
      fontSize <= 14.2 &&
      (opts.align === 'right' || opts.align == null);
  }

  function normalizePageFolioTextOptions(opts = {}) {
    const next = Object.assign({}, opts);
    next.x = 11.74;
    next.y = 0.74;
    next.w = 0.52;
    next.h = 0.22;
    next.fontSize = Math.min(Number(next.fontSize || safeTypeSize('number', 12.0)), 11.8);
    next.align = 'right';
    return next;
  }

  function pageFolioRendered(slide) {
    return Boolean(slide && slide.__codexPageFolioRendered);
  }

  function markPageFolioRendered(slide) {
    if (slide) slide.__codexPageFolioRendered = true;
  }

  function addPageFolioMarker(slide, opts = {}) {
    if (opts.marker !== true) return;
    const C = currentColors();
    const markerColor = opts.markerColor || C.cyan;
    addRect(slide, opts.x - 0.18, opts.y + 0.02, 0.026, 0.13, markerColor, markerColor, {
      fill: { color: markerColor, transparency: 0 },
      line: { color: markerColor, transparency: 100 }
    });
  }

  return {
    addPageFolioMarker,
    isPageFolioText,
    markPageFolioRendered,
    normalizePageFolioTextOptions,
    pageFolioRendered
  };
}

module.exports = {
  createPageFolioPolicy
};
