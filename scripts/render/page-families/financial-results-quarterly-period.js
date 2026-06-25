function createQuarterlyPeriodPanel(ctx = {}) {
  const C = ctx.colors();
  const {
    compactEvidenceCaption,
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
    addLabel(slide, '报告周期', {
      x:periodBox.x+0.28, y:periodBox.y+0.34, w:1.36, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8
    });
    addLabel(slide, '董事会口径', {
      x:periodBox.x+1.42, y:periodBox.y+0.34, w:0.76, h:0.10, fontSize:5.4, color:'94A3B8', charSpace:0
    });
    addText(slide, period, {
      x:periodBox.x+0.28, y:periodBox.y+0.86, w:1.44, h:0.26, fontSize:15.2, bold:true, color:C.white, fit:'shrink'
    });
    [
      ['结果', logic.currentState || '本期结果好于预算基线。', C.accent],
      ['原因', logic.cause || '客户复购、价格纪律和费用边界共同推动结果。', C.cyan],
      ['边界', logic.metric || logic.nextMove || s.note || '按结果、现金和毛利三条边界安排动作。', C.violet]
    ].forEach((item, i) => {
      const y = periodBox.y + 1.35 + i * 0.72;
      addRect(slide, periodBox.x+0.24, y, periodBox.w-0.48, 0.50, i === 0 ? C.ink2 || '111827' : C.ink, item[2], {
        fill:{ color:i === 0 ? (C.ink2 || '111827') : C.ink, transparency:i === 0 ? 0 : 10 },
        line:{ color:item[2], transparency:42, width:0.28 }
      });
      addLabel(slide, item[0], {
        x:periodBox.x+0.34, y:y+0.19, w:0.34, h:0.08,
        fontSize:5.4, color:item[2], charSpace:0
      });
      addText(slide, compactEvidenceCaption(item[1], 30), {
        x:periodBox.x+0.72, y:y+0.09, w:1.50, h:0.30,
        fontSize:6.3, color:C.captionOnImage, fit:'shrink', breakLine:true
      });
    });
  }

  return {
    drawQuarterlyPeriodPanel
  };
}

module.exports = {
  createQuarterlyPeriodPanel
};
