function createFinanceBridgeSlide(ctx = {}, deps = {}) {
  const { drawFooter, drawLightPageHeader } = deps;

  return function financeBridgeSlide(slide, plan, s, idx) {
    const C = ctx.colors();
    drawLightPageHeader(slide, {
      kicker:'RETURN BRIDGE',
      title:s.title || '组合回报归因桥',
      titleY:1.06,
      titleW:5.8,
      titleH:0.36,
      titleSize:24,
      subtitle:s.subtitle || s.claim,
      subtitleY:1.54,
      subtitleW:6.9,
      subtitleSize:10.2,
      idx,
      pageNumber:'chrome'
    });

    const bridge = (s.bridge || []).slice(0,6);
    const chart = { x:0.92, y:2.08, w:7.28, h:4.00 };
    ctx.addRect(slide, chart.x, chart.y, chart.w, chart.h, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    ctx.addLabel(slide, 'IRR CONTRIBUTION', { x:chart.x+0.30, y:chart.y+0.32, w:1.52, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    ctx.addHairline(slide, chart.x+0.44, chart.y+3.22, chart.w-0.88, C.line, 10, 0.48);
    const barW = 0.62;
    const gap = bridge.length > 1 ? (chart.w - 1.24 - bridge.length*barW) / (bridge.length - 1) : 0.80;
    bridge.forEach((b,i)=>{
      const kind = b.kind || b.type || (i===0?'start':(i===bridge.length-1?'end':'up'));
      const h = Math.max(0.30, Math.min(2.20, Number(b.height) || (kind === 'down' ? 0.76 : (kind === 'end' ? 1.68 : 0.92))));
      const x = chart.x + 0.62 + i*(barW+gap);
      const y = chart.y + 3.22 - h;
      const color = kind === 'down' ? C.risk : (kind === 'end' || kind === 'start' ? C.accent : C.cyan);
      ctx.addRect(slide, x, y, barW, h, color, color, { fill:{color, transparency:kind === 'down' ? 12 : 0}, line:{color, transparency:100} });
      ctx.addText(slide, b.value || '', { x:x-0.22, y:y-0.26, w:1.06, h:0.12, fontSize:7.0, bold:true, color:kind === 'down' ? C.risk : C.text, align:'center', fit:'shrink' });
      ctx.addText(slide, b.label || `项目 ${i+1}`, { x:x-0.36, y:chart.y+3.46, w:1.32, h:0.24, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
      if (i < bridge.length - 1) ctx.addHairline(slide, x+barW, y, gap*0.72, C.line, 34, 0.30);
    });

    const actions = s.actions || s.items || [];
    const side = { x:8.66, y:2.08, w:3.06, h:4.00 };
    ctx.addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    ctx.addLabel(slide, 'CAPITAL ACTIONS', { x:side.x+0.28, y:side.y+0.34, w:1.44, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    ctx.addText(slide, s.decision || '把归因结果转化为加仓、维持、退出和风险隔离动作。', { x:side.x+0.28, y:side.y+0.80, w:2.14, h:0.40, fontSize:8.2, color:'CBD5E1', breakLine:true, fit:'shrink' });
    actions.slice(0,4).forEach((a,i)=>{
      const y = side.y + 1.66 + i*0.58;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.risk : '94A3B8'));
      ctx.addNumber(slide, String(i+1).padStart(2,'0'), { x:side.x+0.30, y:y+0.06, w:0.28, h:0.12, fontSize:6.8, color:accent });
      ctx.addText(slide, ctx.itemTitle(a, `动作 ${i+1}`), { x:side.x+0.70, y:y+0.01, w:1.78, h:0.12, fontSize:7.8, bold:true, color:C.white, fit:'shrink' });
      const body = ctx.compactEvidenceCaption(ctx.itemBody(a), 18);
      if (body) ctx.addText(slide, body, { x:side.x+0.70, y:y+0.27, w:1.76, h:0.12, fontSize:6.8, color:'A8B3C3', fit:'shrink' });
    });
    ctx.addText(slide, s.note || '桥图解释变化来源，让投委会同时看到结果和驱动因素。', { x:0.94, y:6.42, w:8.6, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createFinanceBridgeSlide
};
