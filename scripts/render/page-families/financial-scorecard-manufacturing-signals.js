function createManufacturingMaintenanceSignals(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  function renderMaintenanceSignals(slide, maintenance, quality) {
    const ops = { x:8.92, y:2.10, w:2.86, h:3.92 };
    addRect(slide, ops.x, ops.y, ops.w, ops.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'MAINTENANCE SIGNALS', { x:ops.x+0.26, y:ops.y+0.32, w:1.78, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    [maintenance, quality].forEach((m,i)=>{
      const y = ops.y + 0.92 + i*1.05;
      const accent = i===0 ? C.cyan : C.risk;
      addText(slide, m.label || (i===0 ? '平均响应' : '重复故障'), { x:ops.x+0.28, y:y-0.02, w:1.18, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || (i===0 ? '18min' : '12%'), { x:ops.x+1.70, y:y-0.05, w:0.78, h:0.18, fontSize:13.5, color:accent, align:'right', fit:'shrink' });
      addText(slide, m.note || '纳入班组复盘。', { x:ops.x+0.28, y:y+0.36, w:1.96, h:0.28, fontSize:8.8, color:C.body, fit:'shrink' });
      addHairline(slide, ops.x+0.28, y+0.78, 2.18, C.line, 20, 0.34);
    });
    const rail = ['STATE', 'STOP', 'WO', 'OEE'];
    rail.forEach((label,i)=>{
      const y = ops.y + 3.12;
      const x = ops.x + 0.26 + i*0.58;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      slide.addShape('ellipse', { x, y, w:0.12, h:0.12, fill:{color:accent}, line:{color:accent, transparency:100} });
      if (i<rail.length-1) addHairline(slide, x+0.12, y+0.06, 0.42, C.line, 18, 0.34);
      addText(slide, label, { x:x-0.14, y:y+0.28, w:0.48, h:0.18, fontSize:5.8, color:C.muted, align:'center', fit:'shrink' });
    });
  }

  return {
    renderMaintenanceSignals
  };
}

module.exports = {
  createManufacturingMaintenanceSignals
};
