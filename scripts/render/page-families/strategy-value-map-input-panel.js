function createStrategyValueInputPanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addText
  } = ctx;

  function drawStrategyValueInputPanel(slide, plan, s, drivers = [], left) {
    const variant = String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '');
    const governmentGovernanceModel = plan && plan.industry === 'government-public-sector'
      && /governance-operating-model|operating-model|治理模型/i.test(variant);
    const lifestyleSceneConversion = plan && plan.industry === 'lifestyle-food-tourism-fashion'
      && /scene-conversion-board/i.test(variant);
    const label = governmentGovernanceModel
      ? '治理输入'
      : (lifestyleSceneConversion ? '场景输入' : 'INPUT');
    const title = s.leftTitle || (governmentGovernanceModel
      ? '治理线索'
      : (lifestyleSceneConversion ? '体验场景' : '关键输入'));
    addLabel(slide, label, {
      x:left.x+0.28, y:left.y+0.34, w:0.92, h:0.10,
      fontSize:5.8, color:C.accent, charSpace:label === 'INPUT' ? 0.8 : 0
    });
    addText(slide, title, { x:left.x+0.28, y:left.y+0.70, w:1.60, h:0.18, fontSize:12.6, bold:true, color:C.text, fit:'shrink' });
    (drivers || []).slice(0,3).forEach((it,i)=>{
      const y = left.y + 1.28 + i*0.66;
      addNumber(slide, String(i+1).padStart(2,'0'), { x:left.x+0.28, y:y-0.03, w:0.34, h:0.12, fontSize:7.2, color:i===0?C.accent:C.muted });
      addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:left.x+0.74, y:y-0.05, w:1.36, h:0.16, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      addHairline(slide, left.x+0.28, y+0.28, 1.74, C.line, 16, 0.38);
    });
  }

  return {
    drawStrategyValueInputPanel
  };
}

module.exports = {
  createStrategyValueInputPanel
};
