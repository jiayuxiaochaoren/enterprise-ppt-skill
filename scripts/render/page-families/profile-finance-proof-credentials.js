function createFinanceProfileCredentialsRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawFinanceProfileCredentials(slide, plan, s, panel) {
    addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:22},
      line:{color:'334155', transparency:54, width:0.52}
    });
    addLabel(slide, 'MANAGER CREDENTIALS', {
      x:panel.x+0.34, y:panel.y+0.38, w:1.86, h:0.11, fontSize:6.2, color:C.accent, charSpace:0.85
    });
    addText(slide, s.company || plan.organization || '产业投资与投后管理团队', {
      x:panel.x+0.34, y:panel.y+0.88, w:2.74, h:0.42, fontSize:20, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.description || s.body || '以投资纪律、产业研究、投后经营和退出管理支撑组合决策。', {
      x:panel.x+0.34, y:panel.y+1.70, w:2.86, h:0.78, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink'
    });
    addHairline(slide, panel.x+0.34, panel.y+2.92, 0.86, C.accent, 0, 0.68);
    addText(slide, s.tagline || '以历史业绩、项目经验和复盘机制建立长期信任。', {
      x:panel.x+0.34, y:panel.y+3.26, w:2.74, h:0.18, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink'
    });
  }

  return {
    drawFinanceProfileCredentials
  };
}

module.exports = {
  createFinanceProfileCredentialsRenderer
};
