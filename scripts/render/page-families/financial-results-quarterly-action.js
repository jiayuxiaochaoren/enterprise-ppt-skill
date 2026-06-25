function createQuarterlyActionRail(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    compactEvidenceCaption,
    panelFill
  } = ctx;

  function drawQuarterlyActionRail(slide, s, logic, action) {
    addRect(slide, action.x, action.y, action.w, action.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.accent, transparency:26, width:0.46}
    });
    addLabel(slide, 'VARIANCE / ACTION', {
      x:action.x+0.24, y:action.y+0.28, w:1.28, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8
    });
    [
      ['差异解释', logic.cause || '复购客户、价格纪律和费用边界共同推动结果。'],
      ['管理动作', logic.action || s.guidance || '继续按月复盘回款、毛利和费用效率。'],
      ['指引边界', s.guidance || logic.impact || '下季度保持核心投入，但不突破预算上限。']
    ].forEach((row, i) => {
      const y = action.y + 0.78 + i * 0.92;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, action.x+0.20, y-0.02, action.w-0.40, 0.78, 'FFFFFF', accent, {
        fill:{ color:'FFFFFF', transparency:0 },
        line:{ color:accent, transparency:34, width:0.30 }
      });
      addText(slide, row[0], {
        x:action.x+0.34, y:y+0.14, w:0.92, h:0.12, fontSize:8.4, bold:true, color:accent, fit:'shrink'
      });
      addText(slide, compactEvidenceCaption(row[1], 46), {
        x:action.x+0.34, y:y+0.33, w:2.28, h:0.32, fontSize:6.4, color:C.body, fit:'shrink', breakLine:true
      });
    });
  }

  return {
    drawQuarterlyActionRail
  };
}

module.exports = {
  createQuarterlyActionRail
};
