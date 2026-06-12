const {
  centerY,
  centeredStackY
} = require('../layout/card-layout');

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
    addLabel(slide, '经营判断', { x:commentary.x+0.30, y:commentary.y+0.34, w:1.20, h:0.10, fontSize:6.8, color:C.accent, charSpace:0 });
    const logic = s.businessLogic || {};
    [
      ['现状', logic.currentState || '指标正在形成同向信号。'],
      ['原因', logic.cause || '客户结构、回款周期和项目筛选共同影响结果。'],
      ['动作', logic.action || '把评论转为下一季度投入和风险边界。']
    ].forEach((row, i) => {
      const y = commentary.y + 0.88 + i * 0.82;
      const rowH = 0.58;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      const numberH = 0.20;
      const titleH = 0.18;
      const bodyH = 0.36;
      const [titleY, bodyY] = centeredStackY(y, rowH, [titleH, bodyH], 0.02);
      addNumber(slide, String(i + 1).padStart(2, '0'), {
        x:commentary.x+0.32, y:centerY(y, rowH, numberH), w:0.30, h:numberH,
        fontSize:6.8, color:accent, align:'center', valign:'mid', fit:'shrink'
      });
      addText(slide, row[0], {
        x:commentary.x+0.78, y:titleY, w:0.76, h:titleH,
        fontSize:9.6, bold:true, color:C.white, fit:'shrink', valign:'mid'
      });
      addText(slide, row[1], {
        x:commentary.x+1.72, y:bodyY, w:2.26, h:bodyH,
        fontSize:8.8, color:C.captionOnImage, fit:'shrink', breakLine:true, valign:'mid'
      });
      addHairline(slide, commentary.x+0.32, y+rowH, 3.42, '334155', 46, 0.32);
    });
  }

  return {
    drawFinancialResultsCommentaryRail
  };
}

module.exports = {
  createFinancialResultsCommentaryRail
};
