const { centerY } = require('../layout/card-layout');

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
    if (hasImage) {
      actions.slice(0, 5).forEach((action, i) => {
        const x = 0.90;
        const y = 3.28 + i * 0.45;
        const w = 5.78;
        const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : (C.muted || '8A7A7F')));
        const title = itemTitle(action, `行动 ${i + 1}`);
        const body = itemBody(action);
        const numberSize = 0.36;
        const numberY = centerY(y, 0.38, numberSize);
        const titleH = 0.18;
        const bodyH = 0.16;
        const copyY = centerY(y, 0.38, Math.max(titleH, bodyH));
        addRect(slide, x, y + 0.35, w, 0.01, accent, accent, {
          fill:{color:accent, transparency:i < 2 ? 20 : 58},
          line:{color:accent, transparency:100}
        });
        addRect(slide, x, numberY, numberSize, numberSize, C.white || 'FFFFFF', accent, {
          fill:{color:C.white || 'FFFFFF', transparency:18},
          line:{color:accent, transparency:26, width:0.44}
        });
        addNumber(slide, String(i + 1).padStart(2, '0'), {
          x:x, y:numberY, w:numberSize, h:numberSize,
          fontSize:7.0, color:accent, align:'center', valign:'mid', margin:0, fit:'shrink', allowTiny:true
        });
        addText(slide, title, {
          x:x + 0.58, y:copyY, w:0.86, h:titleH,
          fontSize:8.6, bold:true, color:C.text || '1C1A20', breakLine:true, valign:'mid', fit:'shrink'
        });
        addText(slide, body || title, {
          x:x + 1.64, y:copyY + (titleH - bodyH) / 2, w:4.02, h:bodyH,
          fontSize:7.2, color:C.body || '5D5156', breakLine:true, valign:'mid', fit:'shrink'
        });
      });
      return;
    }
    actions.slice(0, 3).forEach((action, i) => {
      const x = 7.06;
      const y = 2.10 + i * 1.12;
      const w = 4.56;
      const h = 0.86;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      const title = itemTitle(action, `行动 ${i + 1}`);
      const body = itemBody(action);
      const numberSize = 0.42;
      const numberY = centerY(y, h, numberSize);
      const titleH = body ? 0.32 : 0.36;
      const bodyH = 0.36;
      const titleY = centerY(y, h, titleH);
      const bodyY = centerY(y, h, bodyH);
      addRect(slide, x, y, w, h, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:i === 0 ? 14 : 34},
        line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 22 : 58, width:0.42}
      });
      addRect(slide, x+0.26, numberY, numberSize, numberSize, C.ink2, accent, {
        fill:{color:C.ink2, transparency:6},
        line:{color:accent, transparency:28, width:0.44}
      });
      addNumber(slide, String(i + 1).padStart(2, '0'), {
        x:x+0.26, y:numberY, w:numberSize, h:numberSize,
        fontSize:6.8, color:accent, align:'center', valign:'mid', margin:0, fit:'shrink', allowTiny:true
      });
      if (body) {
        addText(slide, title, {
          x:x+0.76, y:titleY, w:1.46, h:titleH,
          fontSize:10.8, bold:true, color:C.white, breakLine:true, valign:'mid', fit:'shrink'
        });
        addText(slide, body, {
          x:x+2.48, y:bodyY, w:1.78, h:bodyH,
          fontSize:8.8, color:C.darkMuted || 'D8CDD0', breakLine:true, valign:'mid', fit:'shrink'
        });
      } else {
        addText(slide, title, {
          x:x+0.76, y:titleY, w:3.34, h:titleH,
          fontSize:11.2, bold:true, color:C.white, breakLine:true, valign:'mid', fit:'shrink'
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
