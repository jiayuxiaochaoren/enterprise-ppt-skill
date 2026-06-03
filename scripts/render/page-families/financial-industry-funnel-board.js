const {
  coerceChartItems
} = require('./financial-chart-utils');

function createAdoptionOrPatientFunnelBoard(ctx = {}) {
  const C = ctx.colors();
  const {
    addRect,
    addText,
    itemTitle
  } = ctx;

  function renderAdoptionOrPatientFunnelBoard(slide, s, variant, board) {
    const source = variant === 'adoption-funnel'
      ? (s.adoptionFunnel || s.activationFunnel || s.cohortFunnel)
      : (s.patientBottlenecks || s.waitBottlenecks);
    const fallback = variant === 'adoption-funnel'
      ? [{title:'注册',value:100},{title:'激活',value:64},{title:'集成',value:46},{title:'扩展',value:28}]
      : [{title:'预约',value:100,body:'入口等待'},{title:'到院',value:72,body:'签到等待'},{title:'检查',value:48,body:'资源瓶颈'},{title:'反馈',value:34,body:'处置瓶颈'}];
    const items = coerceChartItems(source, fallback).slice(0,5);
    const max = Math.max(...items.map(it => Number(it.value) || 1), 1);
    items.forEach((it,i)=>{
      const y = board.y + 0.76 + i*0.56;
      const val = Number(it.value) || (max - i*12);
      const w = Math.max(0.70, 4.80 * val / max);
      const x = board.x + 0.72 + (4.80 - w)/2;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, y, w, 0.32, accent, accent, { fill:{color:accent, transparency:i===0?2:12}, line:{color:accent, transparency:100} });
      addText(slide, itemTitle(it, `阶段 ${i+1}`), { x:board.x+5.96, y:y+0.05, w:0.88, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, `${val}${it.unit || '%'}`, { x:board.x+6.88, y:y+0.05, w:0.44, h:0.16, fontSize:8.8, color:accent, align:'right', fit:'shrink' });
    });
  }

  return {
    renderAdoptionOrPatientFunnelBoard
  };
}

module.exports = {
  createAdoptionOrPatientFunnelBoard
};
