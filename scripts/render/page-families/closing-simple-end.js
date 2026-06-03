function createClosingSimpleEndRenderer(ctx = {}, deps = {}) {
  const { closingMeta, drawFooter } = deps;
  const C = ctx.colors();
  const W = typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const {
    addHairline,
    addLabel,
    addLightBreathingCircle,
    addNumber,
    addRect,
    addText,
    copyFallback,
    metaDisabled,
    profileFont,
    surfaceFill,
    typeSize
  } = ctx;

  return function closingSimpleEnd(slide, plan, s, idx) {
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addLightBreathingCircle(slide, 8.24, 0.36, 4.36, C.softBlue, 38);
    addRect(slide, 0.88, 0.84, 0.045, 5.72, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addLabel(slide, s.label || 'END', { x:1.22, y:1.02, w:1.12, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.05 });
    addText(slide, s.title || copyFallback(plan, 'closingSimpleTitle'), {
      x:1.18, y:2.02, w:5.90, h:0.82,
      fontSize:typeSize('coverTitle', 34.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || s.claim || copyFallback(plan, 'closingSimpleSubtitle'), {
      x:1.22, y:3.18, w:5.28, h:0.24,
      fontSize:11.4, color:C.body, fit:'shrink'
    });
    addRect(slide, 1.22, 3.78, 0.96, 0.045, C.accent, C.accent);
    addRect(slide, 2.32, 3.78, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:36}, line:{color:C.cyan, transparency:100} });
    if (s.note) addText(slide, s.note, { x:1.22, y:4.42, w:5.70, h:0.22, fontSize:9.0, color:C.muted, fit:'shrink' });

    addRect(slide, 8.70, 0.94, 2.66, 5.34, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addText(slide, 'END', { x:9.12, y:1.30, w:1.54, h:0.46, fontFace:profileFont('latin'), fontSize:27.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:10.54, y:1.94, w:0.42, h:0.16, fontSize:9.2, color:C.darkMuted || 'A8B3C3', align:'right' });
    addHairline(slide, 9.20, 3.02, 1.04, C.accent, 0, 0.56);
    addText(slide, closingMeta(plan), { x:9.20, y:3.48, w:1.62, h:0.34, fontSize:7.6, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addText(slide, metaDisabled(plan) ? '' : (plan.date || ''), { x:9.20, y:5.26, w:1.34, h:0.12, fontSize:7.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
    addHairline(slide, 1.18, 6.42, 6.82, C.line, 16, 0.55);
    drawFooter(slide, plan, { x:1.18, y:6.72, w:7.0, h:0.14, fontSize:7.4, fit:'shrink' });
  };
}

module.exports = {
  createClosingSimpleEndRenderer
};
