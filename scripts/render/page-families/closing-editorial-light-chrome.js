const {
  createRightSideCardRenderer
} = require('./right-side-card');

function createClosingEditorialChromeRenderer(ctx = {}) {
  const C = ctx.colors();
  const W = typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const {
    addNumber,
    addRect,
    addText,
    profileFont,
    surfaceFill
  } = ctx;
  const {
    drawRightSideCard
  } = createRightSideCardRenderer(ctx);

  function drawClosingEditorialChrome(slide, idx, s = {}) {
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addRect(slide, 0, 0, W, 0.10, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.54, y:0.72, w:0.62, h:0.20, fontSize:11.2, color:C.accent, align:'right', fit:'shrink' });
    const side = drawRightSideCard(slide, { x:8.62, y:1.30, w:2.78, h:4.86 }, {
      fill:C.ink,
      railColor:C.accent,
      railTransparency:18
    });
    addText(slide, s.sideWord || s.endWord || '收束', { x:side.x+0.28, y:side.y+0.36, w:1.92, h:0.48, fontFace:profileFont('editorial'), fontSize:25.0, bold:true, color:C.accent, fit:'shrink', align:'right' });
    return side;
  }

  return {
    drawClosingEditorialChrome
  };
}

module.exports = {
  createClosingEditorialChromeRenderer
};
