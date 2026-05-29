const { chartColors, clamp, numericValues, rawValueLabel, rect, renderChartFrame, text } = require('./chart-layout');

function renderFunnelChart(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const values = numericValues(spec).slice(0, opts.max || 6);
  if (spec.kind === 'informationGap' || values.length < 3) return { rendered: false, reason: 'funnel requires at least three values' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const max = Math.max(...values.map(v => Math.abs(v.number)), 1);
  const colors = chartColors(ctx);
  const stepH = Math.min(0.42, (plot.h - 0.26) / Math.max(1, values.length));
  const gap = Math.max(0.07, ((plot.h - 0.22) - values.length * stepH) / Math.max(1, values.length - 1));
  values.forEach((value, i) => {
    const width = clamp((plot.w - 1.76) * Math.abs(value.number) / max, 0.66, plot.w - 1.76);
    const x = plot.x + (plot.w - 1.76 - width) / 2;
    const y = plot.y + 0.12 + i * (stepH + gap);
    const color = colors[i % colors.length];
    rect(ctx, x, y, width, stepH * 0.72, color, color, {
      fill: { color, transparency: i === 0 ? 0 : 10 },
      line: { color, transparency: 100 }
    });
    text(ctx, value.category || `Stage ${i + 1}`, {
      x: plot.x + plot.w - 1.50,
      y: y + 0.03,
      w: 0.86,
      h: 0.12,
      fontSize: 6.8,
      bold: true,
      color: C.text,
      fit: 'shrink'
    });
    text(ctx, rawValueLabel(value, spec), {
      x: plot.x + plot.w - 0.62,
      y: y + 0.03,
      w: 0.46,
      h: 0.12,
      fontSize: 6.8,
      color,
      bold: true,
      align: 'right',
      fit: 'shrink'
    });
  });
  return {
    rendered: true,
    rendererModule: 'components/funnel-chart',
    componentId: 'funnel-chart',
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

module.exports = { renderFunnelChart };
