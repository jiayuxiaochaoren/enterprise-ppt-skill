function createCanvasMotifHelpers(core = {}, helpers = {}) {
  const { C, H, W, compositionFor } = core;
  const h = helpers;

  function WatermarkCircle(slide, tone = 'light', opts = {}) {
    if (tone === 'dark') return h.addDarkBreathingCircle(slide, opts.x, opts.y, opts.outer, opts.inner, opts.accent || C.accent);
    return h.addLightBreathingCircle(slide, opts.x, opts.y, opts.size, opts.color || C.softBlue, opts.transparency);
  }

  function canvasMotifKind(plan = {}, s = {}, tone = 'light', opts = {}) {
    if (opts.motif === 'none' || opts.field === false) return 'none';
    if (opts.motif) return opts.motif;
    const cp = compositionFor(s);
    if (cp.backgroundMotif) return cp.backgroundMotif;
    if (plan.industry === 'beauty-consumer') return tone === 'dark' ? 'beauty-dark-veil' : 'beauty-editorial-veil';
    return tone === 'dark' ? 'breathing-circle-dark' : 'breathing-circle-light';
  }

  function addBeautyEditorialVeil(slide, tone = 'light') {
    if (tone === 'dark') {
      h.addRect(slide, 10.86, 1.12, 0.024, 4.92, C.accent, C.accent, {
        fill:{ color:C.accent, transparency:92 },
        line:{ color:C.accent, transparency:100 }
      });
      h.addHairline(slide, 8.36, 1.30, 2.82, C.accent, 95, 0.30);
      h.addHairline(slide, 8.36, 5.78, 2.16, C.cyan, 96, 0.28);
      return;
    }
    h.addRect(slide, 10.98, 1.16, 0.026, 4.86, C.softBlue || 'FFF1F2', C.softBlue || 'FFF1F2', {
      fill:{ color:C.softBlue || 'FFF1F2', transparency:70 },
      line:{ color:C.softBlue || 'FFF1F2', transparency:100 }
    });
    h.addHairline(slide, 8.92, 1.34, 2.02, C.accent, 90, 0.34);
    h.addHairline(slide, 8.92, 5.72, 1.86, C.cyan, 92, 0.32);
  }

  function addCanvasMotif(slide, plan, s, tone = 'light', opts = {}) {
    const motif = canvasMotifKind(plan, s, tone, opts);
    if (motif === 'none') return;
    if (motif === 'beauty-editorial-veil') return addBeautyEditorialVeil(slide, 'light');
    if (motif === 'beauty-dark-veil') return addBeautyEditorialVeil(slide, 'dark');
    if (tone === 'dark') return WatermarkCircle(slide, 'dark', opts);
    return WatermarkCircle(slide, 'light', Object.assign({ y:1.22, size:3.16, transparency:56 }, opts));
  }

  function TintedBackground(slide, opts = {}) {
    const dark = opts.tone === 'dark' || opts.dark;
    const bg = opts.color || (dark ? C.ink : h.surfaceFill());
    slide.background = { color:bg };
    h.addRect(slide, 0, 0, W, H, bg, bg);
    if (!dark && opts.header !== false) {
      const head = opts.headerColor || h.panelFill();
      h.addRect(slide, 0, 0, W, 0.92, head, head, { fill:{ color:head, transparency:0 }, line:{ color:head, transparency:100 } });
    }
  }

  return {
    TintedBackground,
    WatermarkCircle,
    addBeautyEditorialVeil,
    addCanvasMotif,
    canvasMotifKind
  };
}

module.exports = {
  createCanvasMotifHelpers
};
