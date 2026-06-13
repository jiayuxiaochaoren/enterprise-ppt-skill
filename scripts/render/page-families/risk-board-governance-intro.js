function createRiskBoardGovernanceIntro(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawGovernanceEditorialCore(slide, s, intro) {
    addRect(slide, intro.x, intro.y, intro.w, intro.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, '治理重点', {
      x:intro.x+0.28, y:intro.y+0.34, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0
    });
    addText(slide, s.coreTitle || '责任可追踪', {
      x:intro.x+0.28, y:intro.y+0.84, w:1.42, h:0.22, fontSize:13.4, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.coreBody || s.note || '每个治理动作都需要责任人、节奏、记录和决策去向。', {
      x:intro.x+0.28, y:intro.y+1.46, w:1.50, h:0.58,
      fontSize:8.0, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, intro.x+0.28, intro.y+2.56, 0.74, C.accent, 0, 0.58);
    addLabel(slide, '责任 · 节奏 · 记录 · 决策', {
      x:intro.x+0.28, y:intro.y+3.14, w:1.56, h:0.16,
      fontSize:5.5, color:'64748B', charSpace:0, fit:'shrink'
    });
  }

  return {
    drawGovernanceEditorialCore
  };
}

module.exports = {
  createRiskBoardGovernanceIntro
};
