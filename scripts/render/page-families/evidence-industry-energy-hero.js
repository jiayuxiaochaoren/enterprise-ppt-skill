function createEnergySiteHeroRenderer(ctx = {}) {
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

  function drawEnergySiteHero(slide, hero, lead, image) {
    if (image) addPhotoPanel(slide, image, hero.x, hero.y, hero.w, hero.h, { tone:'light', transparency:84, stroke:C.line, strokeTransparency:20, fit:'cover' });
    else genericShowcaseField(slide, hero.x, hero.y, hero.w, hero.h, 'SITE EVIDENCE');
    addRect(slide, hero.x, hero.y+hero.h-0.72, hero.w, 0.72, C.ink, C.ink, { fill:{color:C.ink, transparency:14}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY SITE', { x:hero.x+0.28, y:hero.y+hero.h-0.48, w:1.08, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, itemTitle(lead, '站端资产'), { x:hero.x+1.56, y:hero.y+hero.h-0.54, w:1.74, h:0.15, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(lead), { x:hero.x+3.54, y:hero.y+hero.h-0.52, w:2.04, h:0.14, fontSize:7.0, color:'CBD5E1', fit:'shrink' });
  }

  return {
    drawEnergySiteHero
  };
}

module.exports = {
  createEnergySiteHeroRenderer
};
