function createValueCreationProcessMapRenderer(ctx = {}, deps = {}) {
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;

  return function valueCreationProcessMapSlide(slide, plan, s, idx) {
    const C = ctx.colors();
    drawLightPageHeader(slide, {
      kicker:'VALUE CREATION PROCESS',
      title:s.title || '价值创造链路',
      titleW:6.0,
      subtitle:s.claim || s.subtitle || '把投入、活动、产出和结果放在一条可验证流向上。',
      subtitleW:6.8,
      idx
    });
    const lanes = [
      { label:'INPUT', title:s.leftTitle || '关键投入', items:s.drivers || s.inputs || [], color:C.accent },
      { label:'ACTIVITY', title:s.centerTitle || '经营动作', items:s.actions || s.capabilities || [], color:C.cyan },
      { label:'OUTPUT', title:s.outputTitle || '直接产出', items:s.outputs || s.outputItems || (s.actions || []).slice(0, 3), color:C.violet },
      { label:'OUTCOME', title:s.rightTitle || '长期结果', items:s.outcomes || s.results || [], color:C.muted }
    ];
    const board = { x:0.92, y:2.12, w:10.64, h:3.82 };
    const laneW = 2.30;
    const connectors = [];
    lanes.forEach((lane, i) => {
      const x = board.x + i * 2.72;
      ctx.addRect(slide, x, board.y, laneW, board.h, i === 1 ? C.ink : ctx.panelFill(), i === 1 ? C.ink : C.line, {
        fill:{ color:i === 1 ? C.ink : ctx.panelFill(), transparency:i === 1 ? 0 : 0 },
        line:{ color:i === 1 ? C.ink : C.line, transparency:i === 1 ? 100 : 14, width:0.46 }
      });
      ctx.addRect(slide, x, board.y, laneW, 0.06, lane.color, lane.color, { line:{ color:lane.color, transparency:100 } });
      ctx.addLabel(slide, lane.label, { x:x + 0.22, y:board.y + 0.30, w:1.04, h:0.10, fontSize:6.8, color:lane.color, charSpace:0.7 });
      ctx.addText(slide, lane.title, { x:x + 0.22, y:board.y + 0.70, w:1.34, h:0.16, fontSize:10.2, bold:true, color:i === 1 ? C.white : C.text, fit:'shrink' });
      (lane.items || []).slice(0, 3).forEach((it, j) => {
        const y = board.y + 1.28 + j * 0.58;
        ctx.addNumber(slide, String(j + 1).padStart(2, '0'), { x:x + 0.22, y:y + 0.02, w:0.30, h:0.09, fontSize:6.8, color:lane.color });
        ctx.addText(slide, ctx.itemTitle(it, `要素 ${j + 1}`), { x:x + 0.62, y, w:1.14, h:0.12, fontSize:8.0, bold:true, color:i === 1 ? C.white : C.text, fit:'shrink' });
        const body = ctx.itemBody(it);
        if (body) ctx.addText(slide, body, { x:x + 0.62, y:y + 0.24, w:1.22, h:0.12, fontSize:6.8, color:i === 1 ? 'CBD5E1' : C.body, fit:'shrink' });
      });
      if (i < lanes.length - 1) connectors.push({ x:x + laneW + 0.08, y:board.y + 1.94, color:lane.color });
    });
    connectors.forEach(conn => ctx.addArrowLine(slide, conn.x, conn.y, 0.24, 0, conn.color, { transparency:20, width:0.46 }));
    ctx.addRect(slide, 0.92, 6.26, 9.26, 0.36, C.panelAlt || C.softBlue, C.line, { fill:{ color:C.panelAlt || C.softBlue, transparency:12 }, line:{ color:C.line, transparency:100 } });
    ctx.addLabel(slide, 'PROOF NOTE', { x:1.16, y:6.38, w:1.02, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.7 });
    ctx.addText(slide, s.note || '价值流向必须能说明投入如何变成经营结果。', { x:2.38, y:6.36, w:7.06, h:0.11, fontSize:7.6, color:C.body, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createValueCreationProcessMapRenderer
};
