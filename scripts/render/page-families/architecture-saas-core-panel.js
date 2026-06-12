function createSaasCapabilityCorePanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText
  } = ctx;

  function drawProductCorePanel(slide, s, metrics, opts = {}) {
    const left = { x:0.92, y:opts.y || 2.08, w:2.54, h:opts.h || 4.10 };
    addRect(slide, left.x, left.y, left.w, left.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRODUCT CORE', { x:left.x+0.28, y:left.y+0.34, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '核心工作流成立，平台才有复利', { x:left.x+0.28, y:left.y+0.78, w:1.68, h:0.42, fontSize:14.0, bold:true, color:C.white, fit:'shrink', breakLine:true });
    addText(slide, s.coreBody || 'SaaS 能力页应把模块放回用户动作、数据事件和企业治理，不只是功能列表。', { x:left.x+0.28, y:left.y+1.64, w:1.72, h:0.70, fontSize:7.4, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, left.x+0.28, left.y+Math.min(2.72, left.h - 1.38), 0.78, C.accent, 0, 0.60);
    metrics.slice(0,2).forEach((m, i) => {
      const y = left.y + Math.min(3.02, left.h - 1.08) + i*0.44;
      addNumber(slide, m.value || '—', { x:left.x+0.28, y, w:0.70, h:0.14, fontSize:12.2, color:i === 0 ? C.accent : C.cyan, fit:'shrink' });
      addText(slide, m.label || '', { x:left.x+1.08, y:y+0.02, w:0.82, h:0.12, fontSize:8.8, color:'A8B3C3', fit:'shrink' });
    });
  }

  return {
    drawProductCorePanel
  };
}

module.exports = {
  createSaasCapabilityCorePanel
};
