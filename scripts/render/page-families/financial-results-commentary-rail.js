function createFinancialResultsCommentaryRail(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText
  } = ctx;

  function drawFinancialResultsCommentaryRail(slide, s) {
    const commentary = { x:7.18, y:2.08, w:4.34, h:3.78 };
    addRect(slide, commentary.x, commentary.y, commentary.w, commentary.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'COMMENTARY RAIL', { x:commentary.x+0.30, y:commentary.y+0.34, w:1.54, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    const logic = s.businessLogic || {};
    [
      ['现状', logic.currentState || '指标正在形成同向信号。'],
      ['原因', logic.cause || '客户结构、回款周期和项目筛选共同影响结果。'],
      ['动作', logic.action || '把评论转为下一季度投入和风险边界。']
    ].forEach((row, i) => {
      const y = commentary.y + 0.92 + i * 0.82;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:commentary.x+0.32, y:y+0.04, w:0.30, h:0.09, fontSize:6.8, color:accent });
      addText(slide, row[0], { x:commentary.x+0.78, y:y-0.01, w:0.76, h:0.16, fontSize:9.6, bold:true, color:C.white, fit:false });
      addText(slide, row[1], {
        x:commentary.x+1.72, y:y-0.02, w:2.26, h:0.38,
        fontSize:8.8, color:C.captionOnImage, fit:false, breakLine:true, valign:'top'
      });
      addHairline(slide, commentary.x+0.32, y+0.56, 3.42, '334155', 46, 0.32);
    });
  }

  return {
    drawFinancialResultsCommentaryRail
  };
}

module.exports = {
  createFinancialResultsCommentaryRail
};
