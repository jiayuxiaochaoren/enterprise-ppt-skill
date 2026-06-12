function createDashboardReturnRiskPanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    formatMetricDelta,
    panelFill
  } = ctx;

  function drawDashboardReturnRiskPanel(slide, metrics, chart) {
    addRect(slide, chart.x, chart.y, chart.w, chart.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
    addLabel(slide, 'RETURN / CASH / RISK', { x:chart.x+0.26, y:chart.y+0.32, w:1.96, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    const bars = metrics.slice(0,3);
    bars.forEach((m,i)=>{
      const y = chart.y + 0.86 + i*0.82;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.risk);
      addText(slide, m.label || `指标 ${i+1}`, { x:chart.x+0.28, y:y-0.02, w:1.10, h:0.12, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '—', { x:chart.x+2.04, y:y-0.06, w:0.74, h:0.16, fontSize:11.6, color:accent, align:'right', fit:'shrink' });
      addRect(slide, chart.x+0.28, y+0.28, 2.34, 0.055, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, chart.x+0.28, y+0.28, [1.82,1.20,0.82][i] || 1.0, 0.055, accent, accent, { line:{color:accent, transparency:100} });
      if (m.delta) addText(slide, formatMetricDelta(m.delta), { x:chart.x+0.28, y:y+0.46, w:1.56, h:0.12, fontSize:6.8, color:C.muted, fit:'shrink' });
    });
    addRect(slide, chart.x+0.28, chart.y+3.34, 2.40, 0.28, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    addText(slide, '现金回收、估值修复、风险项目必须同步看。', { x:chart.x+0.40, y:chart.y+3.40, w:2.12, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
  }

  return {
    drawDashboardReturnRiskPanel
  };
}

module.exports = {
  createDashboardReturnRiskPanel
};
