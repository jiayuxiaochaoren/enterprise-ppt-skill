function createValueTilesRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const W = ctx.canvasWidth();
  const H = ctx.canvasHeight();
  const {
    addHairline,
    addRect,
    addText,
    addVisualPhotoPanel
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;

  return function valueTiles(slide, plan, s, idx) {
    slide.background = { color:C.paper };
    addRect(slide, 0, 0, W, H, C.paper, C.paper);
    addRect(slide, 0, 0, W, 0.92, C.white, C.white, { line:{color:C.white, transparency:100} });
    slide.addShape('ellipse', { x:9.58, y:0.42, w:3.45, h:3.45, fill:{color:C.softBlue, transparency:50}, line:{color:C.softBlue, transparency:100} });
    drawLightPageHeader(slide, {
      canvas:false,
      kicker:'VALUE SIGNAL',
      title:s.title,
      titleW:5.5,
      titleFit:false,
      subtitle:s.intro,
      subtitleW:5.7,
      subtitleH:0.22,
      subtitleSize:10.8,
      subtitleFit:false,
      idx,
      pageNumberMethod:'text'
    });
    const cards = s.cards || [];
    const lead = cards[0] || { title:'业务价值', body:'' };
    if (!addVisualPhotoPanel(slide, plan, s, 'value', 0.88, 2.16, 5.06, 3.58, { transparency:56, stroke:C.ink, strokeTransparency:100 })) {
      addRect(slide, 0.88, 2.16, 5.06, 3.58, C.ink, C.ink, { line:{color:C.ink, transparency:100} });
    }
    addText(slide, '01', { x:1.20, y:2.55, w:0.38, h:0.16, fontSize:9, bold:true, color:C.accent });
    addText(slide, lead.title, { x:1.18, y:3.04, w:3.65, h:0.38, fontSize:22.5, bold:true, color:C.white, fit:'shrink' });
    addText(slide, lead.body, { x:1.18, y:3.86, w:3.70, h:0.66, fontSize:10.8, color:'CBD5E1', valign:'top', fit:'shrink' });
    addHairline(slide, 1.18, 4.98, 0.90, C.accent, 0, 0.75);
    addText(slide, '经营结果', { x:1.18, y:5.24, w:1.00, h:0.10, fontSize:6.6, color:'64748B' });
    cards.slice(1,4).forEach((c,i)=>{
      const y = 2.22 + i*1.18;
      const accent = i===1 ? C.cyan : C.accent;
      addText(slide, String(i+2).padStart(2,'0'), { x:6.74, y:y+0.08, w:0.36, h:0.14, fontSize:8.2, bold:true, color:accent });
      addText(slide, c.title, { x:7.30, y:y, w:3.2, h:0.22, fontSize:14.4, bold:true, color:C.text });
      addText(slide, c.body, { x:7.30, y:y+0.42, w:4.18, h:0.30, fontSize:9.2, color:C.body, fit:'shrink' });
      addHairline(slide, 7.30, y+0.95, 4.0, 'D8E2EF', 12, 0.55);
    });
    if (s.note) addText(slide, s.note, { x:0.90, y:6.48, w:5.40, h:0.18, fontSize:8.5, color:'738297', fit:'shrink' });
    drawFooter(slide, plan, { color:'738297' });
  };
}

module.exports = {
  createValueTilesRenderer
};
