function createClosingImageStatement(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const W = typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const {
    addLabel,
    addPhotoPanel,
    addRect,
    addText,
    copyFallback,
    designForSlide,
    surfaceFill,
    typeSize
  } = ctx;
  const {
    closingActions,
    closingMeta
  } = deps;

  return function closingImageStatement(slide, plan, s, idx) {
    const design = designForSlide(plan, s, 'closing');
    const imagePath = design.imagePath;
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addRect(slide, 0.72, 0.66, 5.42, 6.00, C.ink, C.ink);
    addPhotoPanel(slide, imagePath, 0.92, 0.90, 5.02, 5.42, { transparency:100, stroke:C.line, strokeTransparency:70, tone:'dark' });
    const caption = s.visual && s.visual.caption;
    if (caption) {
      addRect(slide, 0.92, 5.72, 5.02, 0.60, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
      addLabel(slide, s.imageLabel || 'CLOSING VISUAL', { x:1.18, y:5.94, w:1.28, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
      addText(slide, caption, {
        x:2.62, y:5.93, w:2.72, h:0.12, fontSize:6.6, color:C.captionOnImage, fit:'shrink'
      });
    }

    addLabel(slide, s.label || 'FINAL POSITION', { x:6.72, y:1.02, w:1.80, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.05 });
    addText(slide, String(idx || '').padStart(2,'0'), { x:11.62, y:1.00, w:0.58, h:0.16, fontSize:9.8, bold:true, color:C.muted, align:'right' });
    addText(slide, s.title || plan.closingTitle || copyFallback(plan, 'closingTitle'), {
      x:6.68, y:2.06, w:4.88, h:0.98,
      fontSize:typeSize('coverTitle', 29.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || plan.closingSubtitle || copyFallback(plan, 'closingSubtitle'), {
      x:6.72, y:3.28, w:4.24, h:0.24,
      fontSize:10.8, color:C.body, fit:'shrink'
    });
    addRect(slide, 6.72, 3.86, 0.92, 0.045, C.accent, C.accent);
    const actions = closingActions(s).slice(0, 2);
    actions.forEach((a, i) => {
      const y = 4.70 + i * 0.62;
      addText(slide, String(i+1).padStart(2,'0'), { x:6.72, y, w:0.28, h:0.10, fontSize:6.2, bold:true, color:i === 0 ? C.accent : C.cyan });
      addText(slide, a.title || '', { x:7.20, y:y-0.01, w:1.08, h:0.13, fontSize:8.4, bold:true, color:C.text, fit:'shrink' });
      addText(slide, a.body || '', { x:8.52, y:y-0.01, w:2.42, h:0.16, fontSize:7.2, color:C.body, fit:'shrink' });
    });
    addText(slide, closingMeta(plan), { x:6.72, y:6.76, w:4.74, h:0.14, fontSize:7.0, color:C.muted, fit:'shrink' });
  };
}

module.exports = {
  createClosingImageStatement
};
