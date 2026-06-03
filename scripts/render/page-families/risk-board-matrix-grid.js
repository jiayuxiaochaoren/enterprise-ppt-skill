function createRiskMatrixGridRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawRiskMatrixGrid(slide, rows, box, darkRisk) {
    const panelColor = darkRisk ? (C.ink2 || C.ink) : panelFill();
    const lineColor = darkRisk ? (C.darkLine || '334155') : C.line;
    const mutedColor = darkRisk ? (C.darkMuted || '94A3B8') : C.muted;
    addRect(slide, box.x, box.y, box.w, box.h, panelColor, lineColor, { fill:{color:panelColor, transparency:darkRisk ? 0 : 0}, line:{color:lineColor, transparency:darkRisk ? 52 : 14, width:0.52} });
    addText(slide, '发生概率', { x:box.x+0.12, y:box.y+0.10, w:0.70, h:0.12, fontSize:7.0, color:mutedColor, fit:'shrink' });
    addText(slide, '业务影响', { x:box.x+box.w-0.82, y:box.y+box.h+0.10, w:0.74, h:0.12, fontSize:7.0, color:mutedColor, fit:'shrink', align:'right' });
    addHairline(slide, box.x+0.52, box.y+box.h-0.42, box.w-0.88, lineColor, darkRisk ? 42 : 4, 0.5);
    slide.addShape('line', { x:box.x+0.52, y:box.y+box.h-0.42, w:0, h:-box.h+0.76, line:{color:lineColor, transparency:darkRisk ? 42 : 4, width:0.5} });
    const highCount = rows.filter(r => r[1] === '高').length;
    const midCount = rows.filter(r => r[1] === '中' || !['高', '低'].includes(r[1])).length;
    const lowCount = rows.filter(r => r[1] === '低').length;
    const cells = [
      [box.x+0.48, box.y+2.34, 1.30, 0.88, C.cyan, '低影响 / 可监控', lowCount],
      [box.x+1.98, box.y+2.34, 1.30, 0.88, C.accent, '中影响 / 需响应', midCount],
      [box.x+0.48, box.y+1.22, 1.30, 0.88, C.accent, '高概率 / 需治理', 0],
      [box.x+1.98, box.y+1.22, 1.30, 0.88, C.risk, '高风险 / 优先处置', highCount]
    ];
    cells.forEach(([x,y,w,h,color,label,count],i)=>{
      const isHigh = i === 3;
      const fillTransparency = isHigh ? 76 : (count ? 84 : 91);
      addRect(slide, x, y, w, h, color, color, { fill:{color, transparency:darkRisk ? Math.max(42, fillTransparency - 18) : fillTransparency}, line:{color, transparency:isHigh?28:56, width:0.46} });
      addText(slide, label, { x:x+0.14, y:y+h-0.24, w:w-0.28, h:0.12, fontSize:6.8, color:darkRisk ? (isHigh ? 'FFE3E3' : C.white) : (isHigh ? C.risk : C.body), align:'left', fit:'shrink' });
      if (count) {
        slide.addShape('ellipse', { x:x+w-0.34, y:y+0.15, w:0.24, h:0.24, fill:{color}, line:{color:'FFFFFF', transparency:0, width:0.50} });
        addText(slide, String(count), { x:x+w-0.305, y:y+0.225, w:0.17, h:0.08, fontSize:5.5, bold:true, color:C.onAccent || 'FFFFFF', align:'center', fit:'shrink' });
      }
    });

    return {
      lineColor
    };
  }

  return {
    drawRiskMatrixGrid
  };
}

module.exports = {
  createRiskMatrixGridRenderer
};
