function createStrategyValueOperatingPanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText
  } = ctx;

  function drawStrategyValueOperatingPanel(slide, s, actions = [], center) {
    addLabel(slide, 'OPERATING MODEL', { x:center.x+0.34, y:center.y+0.34, w:1.55, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.9 });
    addText(slide, s.centerTitle || '运营动作', { x:center.x+0.34, y:center.y+0.78, w:1.70, h:0.20, fontSize:13.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, '把输入转译为可运营、可复盘、可放大的增长动作。', { x:center.x+0.34, y:center.y+1.12, w:3.10, h:0.14, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    (actions || []).slice(0,4).forEach((it,i)=>{
      const y = center.y + 1.62 + i*0.52;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.tertiary || C.violet : C.darkMuted || 'A8B3C3'));
      addRect(slide, center.x+0.34, y, 3.36, 0.34, C.ink2, C.darkLine || '334155', {
        fill:{color:C.ink2, transparency:26},
        line:{color:i===0?C.accent:(C.darkLine || '334155'), transparency:i===0?24:58, width:0.35}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:center.x+0.54, y:y+0.11, w:0.30, h:0.09, fontSize:6.4, color:accent });
      addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:center.x+1.00, y:y+0.08, w:1.78, h:0.12, fontSize:8.7, bold:true, color:C.white, fit:'shrink' });
    });
  }

  return {
    drawStrategyValueOperatingPanel
  };
}

module.exports = {
  createStrategyValueOperatingPanel
};
