function createReportExecutivePanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    copyFallback
  } = ctx;

  function drawExecutiveReadPanel(slide, plan, s, summary) {
    addRect(slide, 0.92, 2.08, 2.78, 4.16, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'EXECUTIVE READ', { x:1.22, y:2.44, w:1.28, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || copyFallback(plan, 'reportBoardCoreTitle'), { x:1.22, y:2.92, w:1.82, h:0.32, fontSize:14.6, bold:true, color:C.white, fit:'shrink' });
    addText(slide, summary, { x:1.22, y:3.62, w:1.86, h:0.78, fontSize:8.4, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addHairline(slide, 1.22, 4.84, 0.82, C.accent, 0, 0.62);
    addText(slide, s.decision || copyFallback(plan, 'reportBoardDecision'), { x:1.22, y:5.20, w:1.82, h:0.28, fontSize:7.6, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true });
  }

  return {
    drawExecutiveReadPanel
  };
}

module.exports = {
  createReportExecutivePanel
};
