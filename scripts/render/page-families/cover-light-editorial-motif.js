function createCoverLightEditorialMotif(ctx = {}, deps = {}) {
  const {
    canvasHeight,
    canvasWidth,
    colors,
    profile
  } = deps;

  function drawLightEditorialMotif(slide, motif, bg) {
    const C = colors();
    const W = canvasWidth();
    const H = canvasHeight();
    slide.background = { color:bg };
    ctx.addRect(slide, 0, 0, W, H, bg, bg);

    if (motif === 'ivory-editorial') {
      ctx.addRect(slide, 0, 0, 3.68, H, C.ink, C.ink);
      ctx.addRect(slide, 3.68, 0, 0.035, H, C.accent, C.accent, {
        fill:{color:C.accent, transparency:12},
        line:{color:C.accent, transparency:100}
      });
      ctx.addLabel(slide, 'SOLID PALETTE', {
        x:0.78, y:0.92, w:1.68, h:0.12,
        fontSize:6.8, color:'A8B3C3', charSpace:1.0
      });
      ctx.addText(slide, profile().palette || '', {
        x:0.78, y:6.58, w:1.92, h:0.12,
        fontSize:6.8, color:'A8B3C3', fit:'shrink'
      });
      return;
    }

    ctx.addRect(slide, 0.82, 0.76, 2.42, 0.035, C.accent, C.accent);
    if (motif === 'redline-editorial') {
      ctx.addRect(slide, 0, 0, W, 0.10, C.accent, C.accent);
      ctx.addRect(slide, 8.52, 0, 0.10, H, C.accent, C.accent, {
        fill:{color:C.accent, transparency:16},
        line:{color:C.accent, transparency:100}
      });
    } else if (motif === 'calm-field') {
      ctx.addLightBreathingCircle(slide, 8.92, 0.62, 3.76, C.softBlue, 34);
    } else {
      ctx.addLightBreathingCircle(slide, 8.92, 0.62, 3.76, C.softBlue, 44);
    }
  }

  return {
    drawLightEditorialMotif
  };
}

module.exports = {
  createCoverLightEditorialMotif
};
