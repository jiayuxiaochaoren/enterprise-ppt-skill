function createBrandWorldHeroRenderer(ctx = {}) {
  const C = ctx.colors();

  function drawBrandWorldHero(slide, hero, s, drivers, image) {
    ctx.addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{ color:C.ink, transparency:0 }, line:{ color:C.ink, transparency:100 } });
    if (image) ctx.addPhotoPanel(slide, image, hero.x + 0.18, hero.y + 0.18, hero.w - 0.36, 2.70, { tone:'light', transparency:92, stroke:'FFFFFF', strokeTransparency:70, fit:'cover' });
    else ctx.genericShowcaseField(slide, hero.x + 0.18, hero.y + 0.18, hero.w - 0.36, 2.70, 'BRAND WORLD');
    ctx.addLabel(slide, 'BRAND WORLD', { x:hero.x + 0.30, y:hero.y + 3.16, w:1.16, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.7 });
    ctx.addText(slide, s.brandPromise || ctx.itemTitle(drivers[0], '产品承诺'), { x:hero.x + 0.30, y:hero.y + 3.46, w:1.70, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
    ctx.addText(slide, s.note || '视觉主张必须能连接到会员、渠道或连带购买。', {
      x:hero.x + 2.34, y:hero.y + 3.36, w:1.86, h:0.30,
      fontSize:8.0, color:C.captionOnImage, breakLine:true, fit:false
    });
  }

  return {
    drawBrandWorldHero
  };
}

module.exports = {
  createBrandWorldHeroRenderer
};
