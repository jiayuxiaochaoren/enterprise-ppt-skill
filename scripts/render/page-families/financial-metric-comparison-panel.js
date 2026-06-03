function createMetricComparisonPanel(ctx = {}) {
  const C = ctx.colors();

  function drawMetricComparisonPanel(slide, s) {
    const metrics = (s.metrics || []).slice(0,4);
    const big = metrics[0] || {};
    const side = metrics.slice(1,3);
    const panel = { x:0.92, y:2.12, w:11.28, h:3.72 };
    ctx.addRect(slide, panel.x, panel.y, panel.w, panel.h, ctx.panelFill(), C.line, {
      fill:{color:ctx.panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.55}
    });
    ctx.addRect(slide, panel.x, panel.y, 0.06, panel.h, C.accent, C.accent, { line:{color:C.accent, transparency:100} });

    ctx.addLabel(slide, 'PRIMARY KPI', { x:1.34, y:2.50, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.9 });
    ctx.addText(slide, big.label || '核心指标', { x:1.34, y:2.82, w:2.20, h:0.20, fontSize:11.2, bold:true, color:C.text, fit:'shrink' });
    ctx.addNumber(slide, big.value || '—', { x:1.30, y:3.18, w:2.72, h:0.86, fontSize:50, color:C.accent, fit:'shrink' });
    const bigDelta = ctx.formatMetricDelta(big.delta || big.unit);
    if (bigDelta) {
      ctx.addRect(slide, 1.36, 4.18, 1.70, 0.28, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
      ctx.addText(slide, bigDelta, { x:1.50, y:4.25, w:1.42, h:0.11, fontSize:7.0, bold:true, color:C.onAccent || C.white, fit:'shrink' });
    }
    ctx.addText(slide, big.note || '核心增长信号已经形成，需要继续验证触达、组合与成交之间的贡献关系。', {
      x:1.36, y:4.74, w:3.00, h:0.42, fontSize:8.8, color:C.body, breakLine:true, fit:'shrink'
    });

    slide.addShape('line', { x:4.78, y:2.54, w:0, h:2.70, line:{color:C.line, transparency:10, width:0.55} });
    side.forEach((m,i)=>{
      const x = 5.28 + i*3.10;
      const accent = i === 0 ? C.cyan : C.tertiary || C.violet;
      ctx.addLabel(slide, `SUPPORT 0${i+1}`, { x, y:2.54, w:1.10, h:0.10, fontSize:5.8, color:accent, charSpace:0.9 });
      ctx.addText(slide, m.label || `指标 ${i+2}`, { x, y:2.86, w:1.72, h:0.17, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      ctx.addNumber(slide, m.value || '—', { x, y:3.22, w:1.74, h:0.42, fontSize:28, color:accent, fit:'shrink' });
      const delta = ctx.formatMetricDelta(m.delta || m.unit);
      if (delta) ctx.addText(slide, delta, { x, y:3.92, w:1.58, h:0.13, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
      ctx.addText(slide, m.note || '', { x, y:4.36, w:2.04, h:0.30, fontSize:7.8, color:C.body, breakLine:true, fit:'shrink' });
      ctx.addRect(slide, x, 5.18, 1.84, 0.04, C.line, C.line, { line:{color:C.line, transparency:100} });
      ctx.addRect(slide, x, 5.18, i === 0 ? 0.94 : 1.20, 0.04, accent, accent, { line:{color:accent, transparency:100} });
    });
  }

  return {
    drawMetricComparisonPanel
  };
}

module.exports = {
  createMetricComparisonPanel
};
