function createClosingEditorialMetaRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addText,
    copyFallback
  } = ctx;

  function drawClosingEditorialMeta(slide, plan, s, closingMeta) {
    addLabel(slide, 'NEXT DECISION', { x:9.28, y:3.12, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.note || copyFallback(plan, 'closingNote'), {
      x:9.28, y:3.48, w:1.76, h:0.42,
      fontSize:8.0, color:C.captionOnImage || 'CBD5E1', fit:'shrink', breakLine:true
    });
    addHairline(slide, 9.28, 4.38, 1.18, C.accent, 0, 0.58);
    addText(slide, copyFallback(plan, 'closingSubtitle'), {
      x:9.28, y:4.78, w:1.68, h:0.30,
      fontSize:8.4, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    addHairline(slide, 0.86, 6.42, 7.60, C.line, 16, 0.55);
    addText(slide, closingMeta(plan), { x:0.86, y:6.70, w:7.60, h:0.16, fontSize:7.6, color:C.muted, fit:'shrink' });
  }

  return {
    drawClosingEditorialMeta
  };
}

module.exports = {
  createClosingEditorialMetaRenderer
};
