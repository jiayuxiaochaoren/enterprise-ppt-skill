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

  return function drawMonthlyPulseTrend(slide, board, s) {
    const items = firstChartItems(s, ['monthlyPulse', 'monthlyTrend', 'trend'], (s.metrics || [
      { label:'1月', value:'456.2w', note:'春节前礼盒与精华稳定' },
      { label:'2月', value:'402.2w', note:'节后流量低谷' },
      { label:'3月', value:'618.4w', note:'女神节+防晒预热' }
    ])).slice(0, 5);
    const chart = { x:board.x+0.56, y:board.y+0.70, w:board.w-1.06, h:2.60 };
    addLabel(slide, 'MONTHLY NET SALES TREND', { x:board.x+0.30, y:board.y+0.30, w:1.90, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
    addHairline(slide, chart.x, chart.y+chart.h, chart.w, C.line, 10, 0.50);
    slide.addShape('line', { x:chart.x, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:24, width:0.34} });
    const trend = computeMonthlyTrendPoints(items, chart, [456.2, 402.2, 618.4, 520, 560]);
    const { values, min, max, points, baselineY } = trend;
    points.forEach((p, i) => {
      const color = i === values.indexOf(max) ? C.accent : (i === values.indexOf(min) ? C.cyan : C.violet);
      slide.addShape('line', { x:p.x, y:p.y, w:0, h:Math.max(0.04, baselineY - p.y), line:{color, transparency:18, width:0.44} });
      addHairline(slide, p.x - 0.16, baselineY, 0.32, color, 18, 0.34);
      slide.addShape('ellipse', { x:p.x-0.13, y:p.y-0.13, w:0.26, h:0.26, fill:{color}, line:{color:'FFFFFF', transparency:0, width:0.40} });
      addText(slide, p.item.value || String(p.value), { x:p.x-0.48, y:p.y-0.42, w:0.96, h:0.14, fontSize:8.2, bold:true, color, align:'center', fit:'shrink' });
      addText(slide, p.item.label || p.item.title || `${i+1}月`, { x:p.x-0.42, y:chart.y+chart.h+0.26, w:0.84, h:0.14, fontSize:8.4, bold:true, color:C.text, align:'center', fit:'shrink' });
      addText(slide, compactEvidenceCaption(p.item.note || p.item.body || '', 18), { x:p.x-0.78, y:chart.y+chart.h+0.58, w:1.56, h:0.18, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
    });
  };
}

module.exports = {
  createMonthlyPulseTrendDrawer
};
