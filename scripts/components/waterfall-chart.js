const { chartColors, clamp, line, numericValues, rawValueLabel, rect, renderChartFrame, text } = require('./chart-layout');

function renderWaterfallChart(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const values = numericValues(spec).slice(0, opts.max || 7);
  if (spec.kind === 'informationGap' || values.length < 3) return { rendered: false, reason: 'waterfall requires at least three values' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const colors = chartColors(ctx);
  const barW = Math.min(0.54, (plot.w - 0.40) / Math.max(1, values.length * 1.55));
  const gap = (plot.w - values.length * barW) / Math.max(1, values.length - 1);
  let cursor = Math.abs(values[0].number);
  const bars = values.map((value, i) => {
    const kind = value.kind || (i === 0 ? 'start' : (i === values.length - 1 ? 'end' : (value.number < 0 ? 'down' : 'up')));
    if (kind === 'start') return { value, i, kind, from: 0, to: Math.abs(value.number) };
    if (kind === 'end') return { value, i, kind, from: 0, to: Math.abs(value.number || cursor) };
    const from = cursor;
    const to = cursor + value.number;
    cursor = to;
    return { value, i, kind, from, to };
  });
  const minVal = Math.min(0, ...bars.map(bar => Math.min(bar.from, bar.to)));
  const maxVal = Math.max(1, ...bars.map(bar => Math.max(bar.from, bar.to)));
  const span = Math.max(1, maxVal - minVal);
  const baseY = plot.y + plot.h - 0.34;
  const topY = plot.y + 0.10;
  const yFor = value => baseY - ((value - minVal) / span) * (baseY - topY);
  line(ctx, plot.x, baseY, plot.w, 0, C.line, { transparency: 10, width: 0.48 });
  bars.forEach(bar => {
    const x = plot.x + bar.i * (barW + gap);
    const y = Math.min(yFor(bar.from), yFor(bar.to));
    const h = Math.max(0.06, Math.abs(yFor(bar.from) - yFor(bar.to)));
    const color = bar.kind === 'down' ? (C.risk || 'EF4444') : (bar.kind === 'end' ? C.ink : (bar.kind === 'start' ? colors[0] : colors[1]));
    rect(ctx, x, y, barW, h, color, color, {
      fill: { color, transparency: bar.kind === 'down' ? 10 : 0 },
      line: { color, transparency: 100 }
    });
    text(ctx, rawValueLabel(bar.value, spec), {
      x: clamp(x - 0.25, plot.x, plot.x + plot.w - 0.70),
      y: y - 0.23,
      w: 0.70,
      h: 0.11,
      fontSize: 6.5,
      bold: true,
      color,
      align: 'center',
      fit: 'shrink'
    });
    text(ctx, bar.value.category || `D${bar.i + 1}`, {
      x: clamp(x - 0.38, plot.x, plot.x + plot.w - 0.90),
      y: baseY + 0.16,
      w: 0.90,
      h: 0.18,
      fontSize: 6.3,
      color: C.body,
      align: 'center',
      fit: 'shrink'
    });
    if (bar.i < bars.length - 1) {
      line(ctx, x + barW, yFor(bar.to), Math.max(0.08, gap * 0.72), 0, C.line, { transparency: 28, width: 0.26 });
    }
  });
  return {
    rendered: true,
    rendererModule: 'components/waterfall-chart',
    componentId: 'waterfall-chart',
    bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
    itemCount: values.length,
    visualChecks: {
      axisLabels: true,
      unitVisible: Boolean(spec.unit),
      sourceVisible: frame.sourceVisible,
      labelCollision: values.length > 7,
      valueOverflow: false
    }
  };
}

module.exports = { renderWaterfallChart };
