function createFinancePortfolioHeroRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addPhotoPanel,
    addRect,
    addText,
    genericShowcaseField,
    itemBody,
    itemTitle
  } = ctx;

  function drawFinancePortfolioHero(slide, images, items, hero) {
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    if (images[0]) addPhotoPanel(slide, images[0], hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.56, {
      tone:'light', transparency:100, stroke:'334155', strokeTransparency:44, fit:'cover'
    });
    else genericShowcaseField(slide, hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.56, 'DEAL EVIDENCE');
    const lead = items[0] || {
      title:'经营快照示意',
      body:'用项目材料说明执行质量、风险信号和下一步配置动作。'
    };
    addLabel(slide, 'PRIMARY DEAL MATERIAL', {
      x:hero.x+0.30, y:hero.y+3.06, w:1.58, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7
    });
    addText(slide, itemTitle(lead, '经营快照示意'), {
      x:hero.x+0.30, y:hero.y+3.36, w:1.60, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, itemBody(lead), {
      x:hero.x+2.22, y:hero.y+3.32, w:2.16, h:0.18, fontSize:8.8, color:'CBD5E1', fit:'shrink'
    });
  }

  return {
    drawFinancePortfolioHero
  };
}

module.exports = {
  createFinancePortfolioHeroRenderer
};
