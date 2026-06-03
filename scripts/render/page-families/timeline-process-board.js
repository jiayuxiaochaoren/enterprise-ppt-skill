function createTimelineProcessBoard(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;

  return function timelineProcessBoard(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'PROCESS BOARD',
      title:s.title || '实施路径',
      titleW:5.8,
      titleSize:24,
      subtitle:s.subtitle || s.claim,
      subtitleW:6.1,
      subtitleSize:10.0,
      idx
    });
    const phases = (s.phases || []).slice(0,6);
    addRect(slide, 0.92, 2.02, 10.92, 4.16, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    const connectors = [];
    phases.forEach((p,i)=>{
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 1.22 + col*3.36;
      const y = 2.42 + row*1.72;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, y, 2.82, 1.18, i===0 ? C.panelAlt : panelFill(), C.line, { fill:{color:i===0 ? C.panelAlt : panelFill(), transparency:i===0?4:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:18, width:0.42} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.22, w:0.32, h:0.11, fontSize:6.8, color:accent });
      addText(slide, p.title, { x:x+0.70, y:y+0.16, w:1.46, h:0.15, fontSize:10.0, bold:true, color:C.text, fit:'shrink' });
      addText(slide, p.body, { x:x+0.22, y:y+0.54, w:2.22, h:0.32, fontSize:7.6, color:C.body, fit:'shrink', breakLine:true });
      if (i < phases.length - 1 && col < 2) connectors.push({ x:x+2.90, y:y+0.58, color:accent });
    });
    connectors.forEach(conn => slide.addShape('line', { x:conn.x, y:conn.y, w:0.26, h:0, line:{color:conn.color, transparency:34, width:0.42, endArrowType:'triangle'} }));
    addText(slide, s.note || '步骤、动作与产出保持一一对应，便于项目执行复盘。', { x:0.96, y:6.46, w:8.40, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createTimelineProcessBoard
};
