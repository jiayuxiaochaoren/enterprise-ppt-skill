function createModuleMatrixRadarField(ctx = {}) {
  const C = ctx.colors();
  const {
    addRect,
    addText
  } = ctx;

  function drawModuleMatrixRadarField(slide, cards = []) {
    const stage = { x:4.20, y:2.06, w:7.88, h:4.46 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, 'FFFFFF', 'E8EEF6', { fill:{color:'FFFFFF', transparency:18}, line:{color:'E8EEF6', transparency:18, width:0.55} });
    addText(slide, 'CAPABILITY FIELD', { x:stage.x+0.24, y:stage.y+0.20, w:1.55, h:0.12, fontSize:6.6, color:C.muted, charSpace:1.0 });

    const cx = stage.x + stage.w * 0.52;
    const cy = stage.y + stage.h * 0.54;
    const radarCards = cards.slice(0, Math.min(6, Math.max(4, cards.length || 4)));
    const radarCount = radarCards.length || 4;
    const radarRadius = 1.10;
    const radarPoint = (radius, i, count = radarCount) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    };
    const axis = Array.from({ length:radarCount }, (_, i) => radarPoint(radarRadius, i));
    [0.42,0.76,radarRadius].forEach((r,i)=>slide.addShape('ellipse', { x:cx-r, y:cy-r, w:r*2, h:r*2, fill:{color:C.softBlue, transparency:100}, line:{color:'D8E2EF', transparency:28+i*10, width:0.36} }));
    axis.forEach(([x,y])=>slide.addShape('line', { x:cx, y:cy, w:x-cx, h:y-cy, line:{color:'D8E2EF', transparency:70, width:0.26} }));
    const strengths = [0.78, 0.82, 0.70, 0.86, 0.66, 0.74];
    const poly = Array.from({ length:radarCount }, (_, i) => radarPoint(radarRadius * strengths[i % strengths.length], i));
    poly.forEach(([x,y],i)=>{ const [nx,ny]=poly[(i+1)%poly.length]; slide.addShape('line', { x, y, w:nx-x, h:ny-y, line:{color:C.accent, transparency:20, width:0.62} }); });
    slide.addShape('ellipse', { x:cx-0.07, y:cy-0.07, w:0.14, h:0.14, fill:{color:'F7FAFD', transparency:0}, line:{color:C.accent, transparency:0, width:0.38} });

    const labels = radarCount === 4
      ? [
          { x:stage.x+0.52, y:stage.y+0.58, w:2.36, h:0.64, anchor:axis[0] },
          { x:stage.x+5.28, y:stage.y+1.54, w:2.18, h:0.64, anchor:axis[1] },
          { x:stage.x+4.84, y:stage.y+3.46, w:2.42, h:0.64, anchor:axis[2] },
          { x:stage.x+0.54, y:stage.y+2.90, w:2.32, h:0.64, anchor:axis[3] }
        ]
      : axis.map((anchor) => {
          const right = anchor[0] > cx + 0.10;
          const left = anchor[0] < cx - 0.10;
          const x = right ? stage.x + 5.28 : (left ? stage.x + 0.50 : stage.x + 2.76);
          const y = Math.max(stage.y + 0.58, Math.min(stage.y + 3.50, anchor[1] - 0.28));
          return { x, y, w:2.24, h:0.64, anchor };
        });
    radarCards.forEach((c,i)=>{
      const {x,y,w,h,anchor} = labels[i];
      const accent = i===0?C.accent:(i===1?C.cyan:(i===3?C.violet:C.muted));
      slide.addShape('ellipse', { x:anchor[0]-0.045, y:anchor[1]-0.045, w:0.09, h:0.09, fill:{color:accent}, line:{color:accent, transparency:100} });
      addRect(slide, x, y, w, h, 'FFFFFF', 'FFFFFF', { fill:{color:'FFFFFF', transparency:8}, line:{color:'FFFFFF', transparency:100} });
      addText(slide, String(i+1).padStart(2,'0'), { x:x+0.02, y:y+0.02, w:0.30, h:0.11, typeRole:'caption', fontSize:7.5, bold:true, color:accent });
      addText(slide, c.title, { x:x+0.38, y:y, w:w-0.42, h:0.16, typeRole:'cardTitle', fontSize:10.5, bold:true, color:C.text, fit:'shrink' });
      addText(slide, c.body, { x:x+0.38, y:y+0.28, w:w-0.42, h:0.25, typeRole:'bodySmall', fontSize:8.25, color:C.body, fit:'shrink', breakLine:true });
    });
  }

  return {
    drawModuleMatrixRadarField
  };
}

module.exports = {
  createModuleMatrixRadarField
};
