function createPremiumClosingActions(ctx = {}, C = ctx.colors()) {
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function drawPremiumClosingActions(slide, actions = [], hasImage = false) {
    actions.slice(0, 3).forEach((action, i) => {
      const x = hasImage ? 0.92 : 7.06;
      const y = hasImage ? (3.58 + i * 0.62) : (2.10 + i * 1.12);
      const w = hasImage ? 4.96 : 4.56;
      const h = hasImage ? 0.50 : 0.86;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      const title = itemTitle(action, `行动 ${i + 1}`);
      const body = itemBody(action);
      addRect(slide, x, y, w, h, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:hasImage ? (i === 0 ? 6 : 18) : (i === 0 ? 14 : 34)},
        line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 22 : 58, width:0.42}
      });
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:x+0.28, y:y+(hasImage ? 0.18 : 0.31), w:0.30, h:0.11, fontSize:6.7, color:accent });
      if (body) {
        addText(slide, title, {
          x:x+0.76, y:y+(hasImage ? 0.10 : 0.21), w:hasImage ? 1.64 : 1.46, h:hasImage ? 0.20 : 0.28,
          fontSize:hasImage ? 9.4 : 10.8, bold:true, color:C.white, breakLine:true, valign:'mid', fit:false
        });
        addText(slide, body, {
          x:x+(hasImage ? 2.62 : 2.48), y:y+(hasImage ? 0.10 : 0.19), w:hasImage ? 1.82 : 1.78, h:hasImage ? 0.22 : 0.34,
          fontSize:hasImage ? 7.6 : 8.8, color:C.darkMuted || 'D8CDD0', breakLine:true, valign:'mid', fit:false
        });
      } else {
        addText(slide, title, {
          x:x+0.76, y:y+(hasImage ? 0.10 : 0.20), w:hasImage ? 3.80 : 3.34, h:hasImage ? 0.22 : 0.34,
          fontSize:hasImage ? 10.0 : 11.2, bold:true, color:C.white, breakLine:true, valign:'mid', fit:false
        });
      }
    });
  }

  function drawPremiumClosingContacts(slide, contacts = []) {
    const items = contacts.slice(0, 3);
    if (!items.length) return;
    addLabel(slide, 'OWNER / CONTACT', { x:7.34, y:5.70, w:1.28, h:0.09, fontSize:5.6, color:C.cyan, charSpace:0.7 });
    items.forEach((contact, i) => {
      addText(slide, contact, { x:8.64 + i * 1.06, y:5.66, w:0.98, h:0.12, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
  }

  return {
    drawPremiumClosingActions,
    drawPremiumClosingContacts
  };
}

module.exports = {
  createPremiumClosingActions
};
