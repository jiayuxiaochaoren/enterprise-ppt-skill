function createQuarterlyMetricsTable(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption,
    panelFill
  } = ctx;

  function drawQuarterlyMetricsTable(slide, metrics, table) {
    addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.50}
    });
    addLabel(slide, 'REPORTED METRICS', {
      x:table.x+0.26, y:table.y+0.28, w:1.38, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8
    });
    metrics.forEach((m, i) => {
      const y = table.y + 0.76 + i * 0.70;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.risk));
      addText(slide, m.label || `指标 ${i+1}`, {
        x:table.x+0.26, y, w:1.12, h:0.13, fontSize:8.4, bold:true, color:C.text, fit:'shrink'
      });
      addNumber(slide, m.value || '-', {
        x:table.x+1.72, y:y-0.04, w:0.78, h:0.16, fontSize:11.6, color:accent, align:'right', fit:'shrink'
      });
      addText(slide, compactEvidenceCaption(m.note || '', 22), {
        x:table.x+2.76, y, w:0.92, h:0.12, fontSize:6.8, color:C.body, fit:'shrink'
      });
      addHairline(slide, table.x+0.26, y+0.38, 3.56, C.line, 18, 0.30);
    });
  }

  return {
    drawQuarterlyMetricsTable
  };
}

module.exports = {
  createQuarterlyMetricsTable
};
