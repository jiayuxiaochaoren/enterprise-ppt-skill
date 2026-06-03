function createRiskBoardMaterialityMatrixPlot(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addRect,
    addText,
    itemTitle,
    panelFill
  } = ctx;

  function drawMaterialityMatrixPlot(slide, rows, axes, matrix) {
    addRect(slide, matrix.x, matrix.y, matrix.w, matrix.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.48}
    });
    addRect(slide, matrix.x+3.12, matrix.y+0.18, 2.76, 1.58, C.risk, C.risk, {
      fill:{color:C.risk, transparency:86},
      line:{color:C.risk, transparency:56, width:0.34}
    });
    addText(slide, '优先治理区', {
      x:matrix.x+4.28, y:matrix.y+0.36, w:0.94, h:0.12,
      fontSize:7.4, bold:true, color:C.risk, align:'center', fit:'shrink'
    });
    addHairline(slide, matrix.x+0.60, matrix.y+3.46, matrix.w-1.06, C.line, 10, 0.48);
    slide.addShape('line', {
      x:matrix.x+0.60, y:matrix.y+3.46, w:0, h:-3.00,
      line:{color:C.line, transparency:10, width:0.48}
    });
    addText(slide, axes.y || '利益相关方影响', {
      x:matrix.x+0.02, y:matrix.y+0.34, w:0.50, h:0.52,
      fontSize:6.8, color:C.muted, rotate:270, fit:'shrink'
    });
    addText(slide, axes.x || '业务影响', {
      x:matrix.x+4.52, y:matrix.y+3.66, w:0.92, h:0.11,
      fontSize:6.8, color:C.muted, fit:'shrink'
    });
    const positions = [
      [0.78, 0.82, C.risk],
      [0.60, 0.52, C.accent],
      [0.42, 0.58, C.cyan],
      [0.34, 0.30, C.violet],
      [0.70, 0.36, C.accent],
      [0.48, 0.78, C.cyan]
    ];
    rows.forEach((r, i) => {
      const [px, py, color] = positions[i] || positions[0];
      const x = matrix.x + 0.60 + px * (matrix.w - 1.32);
      const y = matrix.y + 3.46 - py * 2.90;
      slide.addShape('ellipse', {
        x:x-0.07, y:y-0.07, w:0.14, h:0.14,
        fill:{color},
        line:{color:'FFFFFF', transparency:0, width:0.40}
      });
      addText(slide, itemTitle(Array.isArray(r) ? { title:r[0] } : r, `议题 ${i+1}`), {
        x:x+0.12, y:y-0.08, w:1.02, h:0.10,
        fontSize:6.0, color:C.text, fit:'shrink'
      });
    });
  }

  return {
    drawMaterialityMatrixPlot
  };
}

module.exports = {
  createRiskBoardMaterialityMatrixPlot
};
