function createClosingEditorialCopyRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    copyFallback,
    profileFont,
    typeSize
  } = ctx;

  function drawClosingEditorialCopy(slide, plan, s) {
    addLabel(slide, s.label || '最终决策', { x:0.86, y:1.02, w:1.54, h:0.13, fontSize:6.9, color:C.accent, charSpace:0 });
    addText(slide, s.title || plan.closingTitle || copyFallback(plan, 'closingTitle'), {
      x:0.84, y:1.96, w:6.92, h:0.92,
      fontFace:profileFont('editorial'),
      fontSize:typeSize('coverTitle', 31.5), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || plan.closingSubtitle || copyFallback(plan, 'closingSubtitle'), {
      x:0.88, y:3.12, w:5.92, h:0.22,
      fontSize:11.4, color:C.body, fit:'shrink'
    });
    addRect(slide, 0.88, 3.68, 0.96, 0.045, C.accent, C.accent);
    addRect(slide, 1.98, 3.68, 0.36, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });
  }

  return {
    drawClosingEditorialCopy
  };
}

module.exports = {
  createClosingEditorialCopyRenderer
};
