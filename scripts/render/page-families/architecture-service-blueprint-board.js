function createServiceBlueprintBoardRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawServiceBlueprintBoard(slide, s, cols, fallback) {
    const lanes = [
      { label:'患者动作', key:'patient', color:C.accent },
      { label:'前台服务', key:'frontstage', color:C.cyan },
      { label:'后台协同', key:'backstage', color:C.violet },
      { label:'质量证据', key:'evidence', color:'94A3B8' }
    ];

    const board = { x:0.92, y:2.86, w:10.84, h:3.36 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'TOUCHPOINTS · FRONTSTAGE · BACKSTAGE · QUALITY', { x:board.x+0.30, y:board.y+0.28, w:3.30, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
    const colW = (board.w - 1.48) / cols.length;
    cols.forEach((step,i)=>{
      const x = board.x + 1.06 + i*colW;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addNumber(slide, String(i+1).padStart(2,'0'), { x, y:board.y+0.64, w:0.28, h:0.10, fontSize:6.4, color:accent });
      addText(slide, step.title || `触点 ${i+1}`, { x:x+0.36, y:board.y+0.58, w:colW-0.54, h:0.14, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      if (i<cols.length-1) addHairline(slide, x+colW-0.08, board.y+0.70, 0.28, accent, 38, 0.34);
    });
    lanes.forEach((lane,row)=>{
      const y = board.y + 1.08 + row*0.56;
      addText(slide, lane.label, { x:board.x+0.30, y:y+0.15, w:0.72, h:0.12, fontSize:6.8, bold:true, color:lane.color, fit:'shrink' });
      cols.forEach((step,i)=>{
        const x = board.x + 1.42 + i*colW;
        const text = step[lane.key] || step[lane.key === 'evidence' ? 'metric' : 'body'] || fallback[i][lane.key];
        addRect(slide, x, y, colW-0.20, 0.42, row===1 ? (C.panelAlt || C.softBlue) : panelFill(), C.line, {
          fill:{color:row===1 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:row===1?8:0},
          line:{color:row===0 && i===0 ? lane.color : C.line, transparency:row===0 && i===0 ? 24 : 18, width:0.32}
        });
        addText(slide, text, { x:x+0.12, y:y+0.13, w:colW-0.44, h:0.12, fontSize:6.6, color:row===0 ? C.text : C.body, fit:'shrink' });
      });
    });
    addHairline(slide, board.x+0.30, 5.78, board.w-0.60, C.line, 16, 0.45);
    addText(slide, s.footerNote || '服务蓝图页强调触点之间的责任和证据，不把患者旅程压成单条时间线。', { x:board.x+0.30, y:5.96, w:6.3, h:0.12, fontSize:7.4, color:C.muted, fit:'shrink' });
  }

  return {
    drawServiceBlueprintBoard
  };
}

module.exports = {
  createServiceBlueprintBoardRenderer
};
