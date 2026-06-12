const {
  centeredStackY
} = require('../layout/card-layout');

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

  function drawWorkflowField(slide, s, caps, opts = {}) {
    const stage = { x:3.72, y:opts.y || 2.06, w:4.96, h:opts.h || 4.12 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, C.ink, '334155', { fill:{color:C.ink, transparency:0}, line:{color:'334155', transparency:34, width:0.42} });
    addLabel(slide, 'WORKFLOW FIELD', { x:stage.x+0.28, y:stage.y+0.28, w:1.18, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
    const cx = stage.x + stage.w * 0.50;
    const cy = stage.y + Math.min(2.08, stage.h * 0.50);
    const outerR = 0.62;
    slide.addShape('ellipse', { x:cx-outerR, y:cy-outerR, w:outerR*2, h:outerR*2, fill:{color:C.ink, transparency:100}, line:{color:C.accent, transparency:58, width:0.32} });
    addText(slide, s.centerTitle || '核心工作流', { x:cx-0.46, y:cy-0.16, w:0.92, h:0.14, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, 'EVENTS · DATA · RIGHTS', { x:cx-0.70, y:cy+0.12, w:1.40, h:0.08, fontSize:5.0, color:'64748B', align:'center', charSpace:0.5 });
    const capW = 1.46;
    const capH = 0.78;
    const leftX = stage.x + 0.26;
    const rightX = stage.x + stage.w - capW - 0.26;
    const topY = stage.y + 0.70;
    const bottomY = stage.y + Math.max(2.42, stage.h - 1.12);
    const capSlots = [
      { x:leftX, y:topY, color:C.accent },
      { x:rightX, y:topY, color:C.cyan },
      { x:rightX, y:bottomY, color:C.violet },
      { x:leftX, y:bottomY, color:'94A3B8' }
    ];
    caps.forEach((cap, i) => {
      const slot = capSlots[i];
      addRect(slide, slot.x, slot.y, capW, capH, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:i === 0 ? 6 : 20},
        line:{color:i === 0 ? slot.color : '334155', transparency:i === 0 ? 24 : 52, width:0.34}
      });
      const title = itemTitle(cap, `能力 ${i+1}`);
      const body = itemBody(cap);
      const titleH = 0.16;
      const bodyH = body ? 0.12 : 0;
      const [titleY, bodyY] = centeredStackY(slot.y, capH, body ? [titleH, bodyH] : [titleH], body ? 0.07 : 0);
      addNumber(slide, String(i+1).padStart(2, '0'), { x:slot.x+0.12, y:titleY+0.02, w:0.24, h:0.10, fontSize:6.2, color:slot.color });
      addText(slide, title, { x:slot.x+0.38, y:titleY, w:0.96, h:titleH, fontSize:7.6, bold:true, color:C.white, fit:'shrink', valign:'mid' });
      if (body) addText(slide, body, { x:slot.x+0.38, y:bodyY, w:0.96, h:bodyH, fontSize:6.4, color:C.darkMuted || 'A8B3C3', fit:'shrink', valign:'mid' });
    });
  }

  return {
    drawWorkflowField
  };
}

module.exports = {
  createSaasWorkflowField
};
