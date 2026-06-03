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
      const y = action.y + 0.82 + i * 0.86;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addText(slide, row[0], {
        x:action.x+0.24, y, w:0.86, h:0.13, fontSize:8.6, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, compactEvidenceCaption(row[1], 34), {
        x:action.x+1.22, y:y-0.02, w:1.28, h:0.20, fontSize:7.2, color:C.body, fit:'shrink', breakLine:true
      });
      addRect(slide, action.x+0.24, y+0.44, 0.46, 0.035, accent, accent, {
        line:{color:accent, transparency:100}
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
