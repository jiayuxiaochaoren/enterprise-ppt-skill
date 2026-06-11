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

  function drawContributionBars(slide, board, items) {
    const max = Math.max(...items.map(it => Number(it.value) || 1), 1);
    addLabel(slide, '贡献结构', { x:board.x+0.30, y:board.y+0.30, w:1.62, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
    const colors = [C.accent, C.cyan, C.violet, C.tertiary || C.success || '20B77A', C.warning || 'E9A23B'];
    items.forEach((it, i) => {
      const y = board.y + 0.78 + i * 0.52;
      const color = colors[i % colors.length];
      const value = Number(it.value) || 0;
      addText(slide, it.label || it.title || `项目 ${i + 1}`, {
        x:board.x+0.34,
        y:y,
        w:1.46,
        h:0.14,
        fontSize:7.6,
        bold:true,
        color:C.text,
        fit:'shrink',
        valign:'mid'
      });
      addRect(slide, board.x+1.96, y+0.05, board.w-3.08, 0.12, C.panelAlt || C.softBlue || 'EEF6FF', C.line, {
        fill:{ color:C.panelAlt || C.softBlue || 'EEF6FF', transparency:8 },
        line:{ color:C.line, transparency:100 }
      });
      addRect(slide, board.x+1.96, y+0.05, (board.w-3.08) * value / max, 0.12, color, color, {
        fill:{ color, transparency:i === 0 ? 0 : 6 },
        line:{ color, transparency:100 }
      });
      addText(slide, it.valueLabel || it.display || it.rawValue || String(it.value || ''), {
        x:board.x+board.w-0.88,
        y:y-0.01,
        w:0.58,
        h:0.13,
        fontSize:7.2,
        bold:true,
        color,
        align:'right',
        fit:'shrink'
      });
      if (it.note || it.body) {
        addText(slide, it.note || it.body, {
          x:board.x+1.96,
          y:y+0.24,
          w:board.w-2.52,
          h:0.11,
          fontSize:5.9,
          color:C.body,
          fit:'shrink'
        });
      }
    });
  }

  return function drawIndustryWaterfall(slide, board, s) {
    const items = firstChartItems(s, ['waterfallBridge', 'targetBridge', 'bridge'], [
      { label:'Q1净销', value:'1482w', kind:'start' },
      { label:'P04防晒', value:'+252w', kind:'up' },
      { label:'私域', value:'+39w', kind:'up' },
      { label:'渠道修复', value:'+22w', kind:'up' },
      { label:'其他修复', value:'+55w', kind:'up' },
      { label:'Q2目标', value:'1850w', kind:'end' }
    ]).slice(0, 6);
    const explicitBridge = items.some(it => /start|end|up|down/i.test(String(it.kind || '')));
    const allPositiveStandalone = items.length >= 3 && !explicitBridge && items.every(it => Number(it.value) > 0);
    if (allPositiveStandalone) {
      drawContributionBars(slide, board, items);
      return;
    }
    const baseY = board.y + 3.18;
    const topY = board.y + 0.76;
    const barW = 0.54;
    const gap = (board.w - 1.22 - items.length * barW) / Math.max(1, items.length - 1);
    addLabel(slide, '贡献桥', { x:board.x+0.30, y:board.y+0.30, w:1.62, h:0.10, fontSize:6.6, color:C.accent, charSpace:0 });
    const unit = (s.chartSpec && s.chartSpec.unit) || s.unit || s.metricUnit || '';
    if (unit) {
      addLabel(slide, `单位：${unit}`, { x:board.x+board.w-1.10, y:board.y+0.30, w:0.86, h:0.10, fontSize:5.8, color:C.muted, charSpace:0 });
    }
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
  };
}

module.exports = {
  createIndustryWaterfallDrawer
};
