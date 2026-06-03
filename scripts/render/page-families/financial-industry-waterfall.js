const {
  computeWaterfallBars,
  firstChartItems
} = require('./financial-chart-utils');

function createIndustryWaterfallDrawer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  return function drawIndustryWaterfall(slide, board, s) {
    const items = firstChartItems(s, ['waterfallBridge', 'targetBridge', 'bridge'], [
      { label:'Q1净销', value:'1482w', kind:'start' },
      { label:'P04防晒', value:'+252w', kind:'up' },
      { label:'私域', value:'+39w', kind:'up' },
      { label:'渠道修复', value:'+22w', kind:'up' },
      { label:'其他修复', value:'+55w', kind:'up' },
      { label:'Q2目标', value:'1850w', kind:'end' }
    ]).slice(0, 6);
    const baseY = board.y + 3.18;
    const topY = board.y + 0.76;
    const barW = 0.54;
    const gap = (board.w - 1.22 - items.length * barW) / Math.max(1, items.length - 1);
    addLabel(slide, 'CONTRIBUTION BRIDGE', { x:board.x+0.30, y:board.y+0.30, w:1.62, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
    addHairline(slide, board.x+0.42, baseY, board.w-0.84, C.line, 10, 0.48);
    const { bars, yForValue:yFor } = computeWaterfallBars(items, { baseY, topY });
    bars.forEach((bar) => {
      const { it, i, kind, from, to } = bar;
      const x = board.x + 0.62 + i * (barW + gap);
      const y = Math.min(yFor(from), yFor(to));
      const h = Math.max(0.06, Math.abs(yFor(from) - yFor(to)));
      const color = kind === 'down' ? C.risk : (kind === 'end' ? C.ink : (kind === 'start' ? C.accent : C.cyan));
      addRect(slide, x, y, barW, h, color, color, { fill:{color, transparency:kind === 'down' ? 12 : 0}, line:{color, transparency:100} });
      addText(slide, it.value || '', { x:x-0.24, y:y-0.24, w:1.02, h:0.12, fontSize:7.3, bold:true, color, align:'center', fit:'shrink' });
      addText(slide, it.label || it.title || `项目 ${i+1}`, { x:x-0.40, y:baseY+0.24, w:1.34, h:0.20, fontSize:6.9, bold:i===0 || i===items.length-1, color:C.text, align:'center', fit:'shrink' });
      if (i < items.length - 1) {
        addHairline(slide, x+barW, yFor(to), Math.max(0.10, gap * 0.74), C.line, 24, 0.30);
      }
    });
    addLabel(slide, 'START', { x:board.x+0.40, y:baseY+0.72, w:0.44, h:0.08, fontSize:5.2, color:C.muted, charSpace:0 });
    addLabel(slide, 'TARGET', { x:board.x+board.w-1.02, y:baseY+0.72, w:0.56, h:0.08, fontSize:5.2, color:C.muted, charSpace:0 });
  };
}

module.exports = {
  createIndustryWaterfallDrawer
};
