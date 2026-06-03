const {
  createRiskResponsibilityLoopRenderer
} = require('./risk-board-responsibility-loop');

function createRiskBoardResponsibilityLayoutRenderers(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    itemTitle,
    panelFill
  } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const riskResponsibilityLoop = createRiskResponsibilityLoopRenderer(ctx, {
    drawRiskBoardFooter,
    drawRiskLightHeader
  });

  function riskControlStack(slide, plan, s, idx) {
    drawRiskLightHeader(slide, s, idx, { kicker:'CONTROL SYSTEM', fallbackTitle:'治理与保障体系', titleW:5.5 });
    const rows = (s.rows || []).slice(0,6);
    addRect(slide, 0.92, 2.04, 3.00, 4.10, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'GOVERNANCE PRINCIPLE', { x:1.22, y:2.42, w:1.46, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '把风险写进日常机制', { x:1.22, y:2.90, w:1.86, h:0.28, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || '以责任、时限、证据和复盘构成治理闭环。', { x:1.22, y:3.54, w:1.82, h:0.48, fontSize:8.2, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, 1.22, 4.52, 0.78, C.accent, 0, 0.68);
    addText(slide, s.note || '制度、控制动作和复盘节奏放在同一张治理页中。', { x:1.22, y:4.92, w:1.86, h:0.38, fontSize:7.0, color:C.darkMuted, breakLine:true, fit:'shrink' });
    const groups = [
      { label:'责任机制', color:C.accent, rows:rows.filter((_,i)=>i%3===0) },
      { label:'过程控制', color:C.cyan, rows:rows.filter((_,i)=>i%3===1) },
      { label:'复盘保障', color:C.violet, rows:rows.filter((_,i)=>i%3===2) }
    ];
    groups.forEach((g,i)=>{
      const x = 4.42 + i*2.46;
      addRect(slide, x, 2.20, 2.08, 3.72, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?g.color:C.line, transparency:i===0?20:16, width:0.46} });
      addRect(slide, x, 2.20, 2.08, 0.04, g.color, g.color, { line:{color:g.color, transparency:100} });
      addLabel(slide, `CONTROL 0${i+1}`, { x:x+0.22, y:2.54, w:0.94, h:0.09, fontSize:5.4, color:g.color, charSpace:0.75 });
      addText(slide, g.label, { x:x+0.22, y:2.86, w:1.20, h:0.16, fontSize:10.8, bold:true, color:C.text, fit:'shrink' });
      (g.rows.length ? g.rows : [{0:g.label, 2:'明确责任人与执行节奏。'}]).slice(0,2).forEach((r,j)=>{
        const y = 3.46 + j*0.86;
        addText(slide, itemTitle({title:r[0]}, `机制 ${j+1}`), { x:x+0.22, y:y, w:1.28, h:0.13, fontSize:8.2, bold:true, color:C.text, fit:'shrink' });
        addText(slide, r[2] || '明确责任人与执行节奏。', { x:x+0.22, y:y+0.30, w:1.48, h:0.18, fontSize:6.8, color:C.body, fit:'shrink' });
      });
    });
    drawRiskBoardFooter(slide, plan);
  }

  return {
    riskControlStack,
    riskResponsibilityLoop
  };
}

module.exports = {
  createRiskBoardResponsibilityLayoutRenderers
};
