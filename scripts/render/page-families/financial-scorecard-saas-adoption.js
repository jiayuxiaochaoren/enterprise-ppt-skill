const {
  findMetric
} = require('./financial-scorecard-primitives');

function createSaasAdoptionRevenueBoard(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill,
  } = ctx;
  const {
    drawFooter,
    drawScorecardHeader
  } = deps;

  return function saasAdoptionRevenueBoard(slide, plan, s, idx) {
    drawScorecardHeader(slide, s, idx, {
      kicker:'ADOPTION / REVENUE BOARD',
      title:'增长指标进入复盘区间',
      titleW:5.9,
      subtitle:'把 NRR、激活率和集成深度放在同一条产品采用链路上。',
      subtitleW:7.0
    });

    const metrics = (s.metrics || []).slice(0,4);
    const nrr = findMetric(metrics, /NRR|净收入|收入|revenue/i, 0);
    const activation = findMetric(metrics, /激活|activate|activation/i, 1);
    const integration = findMetric(metrics, /集成|integration|嵌入/i, 2);
    const board = { x:0.92, y:2.08, w:10.86, h:3.94 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

    const path = { x:1.24, y:2.62, w:9.72, h:1.62 };
    addLabel(slide, 'CUSTOMER ADOPTION PATH', { x:path.x, y:path.y-0.20, w:1.70, h:0.10, fontSize:6.4, color:C.accent, charSpace:0.6 });
    [
      { title:'激活', metric:activation, color:C.accent },
      { title:'集成', metric:integration, color:C.cyan },
      { title:'扩展', metric:nrr, color:C.violet }
    ].forEach((step,i)=>{
      const x = path.x + i*3.24;
      addRect(slide, x, path.y+0.18, 2.38, 0.92, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
        fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1?0:8},
        line:{color:i===1?step.color:C.line, transparency:i===1?20:16, width:0.38}
      });
      addText(slide, step.title, { x:x+0.28, y:path.y+0.46, w:0.78, h:0.13, fontSize:9.4, bold:true, color:i===1?C.white:C.text, align:'center', fit:'shrink' });
      addText(slide, step.metric.value || '—', { x:x+1.38, y:path.y+0.42, w:0.68, h:0.16, fontSize:10.2, bold:true, color:step.color, align:'right', fit:'shrink' });
      if (i < 2) addArrowLine(slide, x+2.52, path.y+0.64, 0.46, 0, step.color, { transparency:34, width:0.34 });
    });
    const revenue = { x:1.24, y:4.62, w:9.72, h:0.86 };
    addRect(slide, revenue.x, revenue.y, revenue.w, revenue.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'REVENUE QUALITY', { x:revenue.x+0.28, y:revenue.y+0.18, w:1.18, h:0.09, fontSize:6.2, color:C.accent, charSpace:0.5 });
    addText(slide, nrr.label || 'NRR', { x:revenue.x+1.82, y:revenue.y+0.18, w:0.74, h:0.13, fontSize:8.9, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, nrr.value || '—', { x:revenue.x+2.70, y:revenue.y+0.10, w:1.08, h:0.28, fontSize:18.8, color:C.accent, fit:'shrink' });
    addText(slide, nrr.note || '扩展收入和留存改善共同解释增长质量。', { x:revenue.x+4.40, y:revenue.y+0.26, w:3.66, h:0.14, fontSize:8.9, color:C.white, fit:'shrink' });
    addHairline(slide, revenue.x+8.42, revenue.y+0.42, 0.70, C.accent, 0, 0.52);
    addText(slide, s.note || 'SaaS 指标页要把产品采用、企业集成和扩展收入连起来看。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createSaasAdoptionRevenueBoard
};
