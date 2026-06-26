const {
  chartBoxesOverlap,
  chartClamp,
  chartNumber
} = require('./financial-chart-data-utils');

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

function channelLabelAlign(side = '') {
  const value = String(side).toLowerCase();
  if (value.includes('left')) return 'right';
  if (value.includes('above') || value.includes('below')) return 'center';
  return 'left';
}

function channelLabelAnchor(box = {}, point = {}) {
  const align = channelLabelAlign(box.side);
  const x = align === 'right'
    ? box.x + box.w
    : (align === 'center' ? box.x + box.w / 2 : box.x);
  return { x, y:box.y + box.h / 2 };
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
    const anchor = channelLabelAnchor(box, point);
    const anchorGap = Math.max(0, Math.hypot(anchor.x - point.x, anchor.y - point.y) - point.r);
    const sidePreference = (point.x > chart.x + chart.w * 0.74 && /right/i.test(candidate.side)) ? 1.6 : 0;
    return {
      box:Object.assign({ align:channelLabelAlign(candidate.side) }, box),
      score:candidate.rank + sidePreference + shift * 7 + Math.max(0, anchorGap - 0.18) * 42 + labelHits * 70 + bubbleHits * 48
    };
  }).sort((a, b) => a.score - b.score);
  return Object.assign({ label }, candidates[0].box);
}

module.exports = {
  chooseChannelLabelBox,
  computeChannelMatrixBubbles
};
