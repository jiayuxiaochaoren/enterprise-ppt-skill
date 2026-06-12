function createBeautyProductHeroPositioning(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function drawProductHeroPositioning(slide, s, product, side) {
    addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'POSITIONING', { x:side.x+0.32, y:side.y+0.36, w:1.12, h:0.11, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, itemTitle(product, s.productName || '核心产品'), { x:side.x+0.32, y:side.y+0.84, w:2.58, h:0.26, fontSize:17.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(product, s.productBody || '把产品对象、关键卖点和适用场景分层呈现。'), { x:side.x+0.32, y:side.y+1.34, w:2.70, h:0.52, fontSize:8.2, color:C.captionOnImage, fit:'shrink', breakLine:true });

    const metrics = (s.metrics || product.metrics || []).slice(0,2);
    metrics.forEach((m,i)=>{
      const x = side.x + 0.32 + i*1.48;
      addNumber(slide, m.value || m.title || '-', { x, y:side.y+2.26, w:1.12, h:0.28, fontSize:22, color:i===0?C.accent:C.cyan, fit:'shrink' });
      addText(slide, m.label || m.body || '', { x, y:side.y+2.78, w:1.18, h:0.12, fontSize:7.0, color:'A8B3C3', fit:'shrink' });
    });
    addHairline(slide, side.x+0.32, side.y+3.24, 0.82, C.accent, 0, 0.62);
    addText(slide, s.tagline || product.tagline || '单品页先让对象成立，再解释为什么值得买/用/接入。', { x:side.x+0.32, y:side.y+3.48, w:2.62, h:0.14, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  }

  return {
    drawProductHeroPositioning
  };
}

module.exports = {
  createBeautyProductHeroPositioning
};
