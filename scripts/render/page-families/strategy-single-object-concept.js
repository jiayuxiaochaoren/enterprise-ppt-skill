function createSingleObjectConceptMapRenderer(ctx = {}, deps = {}) {
  const {
    drawDarkPageHeader,
    drawFooter
  } = deps;

  return function singleObjectConceptMapSlide(slide, plan, s, idx) {
    const C = ctx.colors();
    drawDarkPageHeader(slide, {
      kicker:'SINGLE OBJECT MAP',
      title:s.title || '单对象概念图',
      titleW:5.90,
      titleH:0.38,
      subtitle:s.claim || s.subtitle || '围绕一个核心对象组织能力、约束和结果。',
      subtitleW:5.70,
      subtitleSize:9.8,
      subtitleColor:C.captionOnImage,
      idx,
      stageOpts:{ field:false },
      pageNumberOpts:{ x:11.70, y:0.74, w:0.62 }
    });
    const center = { x:5.14, y:2.54, w:2.34, h:1.32 };
    ctx.addDarkBreathingCircle(slide, 4.46, 1.90, 3.70, 2.20, C.accent);
    ctx.addRect(slide, center.x, center.y, center.w, center.h, C.ink, C.accent, { fill:{ color:C.ink, transparency:0 }, line:{ color:C.accent, transparency:18, width:0.62 } });
    ctx.addLabel(slide, 'CORE OBJECT', { x:center.x + 0.48, y:center.y + 0.30, w:1.10, h:0.09, fontSize:5.6, color:C.accent, charSpace:0.8, align:'center' });
    ctx.addText(slide, s.centerTitle || '核心对象', { x:center.x + 0.34, y:center.y + 0.64, w:1.66, h:0.18, fontSize:11.6, bold:true, color:C.white, align:'center', fit:'shrink' });
    const nodes = [
      ...(s.drivers || []).slice(0, 3).map(v => ({ title:ctx.itemTitle(v), body:ctx.itemBody(v), role:'force' })),
      ...(s.actions || s.capabilities || []).slice(0, 2).map(v => ({ title:ctx.itemTitle(v), body:ctx.itemBody(v), role:'action' })),
      ...(s.outcomes || []).slice(0, 1).map(v => ({ title:ctx.itemTitle(v), body:ctx.itemBody(v), role:'outcome' }))
    ].slice(0, 6);
    const positions = [
      { x:1.08, y:2.18, color:C.accent },
      { x:2.96, y:4.88, color:C.cyan },
      { x:7.88, y:1.92, color:C.violet },
      { x:9.42, y:4.54, color:C.accent },
      { x:5.02, y:5.30, color:C.cyan },
      { x:1.32, y:4.02, color:'94A3B8' }
    ];
    nodes.forEach((node, i) => {
      const pos = positions[i];
      slide.addShape('line', { x:center.x + center.w / 2, y:center.y + center.h / 2, w:pos.x + 0.86 - (center.x + center.w / 2), h:pos.y + 0.38 - (center.y + center.h / 2), line:{ color:pos.color, transparency:62, width:0.34 } });
      ctx.addRect(slide, pos.x, pos.y, 1.72, 0.76, C.ink2, '334155', { fill:{ color:C.ink2, transparency:i === 0 ? 16 : 36 }, line:{ color:pos.color, transparency:i === 0 ? 22 : 58, width:0.42 } });
      ctx.addNumber(slide, String(i + 1).padStart(2, '0'), { x:pos.x + 0.18, y:pos.y + 0.22, w:0.28, h:0.09, fontSize:6.2, color:pos.color });
      ctx.addText(slide, node.title || `节点 ${i + 1}`, { x:pos.x + 0.52, y:pos.y + 0.16, w:0.94, h:0.12, fontSize:8.2, bold:true, color:C.white, fit:'shrink' });
      if (node.body) ctx.addText(slide, node.body, { x:pos.x + 0.18, y:pos.y + 0.46, w:1.20, h:0.11, fontSize:6.5, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    ctx.addText(slide, s.note || '单对象图必须保持一个视觉中心，外围节点只解释力量、动作和结果。', { x:0.90, y:6.42, w:8.20, h:0.14, fontSize:8.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createSingleObjectConceptMapRenderer
};
