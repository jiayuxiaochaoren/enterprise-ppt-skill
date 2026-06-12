function createBusinessExecutiveBlocksRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const W = ctx.canvasWidth();
  const H = ctx.canvasHeight();
  const {
    addHairline,
    addRect,
    addText,
    addVisualPhotoPanel,
    premiumTitle
  } = ctx;
  const {
    drawFooter
  } = deps;

  return function executiveBlocks(slide, plan, s, idx) {
    slide.background = { color:C.paper };
    addRect(slide, 0, 0, W, H, C.paper, C.paper);
    slide.addShape('ellipse', { x:9.58, y:0.42, w:3.45, h:3.45, fill:{ color:C.softBlue, transparency:50 }, line:{ color:C.softBlue, transparency:100 } });
    if (!addVisualPhotoPanel(slide, plan, s, 'split', 0, 0, 4.25, H, { transparency:66 })) {
      addRect(slide, 0, 0, 4.25, H, C.ink, C.ink);
    }
    addText(slide, `0${idx || ''}`, { x:0.62, y:0.62, w:0.48, h:0.18, fontSize:9, color:C.accent, charSpace:1.1 });
    addText(slide, 'OPERATING MODEL', { x:0.62, y:1.08, w:2.1, h:0.15, fontSize:7.8, color:C.cyan, charSpace:1.0 });
    addText(slide, premiumTitle(s.title || ''), { x:0.60, y:1.58, w:3.05, h:0.92, fontSize:23.5, bold:true, color:C.white, breakLine:true, fit:'shrink' });
    addHairline(slide, 0.62, 2.85, 0.72, C.accent, 0, 0.75);
    if (s.intro) addText(slide, s.intro, { x:0.62, y:3.28, w:2.95, h:0.55, fontSize:10.8, color:'CBD5E1', breakLine:true, valign:'top' });
    drawFooter(slide, plan, { x:0.62, y:6.86, w:2.6, h:0.14, fontSize:7.5 });

    addText(slide, '关键问题拆解', { x:4.92, y:0.76, w:2.8, h:0.25, fontSize:15.5, bold:true, color:C.text });
    addText(slide, '围绕运营底座、流程协同、服务响应和数据洞察形成升级重点。', { x:4.94, y:1.15, w:5.7, h:0.18, fontSize:9.2, color:C.muted });
    addHairline(slide, 4.94, 1.55, 7.55, C.line, 12, 0.6);

    const cards = s.cards || [];
    const x0 = 4.90;
    const y0 = 2.02;
    const w = 3.62;
    const h = 1.72;
    cards.slice(0, 4).forEach((c, i) => {
      const x = x0 + (i % 2) * 4.10;
      const y = y0 + Math.floor(i / 2) * 2.00;
      addRect(slide, x, y, w, h, C.white, 'E8EEF6', { line:{ color:'E8EEF6', transparency:6, width:0.65 } });
      addText(slide, String(i + 1).padStart(2, '0'), { x:x + 0.28, y:y + 0.25, w:0.42, h:0.16, fontSize:8.8, bold:true, color:i === 0 ? C.accent : C.muted });
      addText(slide, c.title, { x:x + 0.28, y:y + 0.62, w:w - 0.56, h:0.24, fontSize:15.0, bold:true, color:C.text });
      addText(slide, c.body, { x:x + 0.28, y:y + 1.06, w:w - 0.56, h:0.40, fontSize:9.8, color:C.body, valign:'top' });
      if (i === 0) addHairline(slide, x + 0.28, y + 1.48, 0.72, C.accent, 0, 0.75);
    });
  };
}

module.exports = {
  createBusinessExecutiveBlocksRenderer
};
