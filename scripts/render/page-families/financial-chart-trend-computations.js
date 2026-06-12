const {
  chartNumber
} = require('./financial-chart-data-utils');

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

module.exports = {
  computeMonthlyTrendPoints
};
