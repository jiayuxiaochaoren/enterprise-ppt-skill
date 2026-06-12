function createChapterManufacturingLineNote(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    publicSlideNote
  } = ctx;

  function drawManufacturingLineNote(slide, s) {
    const note = publicSlideNote(s.note);
    if (!note) return;
    addRect(slide, 0.92, 5.88, 9.92, 0.34, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:26},
      line:{color:'334155', transparency:64, width:0.32}
    });
    addLabel(slide, s.bottomLabel || '能力路径', {
      x:1.14, y:5.99, w:1.06, h:0.09,
      fontSize:5.4, color:C.accent, charSpace:0.72
    });
    addText(slide, note, {
      x:2.46, y:5.98, w:7.24, h:0.11,
      fontSize:7.4, color:C.darkMuted || '94A3B8', fit:'shrink'
    });
  }

  return {
    drawManufacturingLineNote
  };
}

module.exports = {
  createChapterManufacturingLineNote
};
