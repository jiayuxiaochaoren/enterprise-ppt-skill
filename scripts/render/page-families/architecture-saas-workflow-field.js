function createSaasWorkflowField(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function drawWorkflowField(slide, s, caps) {
    const stage = { x:3.86, y:2.06, w:4.66, h:4.12 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, C.ink, '334155', { fill:{color:C.ink, transparency:0}, line:{color:'334155', transparency:34, width:0.42} });
    addLabel(slide, 'WORKFLOW FIELD', { x:stage.x+0.28, y:stage.y+0.28, w:1.18, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
    const cx = stage.x + stage.w * 0.50;
    const cy = stage.y + 2.08;
    slide.addShape('ellipse', { x:cx-1.12, y:cy-1.12, w:2.24, h:2.24, fill:{color:C.ink, transparency:100}, line:{color:C.accent, transparency:56, width:0.38} });
    slide.addShape('ellipse', { x:cx-0.66, y:cy-0.66, w:1.32, h:1.32, fill:{color:C.ink2, transparency:10}, line:{color:C.accent, transparency:24, width:0.50} });
    addText(slide, s.centerTitle || '核心工作流', { x:cx-0.46, y:cy-0.16, w:0.92, h:0.14, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, 'EVENTS · DATA · RIGHTS', { x:cx-0.70, y:cy+0.12, w:1.40, h:0.08, fontSize:5.0, color:'64748B', align:'center', charSpace:0.5 });
    const capW = 1.80;
    const capSlots = [
      { x:stage.x+0.34, y:stage.y+0.88, anchor:[cx-0.72, cy-0.54], color:C.accent },
      { x:stage.x+2.50, y:stage.y+0.88, anchor:[cx+0.72, cy-0.54], color:C.cyan },
      { x:stage.x+2.50, y:stage.y+2.78, anchor:[cx+0.72, cy+0.54], color:C.violet },
      { x:stage.x+0.34, y:stage.y+2.78, anchor:[cx-0.72, cy+0.54], color:'94A3B8' }
    ];
    caps.forEach((cap, i) => {
      const slot = capSlots[i];
      slide.addShape('line', { x:slot.anchor[0], y:slot.anchor[1], w:slot.x+0.80-slot.anchor[0], h:slot.y+0.26-slot.anchor[1], line:{color:slot.color, transparency:62, width:0.28} });
      addRect(slide, slot.x, slot.y, capW, 0.72, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:i === 0 ? 6 : 20},
        line:{color:i === 0 ? slot.color : '334155', transparency:i === 0 ? 24 : 52, width:0.34}
      });
      addNumber(slide, String(i+1).padStart(2, '0'), { x:slot.x+0.14, y:slot.y+0.20, w:0.24, h:0.10, fontSize:6.4, color:slot.color });
      addText(slide, itemTitle(cap, `能力 ${i+1}`), { x:slot.x+0.48, y:slot.y+0.12, w:1.08, h:0.14, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(cap), { x:slot.x+0.48, y:slot.y+0.42, w:1.08, h:0.12, fontSize:8.8, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
  }

  return {
    drawWorkflowField
  };
}

module.exports = {
  createSaasWorkflowField
};
