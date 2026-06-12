function createFallbackRenderers(ctx = {}) {
  function fallbackBulletsSlide(slide, plan, s, idx) {
    const C = ctx.colors();
    const profile = ctx.profile();
    ctx.masterLight(slide, plan, s.title || '未命名页面', idx);
    const runs = (s.bullets || s.items || []).map(v => ({
      text:String(v),
      options:{ bullet:{ type:'bullet' }, breakLine:true }
    }));
    slide.addText(runs, {
      x:1.0,
      y:1.8,
      w:10.8,
      h:4.2,
      fontFace:profile.font,
      fontSize:14,
      color:C.body,
      fit:'shrink',
      valign:'top',
      paraSpaceAfterPt:8,
      margin:0.02
    });
  }

  return {
    fallbackBulletsSlide
  };
}

module.exports = {
  createFallbackRenderers
};
