function createValuePrincipleCards(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;

  return function valuePrincipleCards(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'VALUE PRINCIPLE CARDS',
      title:s.title || '价值观卡片必须写出可观察行为',
      titleW:6.20,
      subtitle:s.claim || s.subtitle || '每张卡片都包含原则、行为和证明材料。',
      subtitleW:6.70,
      idx
    });
    const values = (s.values || s.items || []).slice(0, 4);
    const slots = [
      { x:0.92, y:2.18, color:C.accent },
      { x:6.24, y:2.18, color:C.cyan },
      { x:0.92, y:4.32, color:C.violet },
      { x:6.24, y:4.32, color:C.muted }
    ];
    slots.forEach((slot, i) => {
      const v = values[i] || {};
      addRect(slide, slot.x, slot.y, 4.86, 1.62, panelFill(), i === 0 ? slot.color : C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i === 0 ? slot.color : C.line, transparency:i === 0 ? 18 : 16, width:0.44}
      });
      addRect(slide, slot.x, slot.y, 0.08, 1.62, slot.color, slot.color, { line:{color:slot.color, transparency:100} });
      addLabel(slide, `PRINCIPLE ${String(i + 1).padStart(2, '0')}`, { x:slot.x+0.28, y:slot.y+0.28, w:1.16, h:0.09, fontSize:5.6, color:slot.color, charSpace:0.7 });
      addText(slide, itemTitle(v, `原则 ${i + 1}`), { x:slot.x+0.28, y:slot.y+0.66, w:1.48, h:0.15, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(v), { x:slot.x+2.20, y:slot.y+0.48, w:2.08, h:0.26, fontSize:8.0, color:C.body, fit:'shrink', breakLine:true });
      addLabel(slide, 'OBSERVABLE BEHAVIOR', { x:slot.x+0.28, y:slot.y+1.20, w:1.44, h:0.09, fontSize:5.3, color:C.muted, charSpace:0.55 });
    });
    addText(slide, s.note || '价值观卡片没有行为证据时不能通过。', { x:0.94, y:6.48, w:7.40, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createValuePrincipleCards
};
