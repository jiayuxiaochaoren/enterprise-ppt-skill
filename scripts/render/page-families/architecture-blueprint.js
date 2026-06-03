function createArchitectureBlueprintRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;

  return function architectureBlueprint(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'SOLUTION BLUEPRINT',
      title:s.title || '方案架构蓝图',
      subtitle:s.subtitle || s.claim,
      subtitleW:6.1,
      idx
    });
    const layers = (s.layers || []).slice(0,5);
    addRect(slide, 0.92, 2.10, 2.76, 3.92, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'ARCHITECTURE LOGIC', { x:1.20, y:2.42, w:1.34, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '从业务入口到数据底座', { x:1.20, y:2.86, w:1.96, h:0.30, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || '复杂方案先讲清系统边界、分层关系和关键接口。', { x:1.20, y:3.48, w:1.94, h:0.58, fontSize:8.2, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, 1.20, 4.48, 0.78, C.accent, 0, 0.68);
    addText(slide, s.note || '架构页应避免功能堆叠，优先表达“对象、动作、数据、治理”的关系。', { x:1.20, y:4.86, w:1.94, h:0.38, fontSize:7.1, color:C.darkMuted, breakLine:true, fit:'shrink' });

    const board = { x:4.18, y:2.04, w:7.32, h:4.10 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'LAYERED OPERATING SYSTEM', { x:board.x+0.34, y:board.y+0.26, w:1.82, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
    const rowH = 0.58;
    layers.forEach((layer, i) => {
      const y = board.y + 0.72 + i*0.66;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
      addRect(slide, board.x+0.34, y, board.w-0.68, rowH, i === 1 ? C.panelAlt : panelFill(), C.line, {
        fill:{color:i === 1 ? C.panelAlt : panelFill(), transparency:i === 1 ? 8 : 0},
        line:{color:i === 0 ? accent : C.line, transparency:i === 0 ? 18 : 16, width:0.42}
      });
      addNumber(slide, String(i+1).padStart(2, '0'), { x:board.x+0.60, y:y+0.21, w:0.30, h:0.10, fontSize:6.8, color:accent });
      addText(slide, layer.title || layer.name || `层级 ${i+1}`, { x:board.x+1.04, y:y+0.15, w:1.28, h:0.15, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
      const items = (layer.items || []).slice(0,5);
      addText(slide, items.join('   /   '), { x:board.x+2.70, y:y+0.16, w:4.02, h:0.13, fontSize:8.4, color:C.body, fit:'shrink' });
    });
    addHairline(slide, board.x+0.34, 6.42, board.w-0.68, C.line, 16, 0.45);
    addText(slide, s.footerNote || '用蓝图把角色、系统、数据和责任放在同一张结构图中。', { x:board.x+0.34, y:6.60, w:5.8, h:0.12, fontSize:7.4, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createArchitectureBlueprintRenderer
};
