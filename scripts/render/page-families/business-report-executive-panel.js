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
    const useLight = plan.palette === 'energy-ops-clean' || plan.industry === 'energy-utility' || s.panelTone === 'light';
    const fill = useLight ? (C.panel || 'FFFFFF') : C.ink;
    const line = useLight ? (C.line || 'DCE7F2') : C.ink;
    const text = useLight ? C.text : C.white;
    const body = useLight ? C.body : C.captionOnImage;
    addRect(slide, 0.92, 2.08, 2.78, 4.16, fill, line, {
      fill:{color:fill, transparency:0},
      line:{color:line, transparency:useLight ? 18 : 100, width:useLight ? 0.30 : 0}
    });
    addLabel(slide, '管理判断', { x:1.22, y:2.44, w:1.28, h:0.12, fontSize:6.8, color:C.accent, charSpace:0 });
    addText(slide, s.coreTitle || copyFallback(plan, 'reportBoardCoreTitle'), { x:1.22, y:2.92, w:1.82, h:0.32, fontSize:14.2, bold:true, color:text, fit:'shrink' });
    addText(slide, summary, { x:1.22, y:3.60, w:1.86, h:0.82, fontSize:8.3, color:body, fit:'shrink', breakLine:true, valign:'mid' });
    addHairline(slide, 1.22, 4.82, 0.82, C.accent, 0, 0.48);
    addText(slide, s.decision || copyFallback(plan, 'reportBoardDecision'), { x:1.22, y:5.16, w:1.82, h:0.32, fontSize:7.4, color:useLight ? C.muted : (C.darkMuted || 'A8B3C3'), fit:'shrink', breakLine:true, valign:'mid' });
  }

  return {
    drawExecutiveReadPanel
  };
}

module.exports = {
  createReportExecutivePanel
};
