function createDashboardPrimaryReturnPanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    formatMetricDelta
  } = ctx;

  function drawDashboardPrimaryReturnPanel(slide, primary, panel) {
    addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY RETURN', { x:panel.x+0.30, y:panel.y+0.34, w:1.42, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, primary.label || '核心指标', { x:panel.x+0.30, y:panel.y+0.78, w:1.56, h:0.15, fontSize:9.0, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, primary.value || '—', { x:panel.x+0.28, y:panel.y+1.12, w:2.18, h:0.58, fontSize:38, color:C.white, fit:'shrink' });
    const delta = formatMetricDelta(primary.delta || primary.unit);
    if (delta) {
      addRect(slide, panel.x+0.34, panel.y+1.96, 1.62, 0.26, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
      addText(slide, delta, { x:panel.x+0.46, y:panel.y+2.00, w:1.36, h:0.12, fontSize:6.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
    }
    addText(slide, primary.note || '核心回报指标需要和现金回收、退出窗口、后续融资共同复盘。', { x:panel.x+0.32, y:panel.y+2.58, w:2.30, h:0.46, fontSize:7.2, color:'A8B3C3', breakLine:true, fit:'shrink' });
    addHairline(slide, panel.x+0.32, panel.y+3.38, 0.82, C.accent, 0, 0.58);
    addLabel(slide, 'IC VIEW', { x:panel.x+0.32, y:panel.y+3.62, w:0.82, h:0.12, fontSize:6.8, color:'64748B', charSpace:0.7 });
  }

  return {
    drawDashboardPrimaryReturnPanel
  };
}

module.exports = {
  createDashboardPrimaryReturnPanel
};
