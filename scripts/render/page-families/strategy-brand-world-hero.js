function createBrandWorldHeroRenderer(ctx = {}) {
  const C = ctx.colors();

  function metricLabel(metric = {}) {
    if (typeof metric === 'string') return metric;
    return [metric.value, metric.label || metric.title].filter(Boolean).join(' ').trim();
  }

  function drawStructuredBrandHero(slide, hero, s, drivers = [], metrics = []) {
    const primary = metrics[0] || drivers[0] || {};
    const secondary = (metrics.length ? metrics.slice(1, 3) : drivers.slice(1, 3)).filter(Boolean);
    ctx.addLabel(slide, '经营主线', { x:hero.x + 0.32, y:hero.y + 0.46, w:0.96, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
    ctx.addText(slide, s.brandPromise || ctx.itemTitle(primary, '增长质量'), {
      x:hero.x + 0.32, y:hero.y + 0.88, w:2.80, h:0.32,
      fontSize:16.2, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    const value = metricLabel(primary);
    if (value) {
      ctx.addText(slide, value, {
        x:hero.x + 0.32, y:hero.y + 1.56, w:2.42, h:0.32,
        fontSize:20.0, bold:true, color:C.white, fit:'shrink'
      });
    }
    ctx.addText(slide, s.note || '把品牌主张、渠道动作和复购质量放在同一张经营看板里判断。', {
      x:hero.x + 0.34, y:hero.y + 2.34, w:3.36, h:0.46,
      fontSize:8.6, color:C.captionOnImage, breakLine:true, fit:'shrink'
    });
    secondary.forEach((item, i) => {
      const x = hero.x + 0.34 + i * 1.76;
      ctx.addRect(slide, x, hero.y + 3.24, 1.44, 0.42, i === 0 ? C.accent : C.cyan, i === 0 ? C.accent : C.cyan, {
        fill:{ color:i === 0 ? C.accent : C.cyan, transparency:12 },
        line:{ color:i === 0 ? C.accent : C.cyan, transparency:100 }
      });
      ctx.addText(slide, metricLabel(item) || ctx.itemTitle(item, i === 0 ? '会员质量' : '渠道证据'), {
        x:x + 0.12, y:hero.y + 3.37, w:1.20, h:0.11,
        fontSize:6.8, bold:true, color:C.white, fit:'shrink', align:'center'
      });
    });
  }

  function drawBrandWorldHero(slide, hero, s, drivers, image, metrics = []) {
    ctx.addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{ color:C.ink, transparency:0 }, line:{ color:C.ink, transparency:100 } });
    if (image) ctx.addPhotoPanel(slide, image, hero.x + 0.18, hero.y + 0.18, hero.w - 0.36, 2.70, { tone:'light', transparency:92, stroke:'FFFFFF', strokeTransparency:70, fit:'cover' });
    else drawStructuredBrandHero(slide, hero, s, drivers, metrics);
    if (image) {
      ctx.addLabel(slide, 'BRAND WORLD', { x:hero.x + 0.30, y:hero.y + 3.16, w:1.16, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.7 });
      ctx.addText(slide, s.brandPromise || ctx.itemTitle(drivers[0], '产品承诺'), { x:hero.x + 0.30, y:hero.y + 3.46, w:1.70, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
      ctx.addText(slide, s.note || '视觉主张必须能连接到会员、渠道或连带购买。', {
        x:hero.x + 2.34, y:hero.y + 3.36, w:1.86, h:0.30,
        fontSize:8.0, color:C.captionOnImage, breakLine:true, fit:'shrink'
      });
    }
  }

  return {
    drawBrandWorldHero
  };
}

module.exports = {
  createBrandWorldHeroRenderer
};
