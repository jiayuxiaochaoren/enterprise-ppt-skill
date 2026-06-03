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
    const cardW = 2.52;
    actions.forEach((a, i) => {
      const x = startX + i * (cardW + 0.20);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, x, y, cardW, 0.98, panel, C.line, { fill:{color:panel, transparency:i === 2 ? 10 : 0}, line:{color:C.line, transparency:12, width:0.45} });
      addRect(slide, x, y, cardW, 0.035, accent, accent, { line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.30, w:0.32, h:0.12, fontSize:7.2, color:accent });
      addText(slide, a.title || '', { x:x+0.66, y:y+0.25, w:0.92, h:0.18, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
      addText(slide, a.body || '', { x:x+0.66, y:y+0.56, w:1.48, h:0.20, fontSize:7.3, color:C.body, fit:'shrink', breakLine:true });
    });
  }

  return {
    drawClosingEditorialActions
  };
}

module.exports = {
  createClosingEditorialActionsRenderer
};
