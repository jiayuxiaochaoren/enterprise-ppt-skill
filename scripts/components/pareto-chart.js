const { chartColors, clamp, line, numericValues, rawValueLabel, rect, renderChartFrame, text } = require('./chart-layout');

function renderParetoChart(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const values = numericValues(spec)
    .sort((a, b) => Math.abs(b.number) - Math.abs(a.number))
    .slice(0, opts.max || 6);
  if (spec.kind === 'informationGap' || values.length < 3) return { rendered: false, reason: 'pareto requires at least three values' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const colors = chartColors(ctx);
  const total = values.reduce((sum, v) => sum + Math.abs(v.number), 0) || 1;
  const max = Math.max(...values.map(v => Math.abs(v.number)), 1);
  const barW = Math.min(0.54, (plot.w - 0.34) / Math.max(1, values.length * 1.7));
  const gap = (plot.w - values.length * barW) / Math.max(1, values.length - 1);
  const baseY = plot.y + plot.h - 0.32;
  line(ctx, plot.x, baseY, plot.w, 0, C.line, { transparency: 10, width: 0.48 });
  let cumulative = 0;
  const points = [];
  values.forEach((value, i) => {
    const x = plot.x + i * (barW + gap);
    const h = clamp((plot.h - 0.62) * Math.abs(value.number) / max, 0.08, plot.h - 0.62);
    const y = baseY - h;
    const color = i === 0 ? (C.risk || colors[0]) : colors[i % colors.length];
    rect(ctx, x, y, barW, h, color, color, {
      fill: { color, transparency: i === 0 ? 0 : 12 },
      line: { color, transparency: 100 }
    });
    cumulative += Math.abs(value.number) / total;
    points.push({
      x: x + barW / 2,
      y: baseY - cumulative * (plot.h - 0.62),
      cumulative
    });
    text(ctx, rawValueLabel(value, spec), {
      x: clamp(x - 0.22, plot.x, plot.x + plot.w - 0.66),
      y: y - 0.21,
      w: 0.66,
      h: 0.10,
      fontSize: 6.2,
      bold: true,
      color,
      align: 'center',
      fit: 'shrink'
    });
    text(ctx, value.category || `P${i + 1}`, {
      x: clamp(x - 0.32, plot.x, plot.x + plot.w - 0.76),
      y: baseY + 0.14,
      w: 0.76,
      h: 0.16,
      fontSize: 6.2,
      color: C.body,
      align: 'center',
      fit: 'shrink'
    });
  });
  for (let i = 1; i < points.length; i++) {
    line(ctx, points[i - 1].x, points[i - 1].y, points[i].x - points[i - 1].x, points[i].y - points[i - 1].y, C.ink || C.text, { transparency: 8, width: 0.52 });
  }
  return {
    rendered: true,
    rendererModule: 'components/pareto-chart',
    componentId: 'pareto-chart',
    bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
    itemCount: values.length,
    visualChecks: {
      axisLabels: true,
      unitVisible: Boolean(spec.unit),
      sourceVisible: Boolean((spec.sourceTrace || {}).sourceNote || ((spec.sourceTrace || {}).sourceIds || []).length),
      labelCollision: values.length > 6,
      valueOverflow: false
    }
  };
}

module.exports = { renderParetoChart };
