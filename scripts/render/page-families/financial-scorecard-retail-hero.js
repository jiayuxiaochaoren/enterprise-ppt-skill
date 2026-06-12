function createRetailLoyaltyHeroRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText
  } = ctx;

  function valueWithUnit(metric = {}) {
    const value = metric.value == null || metric.value === '' ? '—' : String(metric.value);
    const unit = String(metric.unit || '').trim();
    if (!unit || value.includes(unit)) return value;
    return `${value}${unit}`;
  }

  function drawRetailLoyaltyHero(slide, repurchase, hero) {
    const value = repurchase.value == null || repurchase.value === '' ? '—' : String(repurchase.value);
    const unit = String(repurchase.unit || '').trim();
    const compactValue = valueWithUnit(repurchase);
    const splitUnit = unit && !value.includes(unit) && value.length <= 4;
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, '复购风险信号', { x:hero.x+0.28, y:hero.y+0.30, w:1.16, h:0.10, fontSize:6.1, color:C.accent, charSpace:0 });
    addText(slide, repurchase.label || '复购率', { x:hero.x+0.28, y:hero.y+0.76, w:1.34, h:0.16, fontSize:9.3, bold:true, color:'CBD5E1', fit:'shrink', valign:'mid' });
    if (splitUnit) {
      addText(slide, value, { x:hero.x+0.26, y:hero.y+1.10, w:0.88, h:0.62, fontSize:30, bold:true, color:C.white, fit:'shrink', valign:'mid' });
      addText(slide, unit, { x:hero.x+1.04, y:hero.y+1.40, w:0.28, h:0.14, fontSize:7.8, bold:true, color:C.white, fit:'shrink', valign:'mid' });
    } else {
      addNumber(slide, compactValue, { x:hero.x+0.26, y:hero.y+1.20, w:1.32, h:0.42, fontSize:28, color:C.white, fit:'shrink' });
    }
    addRect(slide, hero.x+1.36, hero.y+1.34, 0.88, 0.20, C.accent, C.accent, { fill:{color:C.accent, transparency:10}, line:{color:C.accent, transparency:100} });
    addText(slide, repurchase.note || '重点', { x:hero.x+1.38, y:hero.y+1.34, w:0.84, h:0.20, fontSize:6.0, bold:true, color:C.white, align:'center', valign:'mid', fit:'shrink', margin:0 });
    addHairline(slide, hero.x+0.28, hero.y+2.08, 0.86, C.accent, 0, 0.54);
    addText(slide, '高频顾虑会直接抬高复购门槛，需要回到履约、商品和门店动作处理。', { x:hero.x+0.28, y:hero.y+2.34, w:1.72, h:0.34, fontSize:7.0, color:C.captionOnImage, fit:'shrink', breakLine:true, valign:'mid' });
  }

  return {
    drawRetailLoyaltyHero
  };
}

module.exports = {
  createRetailLoyaltyHeroRenderer
};
