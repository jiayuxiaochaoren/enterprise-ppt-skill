function createFlywheelNodes(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function drawFlywheelNodes(slide, items, slots, layout) {
    const { nodeH, nodeW } = layout;
    items.forEach((it, i) => {
      const p = slots[i];
      const x = p.x;
      const y = p.y;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : '94A3B8'));
      addRect(slide, x, y, nodeW, nodeH, C.ink, '334155', {
        fill:{color:C.ink, transparency:i === 0 ? 4 : 22},
        line:{color:accent, transparency:i === 0 ? 18 : 56, width:0.42}
      });
      addNumber(slide, String(i+1).padStart(2, '0'), { x:x+0.16, y:y+0.18, w:0.28, h:0.10, fontSize:6.6, color:accent });
      addText(slide, itemTitle(it, `动作 ${i+1}`), { x:x+0.54, y:y+0.14, w:nodeW-0.74, h:0.13, fontSize:8.4, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.54, y:y+0.44, w:nodeW-0.74, h:0.18, fontSize:8.8, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
  }

  return {
    drawFlywheelNodes
  };
}

module.exports = {
  createFlywheelNodes
};
