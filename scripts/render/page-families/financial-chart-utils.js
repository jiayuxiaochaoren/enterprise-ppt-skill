function coerceChartItems(value, fallback = []) {
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? { title:v } : v);
  if (value && Array.isArray(value.items)) return value.items.map(v => typeof v === 'string' ? { title:v } : v);
  if (value && Array.isArray(value.rows)) return value.rows.map(v => Array.isArray(v) ? { title:v[0], value:v[1], body:v[2] } : v);
  return fallback;
}

function chartNumber(value, fallback = 0) {
  const n = Number(String(value == null ? '' : value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function chartClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function chartBoxesOverlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad &&
    a.x + a.w + pad > b.x &&
    a.y < b.y + b.h + pad &&
    a.y + a.h + pad > b.y;
}

function firstChartItems(source = {}, keys = [], fallback = []) {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value) || (value && (Array.isArray(value.items) || Array.isArray(value.rows)))) {
      const items = coerceChartItems(value, []);
      if (items.length) return items;
    }
  }
  return coerceChartItems(null, fallback);
}

function computeWaterfallBars(items = [], opts = {}) {
  const baseY = Number(opts.baseY || 0);
  const topY = Number(opts.topY || 0);
  const maxH = baseY - topY;
  const values = items.map((it, i) => chartNumber(it.value, i === 0 ? 100 : 18));
  const start = Math.abs(values[0]) || 100;
  let cursor = start;
  const bars = items.map((it, i) => {
    const kind = it.kind || it.type || (i === 0 ? 'start' : (i === items.length - 1 ? 'end' : (values[i] < 0 ? 'down' : 'up')));
    const raw = values[i];
    if (kind === 'start') return { it, item:it, i, index:i, kind, raw, from:0, to:start };
    if (kind === 'end') return { it, item:it, i, index:i, kind, raw, from:0, to:Math.abs(raw || cursor) };
    const from = cursor;
    const to = cursor + raw;
    cursor = to;
    return { it, item:it, i, index:i, kind, raw, from, to };
  });
  const minVal = Math.min(0, ...bars.map(bar => Math.min(bar.from, bar.to)));
  const maxVal = Math.max(1, ...bars.map(bar => Math.max(bar.from, bar.to)));
  const span = Math.max(1, maxVal - minVal);
  const yForValue = (value) => baseY - ((value - minVal) / span) * maxH;
  return { values, start, bars, minVal, maxVal, span, yForValue };
}

function computeMonthlyTrendPoints(items = [], chart = {}, fallbackValues = []) {
  const values = items.map((it, i) => chartNumber(it.value, fallbackValues[i] || 100));
  if (!values.length) {
    return { values, min:0, max:0, span:1, plotX:chart.x || 0, plotW:0, step:0, baselineY:(chart.y || 0) + (chart.h || 0), points:[] };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const plotX = chart.x + 0.42;
  const plotW = chart.w - 0.84;
  const step = items.length > 1 ? plotW / (items.length - 1) : 0;
  const points = items.map((it, i) => {
    const x = items.length > 1 ? plotX + i * step : chart.x + chart.w / 2;
    const y = chart.y + chart.h - ((values[i] - min) / span) * (chart.h - 0.38) - 0.18;
    return { x, y, item:it, value:values[i], i, index:i };
  });
  return { values, min, max, span, plotX, plotW, step, baselineY:chart.y + chart.h, points };
}

function computeChannelMatrixBubbles(items = [], chart = {}, colors = []) {
  return items.map((it, i) => {
    const xVal = chartNumber(it.x || it.spend || it.cost || it.share, 18 + i * 14);
    const yVal = chartNumber(it.y || it.roas || it.efficiency || it.score || it.value, 72 - i * 8);
    const sizeVal = chartNumber(it.size || it.budget || it.weight, 42 - i * 3);
    const r = Math.max(0.18, Math.min(0.42, sizeVal / 160));
    const x = chart.x + chartClamp(xVal / 100, 0.06, 0.96) * chart.w;
    const y = chart.y + chart.h - chartClamp(yVal / 100, 0.06, 0.96) * chart.h;
    return {
      item: it,
      i,
      index: i,
      x,
      y,
      r,
      color: colors[i] || colors[0] || '0F172A',
      bubbleBox: { x:x-r, y:y-r, w:r*2, h:r*2 }
    };
  });
}

function chooseChannelLabelBox(point, opts = {}) {
  const chart = opts.chart || {};
  const bubbles = opts.bubbles || [];
  const occupiedLabels = opts.occupiedLabels || [];
  const label = point.item.label || point.item.title || point.item.name || `渠道 ${point.i+1}`;
  const w = chartClamp(0.78 + String(label).length * 0.045, 0.90, 1.22);
  const h = 0.20;
  const pad = 0.08;
  const raw = [
    { x:point.x+point.r+0.12, y:point.y-h/2, side:'right', rank:0 },
    { x:point.x-point.r-w-0.12, y:point.y-h/2, side:'left', rank:1 },
    { x:point.x-w/2, y:point.y-point.r-h-0.10, side:'above', rank:2 },
    { x:point.x-w/2, y:point.y+point.r+0.10, side:'below', rank:3 },
    { x:point.x+point.r+0.12, y:point.y-point.r-h-0.04, side:'upperRight', rank:4 },
    { x:point.x+point.r+0.12, y:point.y+point.r+0.04, side:'lowerRight', rank:5 },
    { x:point.x-point.r-w-0.12, y:point.y-point.r-h-0.04, side:'upperLeft', rank:6 },
    { x:point.x-point.r-w-0.12, y:point.y+point.r+0.04, side:'lowerLeft', rank:7 }
  ];
  const candidates = raw.map(candidate => {
    const box = {
      x: chartClamp(candidate.x, chart.x + pad, chart.x + chart.w - w - pad),
      y: chartClamp(candidate.y, chart.y + pad, chart.y + chart.h - h - pad),
      w,
      h,
      side: candidate.side
    };
    const labelHits = occupiedLabels.filter(other => chartBoxesOverlap(box, other, 0.05)).length;
    const bubbleHits = bubbles.filter(other => chartBoxesOverlap(box, other.bubbleBox, other === point ? 0.09 : 0.05)).length;
    const shift = Math.abs(box.x - candidate.x) + Math.abs(box.y - candidate.y);
    const sidePreference = (point.x > chart.x + chart.w * 0.74 && /right/i.test(candidate.side)) ? 1.6 : 0;
    return { box, score:candidate.rank + sidePreference + shift * 7 + labelHits * 70 + bubbleHits * 48 };
  }).sort((a, b) => a.score - b.score);
  return Object.assign({ label }, candidates[0].box);
}

module.exports = {
  chartBoxesOverlap,
  chartClamp,
  chartNumber,
  chooseChannelLabelBox,
  coerceChartItems,
  computeChannelMatrixBubbles,
  computeMonthlyTrendPoints,
  computeWaterfallBars,
  firstChartItems
};
