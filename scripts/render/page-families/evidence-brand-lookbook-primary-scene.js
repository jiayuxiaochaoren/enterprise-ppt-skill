function createRetailLookbookPrimaryScene(ctx = {}) {
  const {
    addLabel,
    addLightBreathingCircle,
    addPhotoPanel,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;
  const C = ctx.colors();

  function drawPrimaryScene(slide, images, storyItems) {
    const hero = { x:0.92, y:2.04, w:5.38, h:4.10 };
    if (images[0]) {
      addPhotoPanel(slide, images[0], hero.x, hero.y, hero.w, hero.h, {
        tone:'dark', transparency:100, stroke:'E8DED8', strokeTransparency:12, fit:'cover'
      });
    } else {
      addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, {
        fill:{color:C.ink, transparency:0},
        line:{color:C.ink, transparency:100}
      });
      addLightBreathingCircle(slide, hero.x+3.20, hero.y+0.40, 1.92, C.softBlue, 36);
    }
    addRect(slide, hero.x, hero.y+hero.h-1.02, hero.w, 1.02, C.ink, C.ink, {
      fill:{color:C.ink, transparency:10},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, 'PRIMARY SCENE', {
      x:hero.x+0.30, y:hero.y+hero.h-0.70, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8
    });

    const lead = storyItems[0] || {
      title:'核心产品故事',
      body:'用主图建立品牌语境，再用细节图和文案解释购买理由。'
    };
    addText(slide, itemTitle(lead, '核心产品故事'), {
      x:hero.x+0.30, y:hero.y+hero.h-0.40, w:1.92, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, itemBody(lead), {
      x:hero.x+2.56, y:hero.y+hero.h-0.42, w:2.12, h:0.13, fontSize:6.8, color:'CBD5E1', fit:'shrink'
    });
  }

  return {
    drawPrimaryScene
  };
}

module.exports = {
  createRetailLookbookPrimaryScene
};
