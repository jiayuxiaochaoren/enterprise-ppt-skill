function createReportExecutivePanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    copyFallback
  } = ctx;

  function drawExecutiveReadPanel(slide, plan, s, summary, opts = {}) {
    const useLight = plan.palette === 'energy-ops-clean' || plan.industry === 'energy-utility' || s.panelTone === 'light';
    const fill = useLight ? (C.panel || 'FFFFFF') : C.ink;
    const line = useLight ? (C.line || 'DCE7F2') : C.ink;
    const text = useLight ? C.text : C.white;
    const body = useLight ? C.body : C.captionOnImage;
    const box = {
      x:opts.x == null ? 0.92 : opts.x,
      y:opts.y == null ? 2.08 : opts.y,
      w:opts.w == null ? 2.78 : opts.w,
      h:opts.h == null ? 4.16 : opts.h
    };
    const labelY = box.y + 0.36;
    const coreY = box.y + 0.82;
    const summaryY = box.y + 1.44;
    const hairY = box.y + box.h - 1.42;
    const decisionY = box.y + box.h - 1.08;
    const summaryH = Math.max(0.44, hairY - summaryY - 0.22);
    addRect(slide, box.x, box.y, box.w, box.h, fill, line, {
      fill:{color:fill, transparency:0},
      line:{color:line, transparency:useLight ? 18 : 100, width:useLight ? 0.30 : 0}
    });
    addLabel(slide, '管理判断', { x:box.x+0.30, y:labelY, w:1.28, h:0.12, fontSize:6.8, color:C.accent, charSpace:0 });
    addText(slide, s.coreTitle || copyFallback(plan, 'reportBoardCoreTitle'), { x:box.x+0.30, y:coreY, w:1.82, h:0.32, fontSize:14.2, bold:true, color:text, fit:'shrink' });
    addText(slide, summary, { x:box.x+0.30, y:summaryY, w:1.86, h:summaryH, fontSize:8.3, color:body, fit:'shrink', breakLine:true, valign:'mid' });
    const decision = s.decision || '';
    if (decision) {
      addHairline(slide, box.x+0.30, hairY, 0.82, C.accent, 0, 0.48);
      addText(slide, decision, { x:box.x+0.30, y:decisionY, w:1.82, h:0.32, fontSize:7.4, color:useLight ? C.muted : (C.darkMuted || 'A8B3C3'), fit:'shrink', breakLine:true, valign:'mid' });
    }
  }

  return {
    drawExecutiveReadPanel
  };
}

module.exports = {
  createReportExecutivePanel
};
