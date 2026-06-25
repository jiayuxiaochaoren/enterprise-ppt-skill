function createReportExecutivePanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    copyFallback
  } = ctx;

  function isGovernmentPolicyContext(plan = {}, s = {}) {
    return plan.industry === 'government-public-sector'
      && /policy-context-board/i.test(String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || ''));
  }

  function isLifestyleOperationsBoard(plan = {}, s = {}) {
    return plan.industry === 'lifestyle-food-tourism-fashion'
      && /operating model|report board/i.test(String(s.label || ''));
  }

  function executivePanelLabel(plan = {}, s = {}) {
    if (isGovernmentPolicyContext(plan, s)) return '政策判断';
    if (isLifestyleOperationsBoard(plan, s)) return '现场判断';
    if (plan.industry === 'general-operations') return '经营判断';
    return '管理判断';
  }

  function drawExecutiveReadPanel(slide, plan, s, summary, opts = {}) {
    const governmentPolicyContext = isGovernmentPolicyContext(plan, s);
    const lifestyleOperationsBoard = isLifestyleOperationsBoard(plan, s);
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
    addLabel(slide, executivePanelLabel(plan, s), { x:box.x+0.30, y:labelY, w:1.28, h:0.12, fontSize:6.8, color:C.accent, charSpace:0 });
    addText(slide, s.coreTitle || copyFallback(plan, 'reportBoardCoreTitle'), {
      x:box.x+0.30, y:coreY, w:1.82, h:0.32,
      fontSize:lifestyleOperationsBoard ? 13.8 : 14.2, bold:true, color:text, fit:'shrink'
    });
    addText(slide, summary, { x:box.x+0.30, y:summaryY, w:1.86, h:summaryH, fontSize:8.3, color:body, fit:'shrink', breakLine:true, valign:'mid' });
    const decision = s.decision || (governmentPolicyContext ? (s.sourceNote || s.source_note || '') : '');
    if (decision) {
      addHairline(slide, box.x+0.30, hairY, 0.82, C.accent, 0, 0.48);
      if (governmentPolicyContext) {
        addRect(slide, box.x+0.30, decisionY-0.02, 0.78, 0.18, C.accent, C.accent, {
          fill:{ color:C.accent, transparency:18 },
          line:{ color:C.accent, transparency:100 }
        });
        addLabel(slide, '政策来源', {
          x:box.x+0.40, y:decisionY+0.04, w:0.58, h:0.06,
          fontSize:4.8, color:C.accent, charSpace:0
        });
        addText(slide, decision, {
          x:box.x+0.30, y:decisionY+0.22, w:1.82, h:0.26,
          fontSize:6.8, color:useLight ? C.muted : (C.darkMuted || 'A8B3C3'),
          fit:'shrink', breakLine:true, valign:'mid'
        });
        return;
      }
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
