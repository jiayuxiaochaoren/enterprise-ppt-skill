function createRiskBoardGovernanceIntro(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawGovernanceEditorialCore(slide, plan, s, intro) {
    addRect(slide, intro.x, intro.y, intro.w, intro.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    const isPeopleCulture = plan && plan.industry === 'people-culture-company';
    addLabel(slide, isPeopleCulture ? '招聘治理' : '治理重点', {
      x:intro.x+0.28, y:intro.y+0.34, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0
    });
    addText(slide, s.coreTitle || (isPeopleCulture ? '招聘表达与授权' : '责任可追踪'), {
      x:intro.x+0.28, y:intro.y+0.84, w:1.42, h:0.22, fontSize:13.4, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.coreBody || s.note || (isPeopleCulture
      ? '岗位口径、人物授权和联系人信息需要在外发前统一校准。'
      : '每个治理动作都需要责任人、节奏、记录和决策去向。'), {
      x:intro.x+0.28, y:intro.y+1.46, w:1.50, h:0.58,
      fontSize:8.0, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    if (isPeopleCulture) {
      [
        ['授权', C.accent, intro.x+0.28, intro.y+2.64],
        ['口径', C.cyan, intro.x+1.10, intro.y+2.64],
        ['联系人', C.violet, intro.x+0.28, intro.y+3.02],
        ['下一步', '94A3B8', intro.x+1.10, intro.y+3.02]
      ].forEach(item => {
        addRect(slide, item[2], item[3], 0.62, 0.22, item[1], item[1], {
          fill:{ color:item[1], transparency:22 },
          line:{ color:item[1], transparency:100 }
        });
        addLabel(slide, item[0], {
          x:item[2]+0.08, y:item[3]+0.07, w:0.46, h:0.06,
          fontSize:4.8, color:item[1], charSpace:0
        });
      });
    } else {
      addHairline(slide, intro.x+0.28, intro.y+2.56, 0.74, C.accent, 0, 0.58);
      addLabel(slide, '责任 · 节奏 · 记录 · 决策', {
        x:intro.x+0.28, y:intro.y+3.14, w:1.56, h:0.16,
        fontSize:5.5, color:'64748B', charSpace:0, fit:'shrink'
      });
    }
  }

  return {
    drawGovernanceEditorialCore
  };
}

module.exports = {
  createRiskBoardGovernanceIntro
};
