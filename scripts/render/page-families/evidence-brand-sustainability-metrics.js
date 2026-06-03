function createSustainabilityMetricsReadout(ctx = {}) {
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;
  const C = ctx.colors();

  function drawMetricsReadout(slide, s, metrics) {
    const logic = s.businessLogic || {};
    const board = { x:0.92, y:2.08, w:10.72, h:3.78 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{ color:panelFill(), transparency:0 },
      line:{ color:C.line, transparency:14, width:0.48 }
    });
    addRect(slide, board.x, board.y, 0.07, board.h, C.accent, C.accent, { line:{ color:C.accent, transparency:100 } });
    const gap = 0.18;
    const cardW = (board.w - 0.74 - gap * 2) / 3;
    metrics.forEach((m, i) => {
      const x = board.x + 0.38 + i * (cardW + gap);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, x, board.y+0.48, cardW, 2.72, i === 0 ? C.ink : C.panelAlt || C.softBlue, i === 0 ? accent : C.line, {
        fill:{ color:i === 0 ? C.ink : (C.panelAlt || C.softBlue), transparency:i === 0 ? 0 : 10 },
        line:{ color:i === 0 ? accent : C.line, transparency:i === 0 ? 22 : 100, width:0.42 }
      });
      addLabel(slide, i === 0 ? 'PRIMARY KPI' : `SUPPORT 0${i}`, {
        x:x+0.22, y:board.y+0.78, w:1.12, h:0.10, fontSize:5.8, color:accent, charSpace:0.8
      });
      addText(slide, m.label || `指标 ${i + 1}`, {
        x:x+0.22, y:board.y+1.14, w:cardW-0.44, h:0.16, fontSize:9.4, bold:true, color:i === 0 ? C.white : C.text, fit:'shrink'
      });
      addNumber(slide, m.value || '—', {
        x:x+0.20, y:board.y+1.62, w:cardW-0.40, h:0.54, fontSize:i === 0 ? 38 : 30, color:accent, fit:'shrink'
      });
      addText(slide, m.note || '', {
        x:x+0.24, y:board.y+2.58, w:cardW-0.50, h:0.16, fontSize:8.0, color:i === 0 ? C.captionOnImage : C.body, fit:'shrink'
      });
    });
    const readout = [
      ['现状', logic.currentState || 'Product sustainability claims need concrete evidence.'],
      ['原因', logic.cause || 'Refill and container specifications are attached to the ULTIMUNE lineup.'],
      ['动作', logic.action || 'Keep sustainability proof inside the product evidence system.']
    ];
    addHairline(slide, 0.94, 6.08, 10.84, C.line, 14, 0.44);
    readout.forEach((row, i) => {
      const x = 1.00 + i * 3.38;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addText(slide, row[0], { x, y:6.24, w:0.64, h:0.15, fontSize:8.8, bold:true, color:accent, fit:false });
      addText(slide, row[1], {
        x:x+0.74, y:6.22, w:2.36, h:0.36,
        fontSize:7.6, color:C.body, fit:false, breakLine:true, valign:'top'
      });
    });
  }

  return {
    drawMetricsReadout
  };
}

module.exports = {
  createSustainabilityMetricsReadout
};
