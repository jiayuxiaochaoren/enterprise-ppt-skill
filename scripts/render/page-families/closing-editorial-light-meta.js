function createClosingEditorialMetaRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addText,
    copyFallback
  } = ctx;

  function drawClosingEditorialMeta(slide, plan, s, closingMeta, sideBox = {}) {
    const side = {
      x: sideBox.x ?? 8.62,
      y: sideBox.y ?? 1.30,
      w: sideBox.w ?? 2.78,
      h: sideBox.h ?? 4.86
    };
    const contentX = side.x + 0.38;
    addLabel(slide, '下一步', { x:contentX, y:side.y+1.78, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    addText(slide, s.note || copyFallback(plan, 'closingNote'), {
      x:contentX, y:side.y+2.12, w:1.76, h:0.42,
      fontSize:8.0, color:C.captionOnImage || 'CBD5E1', fit:'shrink', breakLine:true
    });
    addHairline(slide, contentX, side.y+3.02, 1.18, C.accent, 0, 0.58);
    addText(slide, copyFallback(plan, 'closingSubtitle'), {
      x:contentX, y:side.y+3.42, w:1.68, h:0.30,
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
