function createQuarterlyPeriodPanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawQuarterlyPeriodPanel(slide, s, logic, period, periodBox) {
    addRect(slide, periodBox.x, periodBox.y, periodBox.w, periodBox.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, 'REPORTING PERIOD', {
      x:periodBox.x+0.28, y:periodBox.y+0.34, w:1.36, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8
    });
    addText(slide, period, {
      x:periodBox.x+0.28, y:periodBox.y+0.86, w:1.44, h:0.26, fontSize:15.2, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, logic.currentState || '本期结果好于预算基线。', {
      x:periodBox.x+0.28, y:periodBox.y+1.52, w:1.64, h:0.48, fontSize:8.6, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, periodBox.x+0.28, periodBox.y+2.54, 0.78, C.accent, 0, 0.62);
    addLabel(slide, 'SOURCE', {
      x:periodBox.x+0.28, y:periodBox.y+2.88, w:0.72, h:0.09, fontSize:5.4, color:'64748B', charSpace:0.6
    });
    addText(slide, s.source || 'Management reporting', {
      x:periodBox.x+0.28, y:periodBox.y+3.18, w:1.64, h:0.16, fontSize:7.2, color:'CBD5E1', fit:'shrink'
    });
  }

  return {
    drawQuarterlyPeriodPanel
  };
}

module.exports = {
  createQuarterlyPeriodPanel
};
