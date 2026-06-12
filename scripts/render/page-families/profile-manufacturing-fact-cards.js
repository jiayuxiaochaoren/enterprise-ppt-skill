function createManufacturingFactCards(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawManufacturingFactCards(slide, proofCards, opts = {}) {
    const baseY = opts.y || 2.18;
    proofCards.slice(0,4).forEach((m, i) => {
      const x = 4.34 + (i % 2) * 1.94;
      const y = baseY + Math.floor(i / 2) * 1.34;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
      const value = m.value || m.title || String(i + 1).padStart(2, '0');
      const label = m.label || m.body || m.note || '';
      addRect(slide, x, y, 1.58, 1.08, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:C.line, transparency:16, width:0.42}
      });
      addRect(slide, x, y, 1.58, 0.035, accent, accent, { line:{color:accent, transparency:100} });
      addLabel(slide, `事实 ${String(i+1).padStart(2, '0')}`, { x:x+0.20, y:y+0.24, w:0.66, h:0.09, fontSize:5.2, color:accent, charSpace:0 });
      addNumber(slide, value, { x:x+0.20, y:y+0.48, w:1.10, h:0.24, fontSize:20.5, color:accent, fit:'shrink' });
      addText(slide, label, { x:x+0.22, y:y+0.84, w:1.10, h:0.12, fontSize:7.0, color:C.body, fit:'shrink' });
    });
  }

  return {
    drawManufacturingFactCards
  };
}

module.exports = {
  createManufacturingFactCards
};
