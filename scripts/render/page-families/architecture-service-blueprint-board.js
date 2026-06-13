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

  function drawServiceBlueprintBoard(slide, s, cols, fallback, opts = {}) {
    const lanes = [
      { label:'患者动作', key:'patient', color:C.accent },
      { label:'前台服务', key:'frontstage', color:C.cyan },
      { label:'后台协同', key:'backstage', color:C.violet },
      { label:'质量证据', key:'evidence', color:'94A3B8' }
    ];

    const board = { x:0.92, y:opts.y || 2.86, w:10.84, h:opts.h || 3.36 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, '触点 · 前台 · 后台 · 质量', { x:board.x+0.30, y:board.y+0.28, w:3.30, h:0.10, fontSize:5.8, color:C.muted, charSpace:0 });
    const gridX = board.x + 1.42;
    const colW = (board.w - 1.48) / cols.length;
    cols.forEach((step,i)=>{
      const cellX = gridX + i*colW;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addNumber(slide, String(i+1).padStart(2,'0'), { x:cellX+0.10, y:board.y+0.64, w:0.28, h:0.10, fontSize:6.4, color:accent });
      addText(slide, step.title || `触点 ${i+1}`, { x:cellX+0.52, y:board.y+0.58, w:Math.max(0.82, colW-0.76), h:0.14, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      if (i<cols.length-1) {
        const nextCellX = gridX + (i+1)*colW;
        const lineX = Math.min(cellX + colW - 0.52, nextCellX - 0.38);
        const lineW = Math.max(0, nextCellX + 0.08 - lineX);
        if (lineW >= 0.10) addHairline(slide, lineX, board.y+0.70, Math.min(0.30, lineW), accent, 38, 0.34);
      }
    });
    const laneTop = board.y + 1.06;
    const footerReserve = 0.54;
    const laneGap = Math.min(0.08, Math.max(0.04, board.h * 0.015));
    const availableLaneH = Math.max(1.36, board.h - 1.18 - footerReserve);
    const laneH = Math.max(0.30, Math.min(0.46, (availableLaneH - laneGap * (lanes.length - 1)) / lanes.length));
    lanes.forEach((lane,row)=>{
      const y = laneTop + row*(laneH + laneGap);
      addText(slide, lane.label, { x:board.x+0.30, y:y+(laneH-0.12)/2, w:0.72, h:0.12, fontSize:6.6, bold:true, color:lane.color, fit:'shrink' });
      cols.forEach((step,i)=>{
        const x = gridX + i*colW;
        const text = step[lane.key] || step[lane.key === 'evidence' ? 'metric' : 'body'] || fallback[i][lane.key];
        addRect(slide, x, y, colW-0.20, laneH, row===1 ? (C.panelAlt || C.softBlue) : panelFill(), C.line, {
          fill:{color:row===1 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:row===1?8:0},
          line:{color:row===0 && i===0 ? lane.color : C.line, transparency:row===0 && i===0 ? 24 : 18, width:0.32}
        });
        addText(slide, text, { x:x+0.12, y:y+0.08, w:colW-0.44, h:Math.max(0.12, laneH-0.14), fontSize:6.3, color:row===0 ? C.text : C.body, fit:'shrink', breakLine:true, valign:'mid' });
      });
    });
    const footerY = board.y + board.h - 0.42;
    addHairline(slide, board.x+0.30, footerY, board.w-0.60, C.line, 16, 0.45);
    addText(slide, s.footerNote || '服务蓝图页强调触点之间的责任分工和质量记录，不把患者旅程压成单条时间线。', { x:board.x+0.30, y:footerY+0.18, w:6.3, h:0.12, fontSize:7.4, color:C.muted, fit:'shrink' });
  }

  return {
    drawServiceBlueprintBoard
  };
}

module.exports = {
  createServiceBlueprintBoardRenderer
};
