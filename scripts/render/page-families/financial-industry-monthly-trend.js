const {
  computeMonthlyTrendPoints,
  firstChartItems
} = require('./financial-chart-utils');

function createMonthlyPulseTrendDrawer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addText,
    compactEvidenceCaption
  } = ctx;

  function addTrendSegment(slide, from, to, color) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    slide.addShape('line', {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      w: Math.abs(dx),
      h: Math.abs(dy),
      flipH: dx < 0,
      flipV: dy < 0,
      line:{ color, transparency:10, width:1.15 }
    });
  }

  return function drawMonthlyPulseTrend(slide, board, s) {
    const items = firstChartItems(s, ['monthlyPulse', 'monthlyTrend', 'trend'], (s.metrics || [
      { label:'1月', value:'456.2w', note:'春节前礼盒与精华稳定' },
      { label:'2月', value:'402.2w', note:'节后流量低谷' },
      { label:'3月', value:'618.4w', note:'女神节+防晒预热' }
    ])).slice(0, 5);
    const chartH = Math.max(1.70, Math.min(2.36, board.h - 1.50));
    const chart = { x:board.x+0.56, y:board.y+0.70, w:board.w-1.06, h:chartH };
    addLabel(slide, '月度营收趋势', { x:board.x+0.30, y:board.y+0.30, w:1.90, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
    addHairline(slide, chart.x, chart.y+chart.h, chart.w, C.line, 10, 0.50);
    slide.addShape('line', { x:chart.x, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:24, width:0.34} });
    const trend = computeMonthlyTrendPoints(items, chart, [456.2, 402.2, 618.4, 520, 560]);
    const { values, min, max, points, baselineY } = trend;
    points.slice(0, -1).forEach((p, i) => {
      const next = points[i + 1];
      addTrendSegment(slide, p, next, C.accent);
    });
    points.forEach((p, i) => {
      const color = i === values.indexOf(max) ? C.accent : (i === values.indexOf(min) ? C.cyan : C.violet);
      slide.addShape('line', { x:p.x, y:p.y, w:0, h:Math.max(0.04, baselineY - p.y), line:{color, transparency:76, width:0.30} });
      addHairline(slide, p.x - 0.16, baselineY, 0.32, color, 18, 0.34);
      slide.addShape('ellipse', { x:p.x-0.13, y:p.y-0.13, w:0.26, h:0.26, fill:{color}, line:{color:'FFFFFF', transparency:0, width:0.40} });
      addText(slide, p.item.value || String(p.value), { x:p.x-0.48, y:p.y-0.42, w:0.96, h:0.14, fontSize:8.2, bold:true, color, align:'center', fit:'shrink' });
      addText(slide, p.item.label || p.item.title || `${i+1}月`, { x:p.x-0.42, y:chart.y+chart.h+0.22, w:0.84, h:0.13, fontSize:8.0, bold:true, color:C.text, align:'center', fit:'shrink' });
      addText(slide, compactEvidenceCaption(p.item.note || p.item.body || '', 18), { x:p.x-0.78, y:chart.y+chart.h+0.46, w:1.56, h:0.14, fontSize:6.4, color:C.body, align:'center', fit:'shrink' });
    });
  };
}

module.exports = {
  createMonthlyPulseTrendDrawer
};
