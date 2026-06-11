const {
  createRightSideCardRenderer
} = require('./right-side-card');

function createClosingSaasAdoptionCloseRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    closingActions,
    closingMeta,
    drawClosingHeader,
    drawFooter
  } = helpers;
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addRect,
    addText,
    copyFallback,
    panelFill,
    profileFont
  } = ctx;
  const {
    drawRightSideCard
  } = createRightSideCardRenderer(ctx);

  return function closingSaasAdoptionClose(slide, plan, s, idx) {
    drawClosingHeader(slide, plan, s, idx, { kicker:'ADOPTION TO REVENUE', titleW:6.90, titleSize:28.5, subtitleY:2.04, subtitleW:6.60 });

    const actions = closingActions(s);
    const board = { x:0.92, y:3.04, w:7.02, h:2.34 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
    addLabel(slide, 'CUSTOMER HEALTH PATH', { x:board.x+0.28, y:board.y+0.28, w:1.64, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    actions.forEach((a,i)=>{
      const x = board.x + 0.42 + i*2.08;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, board.y+0.82, 1.56, 0.78, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
        fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1?0:8},
        line:{color:i===1?accent:C.line, transparency:i===1?22:16, width:0.38}
      });
      addText(slide, a.title || '', { x:x+0.18, y:board.y+1.10, w:1.16, h:0.12, fontSize:8.4, bold:true, color:i===1?C.white:C.text, align:'center', fit:'shrink' });
      addText(slide, a.body || '', { x:x+0.12, y:board.y+1.76, w:1.28, h:0.14, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
      if (i < actions.length-1) addArrowLine(slide, x+1.70, board.y+1.20, 0.32, 0, accent, { transparency:34, width:0.36 });
    });
    const metric = drawRightSideCard(slide, { x:8.50, y:1.34, w:2.90, h:4.86 }, {
      fill:C.ink,
      railColor:C.accent,
      railTransparency:18
    });
    addLabel(slide, 'REVENUE SIGNAL', { x:metric.x+0.30, y:metric.y+0.36, w:1.22, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.7 });
    addText(slide, 'NRR', { x:metric.x+0.30, y:metric.y+0.82, w:1.20, h:0.36, fontFace:profileFont('latin'), fontSize:24.0, bold:true, color:C.accent, fit:'shrink' });
    addText(slide, 'ADOPTION DEPTH', { x:metric.x+0.32, y:metric.y+1.38, w:1.32, h:0.09, fontSize:5.2, color:'64748B', charSpace:0.65 });
    addHairline(slide, metric.x+0.32, metric.y+1.86, 1.10, C.accent, 0, 0.56);
    addText(slide, s.decision || s.note || copyFallback(plan, 'closingNote'), { x:metric.x+0.32, y:metric.y+2.18, w:1.82, h:0.42, fontSize:8.0, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    actions.slice(0, 3).forEach((a, i) => {
      const y = metric.y + 3.18 + i * 0.36;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addText(slide, String(i + 1).padStart(2, '0'), { x:metric.x+0.32, y, w:0.28, h:0.09, fontSize:5.8, bold:true, color:accent, fit:'shrink' });
      addText(slide, a.title || '', { x:metric.x+0.74, y:y-0.02, w:1.10, h:0.11, fontSize:7.0, color:C.captionOnImage, fit:'shrink' });
    });
    addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.50, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  };
}

module.exports = {
  createClosingSaasAdoptionCloseRenderer
};
