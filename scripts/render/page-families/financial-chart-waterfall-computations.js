const {
  chartNumber
} = require('./financial-chart-data-utils');

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

module.exports = {
  computeWaterfallBars
};
