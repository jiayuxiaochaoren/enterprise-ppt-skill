function createSaasPrototypeHeroRenderer(ctx = {}) {
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

  function drawSaasPrototypeHero(slide, images, items, hero) {
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    if (images[0]) addPhotoPanel(slide, images[0], hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.70, {
      tone:'light', transparency:100, stroke:'334155', strokeTransparency:44, fit:'cover'
    });
    else genericShowcaseField(slide, hero.x+0.20, hero.y+0.22, hero.w-0.40, 2.70, 'PRIMARY SCREEN');
    const lead = items[0] || {
      title:'核心工作台',
      body:'让核心对象、入口和下一步动作在同一屏成立。'
    };
    addLabel(slide, 'PRIMARY SCREEN', {
      x:hero.x+0.30, y:hero.y+3.18, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8
    });
    addText(slide, itemTitle(lead, '核心工作台'), {
      x:hero.x+1.78, y:hero.y+3.12, w:1.56, h:0.15, fontSize:10.2, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, itemBody(lead), {
      x:hero.x+3.50, y:hero.y+3.10, w:1.52, h:0.16, fontSize:7.0, color:'CBD5E1', fit:'shrink'
    });
  }

  return {
    drawSaasPrototypeHero
  };
}

module.exports = {
  createSaasPrototypeHeroRenderer
};
