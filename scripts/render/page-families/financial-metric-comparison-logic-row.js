function createMetricComparisonLogicRow(ctx = {}) {
  const C = ctx.colors();

  function drawMetricComparisonLogicRow(slide, s) {
    const foot = ctx.publicSlideNote(s.note);
    const logic = s.businessLogic || s.business_logic || s.diagnosticChain || s.diagnostic_chain;
    if (logic && typeof logic === 'object') {
      const logicItems = [
        { label:'现状', text:logic.currentState || logic.current_state || logic.problem || '' },
        { label:'原因', text:logic.cause || logic.root_cause || logic.driver || '' },
        { label:'动作', text:logic.action || logic.operating_action || logic.response || '' },
        { label:'衡量', text:logic.metric || logic.measure || logic.kpi || logic.expected_result || '' }
      ].filter(item => item.text);
      if (logicItems.length >= 2) {
        ctx.addHairline(slide, 0.94, 6.10, 10.90, C.line, 12, 0.55);
        const slotW = 10.64 / logicItems.length;
        logicItems.forEach((item, i) => {
          const x = 1.00 + i * slotW;
          const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
          ctx.addLabel(slide, item.label, { x, y:6.34, w:0.46, h:0.10, fontSize:5.8, color:accent, charSpace:0 });
          ctx.addText(slide, ctx.compactEvidenceCaption(item.text, 22), { x:x+0.54, y:6.30, w:slotW-0.66, h:0.14, fontSize:7.8, color:C.body, fit:'shrink' });
        });
      }
    } else if (foot) {
      ctx.addHairline(slide, 0.94, 6.28, 10.90, C.line, 12, 0.55);
      ctx.addLabel(slide, '管理信号', { x:0.96, y:6.54, w:1.52, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
      ctx.addText(slide, foot, { x:2.52, y:6.50, w:7.75, h:0.15, fontSize:8.4, color:C.body, fit:'shrink' });
    }
  }

  return {
    drawMetricComparisonLogicRow
  };
}

module.exports = {
  createMetricComparisonLogicRow
};
