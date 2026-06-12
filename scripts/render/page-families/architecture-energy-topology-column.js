function createEnergyTopologyColumnRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addText
  } = ctx;

  function drawTopologyColumn(slide, c, i, y, h, connectorLayer) {
    addText(slide, c.label, { x:c.x, y:y-0.29, w:1.06, h:0.16, fontSize:10.2, bold:true, color:'7C8BA3', charSpace:0.18, fit:'shrink' });
    addRect(slide, c.x, y, c.w, h, C.ink, '334155', { fill:{color:C.ink, transparency:i===0?6:18}, line:{color:c.accent, transparency:i===0?20:50, width:0.48} });
    slide.addShape('ellipse', { x:c.x+0.22, y:y+0.25, w:0.11, h:0.11, fill:{color:c.accent}, line:{color:c.accent, transparency:100} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:c.x+0.40, y:y+0.22, w:0.28, h:0.11, typeRole:'number', fontSize:7.0, color:c.accent });
    addText(slide, c.title, { x:c.x+0.74, y:y+0.17, w:c.w-0.92, h:0.18, fontSize:12.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, c.body, { x:c.x+0.22, y:y+0.64, w:c.w-0.44, h:0.22, fontSize:8.9, color:'A8B3C3', fit:'shrink' });
    c.chips.forEach((chip,j)=>{
      const chipW = (c.w-0.58) / 3;
      addRect(slide, c.x+0.22+j*(chipW+0.05), y+1.10, chipW, 0.34, C.ink2, '334155', { fill:{color:C.ink2, transparency:30}, line:{color:'334155', transparency:58, width:0.24} });
      addText(slide, chip, { x:c.x+0.22+j*(chipW+0.05), y:y+1.19, w:chipW, h:0.14, fontSize:8.8, color:'CBD5E1', align:'center', fit:'shrink', valign:'mid' });
    });
    slide.addShape('line', { x:c.x+c.w/2, y:y+h, w:0, h:0.50, line:{color:c.accent, transparency:52, width:0.32} });
    if (i < 3) connectorLayer.push({ x:c.x+c.w+0.12, y:y+0.80, w:0.38, color:c.accent });
  }

  function drawConnectors(slide, connectorLayer) {
    connectorLayer.forEach(connector => {
      slide.addShape('line', {
        x:connector.x,
        y:connector.y,
        w:connector.w,
        h:0,
        line:{color:connector.color, transparency:42, width:0.42, endArrowType:'triangle'}
      });
    });
  }

  return {
    drawConnectors,
    drawTopologyColumn
  };
}

module.exports = {
  createEnergyTopologyColumnRenderer
};
