function createRiskMatrixGateRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawRiskMatrixGate(slide, plan, s, gate, darkRisk) {
    const strongRiskGate = plan.industry === 'manufacturing-operations';
    const gateFill = strongRiskGate ? C.accent : (darkRisk ? (C.darkPanel || C.ink) : C.ink);
    const gateRail = strongRiskGate ? C.cyan : C.accent;
    addRect(slide, gate.x, gate.y, gate.w, gate.h, gateFill, gateFill, {
      fill:{color:gateFill, transparency:0},
      line:{color:gateFill, transparency:100}
    });
    addRect(slide, gate.x, gate.y, 0.08, gate.h, gateRail, gateRail, { fill:{color:gateRail, transparency:0}, line:{color:gateRail, transparency:100} });
    addLabel(slide, plan.industry === 'manufacturing-operations' ? '外发门禁' : 'CONTROL GATE', {
      x:gate.x+0.30, y:gate.y+0.34, w:1.08, h:0.10, fontSize:6.4, color:gateRail, charSpace:plan.industry === 'manufacturing-operations' ? 0 : 0.72
    });
    addText(slide, s.coreTitle || '先判风险优先级', {
      x:gate.x+0.30, y:gate.y+0.86, w:1.74, h:0.34, fontSize:15.2, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.coreBody || s.claim || '证书、授权、联系方式和公开边界先通过门禁，再进入外发展示。', {
      x:gate.x+0.30, y:gate.y+1.52, w:1.82, h:0.72, fontSize:8.2, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, gate.x+0.30, gate.y+2.72, 0.82, gateRail, 0, 0.66);
    addText(slide, 'CERT · AUTH · CONTACT', { x:gate.x+0.30, y:gate.y+3.06, w:1.56, h:0.10, fontSize:6.0, color:strongRiskGate ? C.darkText : (C.darkMuted || 'A8B3C3'), fit:'shrink' });
  }

  return {
    drawRiskMatrixGate
  };
}

module.exports = {
  createRiskMatrixGateRenderer
};
