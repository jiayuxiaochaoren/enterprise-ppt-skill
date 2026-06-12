function createDashboardManagementReadout(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawDashboardManagementReadout(slide, metrics, table) {
    addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
    addLabel(slide, 'MANAGEMENT READOUT', { x:table.x+0.26, y:table.y+0.32, w:1.88, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    metrics.slice(0,3).forEach((m,i)=>{
      const y = table.y + 0.86 + i*0.82;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.risk);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:table.x+0.28, y:y, w:0.28, h:0.12, fontSize:6.8, color:accent });
      addText(slide, m.label || `指标 ${i+1}`, { x:table.x+0.72, y:y-0.02, w:0.86, h:0.12, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
      addText(slide, m.note || '纳入季度复盘。', { x:table.x+1.72, y:y-0.02, w:1.38, h:0.18, fontSize:6.8, color:C.body, fit:'shrink' });
      addHairline(slide, table.x+0.28, y+0.48, 2.84, C.line, 20, 0.34);
    });
  }

  return {
    drawDashboardManagementReadout
  };
}

module.exports = {
  createDashboardManagementReadout
};
