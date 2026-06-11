const {
  centerY,
  centeredStackY
} = require('../layout/card-layout');

function createClosingEditorialActionsRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawClosingEditorialActions(slide, actions) {
    const panel = panelFill();
    const startX = 0.86;
    const y = 4.72;
    const cardW = 2.18;
    const cardH = 0.98;
    actions.forEach((a, i) => {
      const x = startX + i * (cardW + 0.20);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      const badge = 0.36;
      const titleH = 0.18;
      const bodyH = 0.22;
      const [titleY, bodyY] = centeredStackY(y, cardH, [titleH, bodyH], 0.10);
      addRect(slide, x, y, cardW, cardH, panel, C.line, { fill:{color:panel, transparency:i === 2 ? 10 : 0}, line:{color:C.line, transparency:12, width:0.45} });
      addRect(slide, x, y, cardW, 0.035, accent, accent, { line:{color:accent, transparency:100} });
      addRect(slide, x+0.18, centerY(y, cardH, badge), badge, badge, panel, accent, {
        fill:{color:panel, transparency:10},
        line:{color:accent, transparency:28, width:0.44}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), {
        x:x+0.18, y:centerY(y, cardH, badge), w:badge, h:badge,
        fontSize:7.2, color:accent, align:'center', valign:'mid', margin:0, fit:'shrink', allowTiny:true
      });
      addText(slide, a.title || '', {
        x:x+0.66, y:titleY, w:0.92, h:titleH,
        fontSize:9.4, bold:true, color:C.text, fit:'shrink', valign:'mid'
      });
      addText(slide, a.body || '', {
        x:x+0.66, y:bodyY, w:1.48, h:bodyH,
        fontSize:7.3, color:C.body, fit:'shrink', breakLine:true, valign:'mid'
      });
    });
  }

  return {
    drawClosingEditorialActions
  };
}

module.exports = {
  createClosingEditorialActionsRenderer
};
