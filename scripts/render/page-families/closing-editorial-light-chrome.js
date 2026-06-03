function createClosingEditorialChromeRenderer(ctx = {}) {
  const C = ctx.colors();
  const W = typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const {
    addLightBreathingCircle,
    addNumber,
    addRect,
    addText,
    profileFont,
    surfaceFill
  } = ctx;

  function drawClosingEditorialChrome(slide, idx) {
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addRect(slide, 0, 0, W, 0.10, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addLightBreathingCircle(slide, 8.30, 0.34, 4.38, C.softBlue, 38);
    addRect(slide, 8.92, 1.10, 2.60, 4.70, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addText(slide, 'END', { x:9.20, y:1.42, w:1.92, h:0.48, fontFace:profileFont('latin'), fontSize:26, bold:true, color:C.accent, fit:'shrink', align:'right' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:10.72, y:1.42, w:0.42, h:0.16, fontSize:9.6, color:C.darkMuted || 'A8B3C3', align:'right' });
  }

  return {
    drawClosingEditorialChrome
  };
}

module.exports = {
  createClosingEditorialChromeRenderer
};
