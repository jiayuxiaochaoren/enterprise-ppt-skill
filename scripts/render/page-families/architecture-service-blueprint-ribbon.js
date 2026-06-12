function createServiceBlueprintRibbonRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawServiceBlueprintRibbon(slide, s, opts = {}) {
    const ribbon = { x:0.92, y:opts.y || 2.04, w:10.84, h:0.60 };
    addRect(slide, ribbon.x, ribbon.y, ribbon.w, ribbon.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'CARE JOURNEY', { x:ribbon.x+0.28, y:ribbon.y+0.20, w:1.18, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '从触点到责任', { x:ribbon.x+1.72, y:ribbon.y+0.16, w:1.62, h:0.17, fontSize:10.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || '服务蓝图不只画流程，而是把患者体验、医护协同和质量复盘绑定起来。', {
      x:ribbon.x+3.74, y:ribbon.y+0.18, w:3.38, h:0.14, fontSize:6.8, color:C.captionOnImage, fit:'shrink'
    });
    addText(slide, s.note || '多角色触点按前台、后台和证据链协同展开。', {
      x:ribbon.x+7.78, y:ribbon.y+0.18, w:2.58, h:0.14, fontSize:6.8, color:C.darkMuted || 'A8B3C3', fit:'shrink'
    });
  }

  return {
    drawServiceBlueprintRibbon
  };
}

module.exports = {
  createServiceBlueprintRibbonRenderer
};
