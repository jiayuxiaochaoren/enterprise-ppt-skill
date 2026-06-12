function createRiskMatrixQueueRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addText
  } = ctx;

  function drawRiskMatrixQueue(slide, rows, lineColor, darkRisk) {
    addLabel(slide, '缓解队列', { x:8.04, y:2.18, w:1.36, h:0.10, fontSize:6.4, color:C.accent, charSpace:0 });
    rows.slice(0,4).forEach((r,i)=>{
      const y = 2.58 + i*0.70;
      const color = r[1] === '高' ? C.risk : (r[1] === '低' ? C.cyan : C.accent);
      addText(slide, String(i+1).padStart(2,'0'), { x:8.04, y:y+0.05, w:0.32, h:0.10, fontSize:6.8, bold:true, color });
      addText(slide, r[0], { x:8.54, y:y, w:1.54, h:0.14, fontSize:8.8, bold:true, color:darkRisk ? C.white : C.text, fit:'shrink' });
      addText(slide, r[2] || '明确责任人与处置节奏。', { x:10.16, y:y, w:1.42, h:0.13, fontSize:7.2, color:darkRisk ? (C.darkMuted || '94A3B8') : C.body, fit:'shrink' });
      addHairline(slide, 8.04, y+0.44, 3.64, lineColor, darkRisk ? 54 : 16, 0.38);
    });
  }

  return {
    drawRiskMatrixQueue
  };
}

module.exports = {
  createRiskMatrixQueueRenderer
};
