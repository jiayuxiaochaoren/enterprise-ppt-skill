function createManufacturingPrimaryOee(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    formatMetricDelta,
    panelFill
  } = ctx;

  function renderPrimaryOee(slide, primary) {
    const hero = { x:0.92, y:2.10, w:2.88, h:3.92 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.accent, transparency:28, width:0.56} });
    addRect(slide, hero.x+0.30, hero.y+0.68, hero.w-0.60, 0.06, C.accent, C.accent, { line:{color:C.accent, transparency:100} });
    addRect(slide, hero.x+0.30, hero.y+3.18, hero.w-0.60, 0.34, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY OEE', { x:hero.x+0.30, y:hero.y+0.34, w:1.20, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, primary.label || 'OEE', { x:hero.x+0.30, y:hero.y+0.86, w:1.42, h:0.15, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
    addNumber(slide, primary.value || '78%', { x:hero.x+0.28, y:hero.y+1.20, w:2.12, h:0.62, fontSize:40, color:C.text, fit:'shrink' });
    if (primary.delta) {
      addRect(slide, hero.x+0.34, hero.y+2.02, 1.82, 0.30, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
      addText(slide, formatMetricDelta(primary.delta), { x:hero.x+0.46, y:hero.y+2.08, w:1.54, h:0.15, fontSize:8.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
    }
    addText(slide, primary.note || 'OEE 不是孤立指标，需要拆到稼动、节拍和良率，再回到维修动作。', { x:hero.x+0.32, y:hero.y+2.62, w:2.10, h:0.36, fontSize:7.2, color:C.body, breakLine:true, fit:'shrink' });
    addLabel(slide, 'LINE 01 · LIVE READOUT', { x:hero.x+0.44, y:hero.y+3.30, w:1.56, h:0.12, fontSize:6.4, color:'CBD5E1', charSpace:0.7 });
  }

  return {
    renderPrimaryOee
  };
}

module.exports = {
  createManufacturingPrimaryOee
};
