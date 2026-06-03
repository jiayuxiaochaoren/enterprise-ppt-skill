function createRetailLoyaltyHeroRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    formatMetricDelta
  } = ctx;

  function drawRetailLoyaltyHero(slide, repurchase, hero) {
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'LOYALTY SIGNAL', { x:hero.x+0.28, y:hero.y+0.30, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, repurchase.label || '复购率', { x:hero.x+0.28, y:hero.y+0.78, w:1.20, h:0.15, fontSize:8.6, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, repurchase.value || '—', { x:hero.x+0.26, y:hero.y+1.12, w:1.90, h:0.54, fontSize:36, color:C.white, fit:'shrink' });
    addText(slide, formatMetricDelta(repurchase.delta || repurchase.unit), { x:hero.x+0.30, y:hero.y+1.88, w:1.36, h:0.12, fontSize:6.8, bold:true, color:C.accent, fit:'shrink' });
    addHairline(slide, hero.x+0.28, hero.y+2.24, 0.86, C.accent, 0, 0.54);
    addText(slide, repurchase.note || '用会员触达、商品组合和门店体验解释复购变化。', { x:hero.x+0.28, y:hero.y+2.52, w:1.72, h:0.28, fontSize:6.8, color:C.captionOnImage, fit:'shrink', breakLine:true });
  }

  return {
    drawRetailLoyaltyHero
  };
}

module.exports = {
  createRetailLoyaltyHeroRenderer
};
