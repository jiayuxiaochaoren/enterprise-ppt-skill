function createFinancialResultsChartCards(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption,
    panelFill
  } = ctx;

  function drawFinancialResultsChartCards(slide, metrics = []) {
    const charts = [
      { x:0.92, y:2.08, w:2.78, h:1.58, color:C.accent },
      { x:4.02, y:2.08, w:2.78, h:1.58, color:C.cyan },
      { x:0.92, y:4.18, w:5.88, h:1.68, color:C.violet }
    ];
    charts.forEach((box, i) => {
      const m = metrics[i] || {};
      addRect(slide, box.x, box.y, box.w, box.h, panelFill(), i === 0 ? box.color : C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i === 0 ? box.color : C.line, transparency:i === 0 ? 18 : 16, width:0.42}
      });
      addLabel(slide, `CHART 0${i + 1}`, { x:box.x+0.22, y:box.y+0.22, w:0.94, h:0.10, fontSize:6.8, color:box.color, charSpace:0.7 });
      addText(slide, m.label || `经营读数 ${i+1}`, { x:box.x+0.22, y:box.y+0.52, w:1.28, h:0.13, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '-', { x:box.x+box.w-1.06, y:box.y+0.48, w:0.70, h:0.15, fontSize:10.6, color:box.color, align:'right', fit:'shrink' });
      const baseY = box.y + box.h - 0.34;
      const values = i === 0 ? [0.42, 0.62, 0.54, 0.78] : (i === 1 ? [0.70, 0.58, 0.52, 0.46] : [0.32, 0.48, 0.60, 0.72, 0.84]);
      values.forEach((v, j) => {
        const bw = box.w > 3 ? 0.52 : 0.30;
        const gap = box.w > 3 ? 0.26 : 0.20;
        const x = box.x + 0.34 + j * (bw + gap);
        const h = 0.72 * v;
        addRect(slide, x, baseY - h, bw, h, box.color, box.color, { fill:{color:box.color, transparency:j === values.length - 1 ? 0 : 28}, line:{color:box.color, transparency:100} });
      });
      addText(slide, compactEvidenceCaption(m.note || '', 28), { x:box.x+0.22, y:box.y+box.h-0.13, w:box.w-0.44, h:0.10, fontSize:6.8, color:C.muted, fit:'shrink' });
    });
  }

  return {
    drawFinancialResultsChartCards
  };
}

module.exports = {
  createFinancialResultsChartCards
};
