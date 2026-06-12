function createRiskBoardMaterialityReadout(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption,
    itemBody,
    itemTitle
  } = ctx;

  function drawMaterialityTopicReadout(slide, rows, readout) {
    addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, 'TOPIC READOUT', {
      x:readout.x+0.28, y:readout.y+0.34, w:1.16, h:0.10,
      fontSize:5.8, color:C.accent, charSpace:0.8
    });
    rows.slice(0, 4).forEach((r, i) => {
      const y = readout.y + 0.92 + i * 0.62;
      const accent = i === 0 ? C.risk : (i === 1 ? C.accent : C.cyan);
      addNumber(slide, String(i + 1).padStart(2, '0'), {
        x:readout.x+0.28, y:y+0.02, w:0.28, h:0.09,
        fontSize:6.2, color:accent
      });
      addText(slide, itemTitle(Array.isArray(r) ? { title:r[0] } : r, `议题 ${i+1}`), {
        x:readout.x+0.70, y, w:1.04, h:0.13,
        fontSize:8.4, bold:true, color:C.white, fit:'shrink'
      });
      addText(slide, compactEvidenceCaption(Array.isArray(r) ? (r[2] || '') : itemBody(r), 24), {
        x:readout.x+1.88, y, w:1.48, h:0.12,
        fontSize:6.8, color:C.captionOnImage, fit:'shrink'
      });
    });
  }

  return {
    drawMaterialityTopicReadout
  };
}

module.exports = {
  createRiskBoardMaterialityReadout
};
