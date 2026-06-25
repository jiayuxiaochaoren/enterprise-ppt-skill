const {
  createRightSideCardRenderer
} = require('./right-side-card');

function createClosingFinanceInvestmentDecisionRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    closingActions,
    closingMeta,
    drawClosingHeader,
    drawFooter
  } = helpers;
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    copyFallback,
    panelFill,
    profileFont
  } = ctx;
  const {
    drawRightSideCard
  } = createRightSideCardRenderer(ctx);

  return function closingFinanceInvestmentDecision(slide, plan, s, idx) {
    drawClosingHeader(slide, plan, s, idx, { kicker:'投资决策收口', titleW:6.80, titleSize:28.0, subtitleY:2.04, subtitleW:6.40 });

    const memo = drawRightSideCard(slide, { x:8.34, y:1.34, w:3.06, h:4.86 }, {
      fill:C.ink,
      railColor:C.accent,
      railTransparency:18
    });
    addLabel(slide, '投资备忘', { x:memo.x+0.30, y:memo.y+0.34, w:0.92, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    addText(slide, '决策', { x:memo.x+0.30, y:memo.y+0.78, w:1.78, h:0.34, fontFace:profileFont('latin'), fontSize:21.5, bold:true, color:C.white, fit:'shrink' });
    addHairline(slide, memo.x+0.30, memo.y+1.62, 1.10, C.accent, 0, 0.56);
    addText(slide, s.decision || s.note || copyFallback(plan, 'closingNote'), { x:memo.x+0.30, y:memo.y+2.02, w:2.08, h:0.56, fontSize:8.8, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    [
      ['资本', '配置动作'],
      ['风险', '风险约束'],
      ['退出', '退出节奏']
    ].forEach((row,i)=>{
      const y = memo.y + 3.46 + i*0.42;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addLabel(slide, row[0], { x:memo.x+0.32, y, w:0.72, h:0.08, fontSize:5.0, color:accent, charSpace:0.5 });
      addText(slide, row[1], { x:memo.x+1.28, y:y-0.02, w:0.88, h:0.11, fontSize:7.2, color:'CBD5E1', fit:'shrink' });
    });

    const actions = closingActions(s);
    addRect(slide, 0.92, 3.28, 6.72, 2.26, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
    addLabel(slide, '下一步资本动作', { x:1.18, y:3.58, w:1.62, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    actions.forEach((a,i)=>{
      const y = 4.04 + i*0.44;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:1.20, y, w:0.28, h:0.09, fontSize:6.0, color:accent });
      addText(slide, a.title || '', { x:1.76, y:y-0.03, w:1.16, h:0.13, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      addText(slide, a.body || '', { x:3.36, y:y-0.03, w:3.10, h:0.13, fontSize:7.6, color:C.body, fit:'shrink' });
      addHairline(slide, 1.18, y+0.25, 5.88, C.line, 22, 0.28);
    });
    addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.20, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  };
}

module.exports = {
  createClosingFinanceInvestmentDecisionRenderer
};
