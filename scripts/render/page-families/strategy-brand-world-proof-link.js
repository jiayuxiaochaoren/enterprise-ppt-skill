function createBrandWorldProofLinkRenderer(ctx = {}) {
  const C = ctx.colors();

  function drawBrandWorldProofLink(slide) {
    ctx.addRect(slide, 0.92, 6.28, 8.76, 0.34, C.panelAlt || C.softBlue, C.line, { fill:{ color:C.panelAlt || C.softBlue, transparency:12 }, line:{ color:C.line, transparency:100 } });
    ctx.addLabel(slide, 'PROOF LINK', { x:1.16, y:6.39, w:0.94, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.7 });
    ctx.addText(slide, '品牌世界观必须解释产品承诺如何转成渠道、会员和复购证据。', { x:2.32, y:6.37, w:6.64, h:0.11, fontSize:7.4, color:C.body, fit:'shrink' });
  }

  return {
    drawBrandWorldProofLink
  };
}

module.exports = {
  createBrandWorldProofLinkRenderer
};
