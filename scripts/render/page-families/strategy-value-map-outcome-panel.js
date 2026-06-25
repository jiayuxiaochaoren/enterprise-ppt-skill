function createStrategyValueOutcomePanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawStrategyValueOutcomePanel(slide, plan, s, outcomes = [], right) {
    const variant = String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '');
    const governmentGovernanceModel = plan && plan.industry === 'government-public-sector'
      && /governance-operating-model|operating-model|治理模型/i.test(variant);
    const lifestyleSceneConversion = plan && plan.industry === 'lifestyle-food-tourism-fashion'
      && /scene-conversion-board/i.test(variant);
    const label = governmentGovernanceModel
      ? '推进结果'
      : (lifestyleSceneConversion ? '经营结果' : 'OUTCOME');
    const title = s.rightTitle || (governmentGovernanceModel
      ? '治理结果'
      : (lifestyleSceneConversion ? '复游信号' : '结果信号'));
    addLabel(slide, label, {
      x:right.x+0.28, y:right.y+0.34, w:0.92, h:0.10,
      fontSize:5.8, color:C.accent, charSpace:label === 'OUTCOME' ? 0.8 : 0
    });
    addText(slide, title, { x:right.x+0.28, y:right.y+0.70, w:1.64, h:0.18, fontSize:12.6, bold:true, color:C.text, fit:'shrink' });
    (outcomes || []).slice(0,3).forEach((it,i)=>{
      const y = right.y + 1.22 + i*0.74;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addRect(slide, right.x+0.28, y, 2.20, 0.46, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i===0?C.accent:C.line, transparency:i===0?20:18, width:0.42}
      });
      slide.addShape('ellipse', { x:right.x+0.50, y:y+0.18, w:0.08, h:0.08, fill:{color:accent}, line:{color:accent, transparency:100} });
      addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:right.x+0.72, y:y+0.13, w:1.50, h:0.13, fontSize:8.5, bold:true, color:C.text, fit:'shrink' });
    });
  }

  return {
    drawStrategyValueOutcomePanel
  };
}

module.exports = {
  createStrategyValueOutcomePanel
};
