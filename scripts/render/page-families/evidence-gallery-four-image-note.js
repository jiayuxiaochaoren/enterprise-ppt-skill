function createFourImageEvidenceNote(ctx = {}) {
  const { addText } = ctx;
  const C = ctx.colors();

  function drawEvidenceBoardNote(slide, s, text) {
    addText(slide, s.note || text, { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  }

  return {
    drawEvidenceBoardNote
  };
}

module.exports = {
  createFourImageEvidenceNote
};
