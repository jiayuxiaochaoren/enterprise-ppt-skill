const { chartColors, clamp, line, numericValues, rawValueLabel, rect, renderChartFrame, text } = require('./chart-layout');

function renderBarChart(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const values = numericValues(spec).slice(0, opts.max || 7);
  if (spec.kind === 'informationGap' || !values.length) return { rendered: false, reason: 'no bar values' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const max = Math.max(...values.map(v => Math.abs(v.number)), 1);
  const colors = chartColors(ctx);
  line(ctx, plot.x, plot.y + plot.h - 0.10, plot.w, 0, C.line, { transparency: 12, width: 0.42 });
  values.forEach((value, i) => {
    const rowH = Math.min(0.38, (plot.h - 0.28) / Math.max(1, values.length));
    const gap = Math.max(0.08, ((plot.h - 0.26) - rowH * values.length) / Math.max(1, values.length - 1));
    const y = plot.y + 0.12 + i * (rowH + gap);
    const barW = clamp((plot.w - 2.24) * Math.abs(value.number) / max, 0.10, plot.w - 2.24);
    const color = colors[i % colors.length];
    text(ctx, value.category || `Item ${i + 1}`, {
      x: plot.x,
      y: y + 0.04,
      w: 1.26,
      h: 0.12,
      fontSize: 7.2,
      bold: i === 0,
      color: C.text,
      fit: 'shrink'
    });
    rect(ctx, plot.x + 1.46, y + 0.04, plot.w - 2.30, rowH * 0.54, C.panelAlt || 'F1F5F9', C.line, {
      fill: { color: C.panelAlt || 'F1F5F9', transparency: 8 },
      line: { color: C.line, transparency: 100 }
    });
    rect(ctx, plot.x + 1.46, y + 0.04, barW, rowH * 0.54, color, color, {
      fill: { color, transparency: i === 0 ? 0 : 10 },
      line: { color, transparency: 100 }
    });
    text(ctx, rawValueLabel(value, spec), {
      x: plot.x + plot.w - 0.72,
      y: y + 0.02,
      w: 0.62,
      h: 0.12,
      fontSize: 7.0,
      bold: true,
      color,
      align: 'right',
      fit: 'shrink'
    });
  });
  return {
    rendered: true,
    rendererModule: 'components/bar-chart',
    componentId: 'bar-chart',
    bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
    itemCount: values.length,
    visualChecks: {
      axisLabels: values.length > 1,
      unitVisible: Boolean(spec.unit),
      sourceVisible: frame.sourceVisible,
      labelCollision: values.length > 8,
      valueOverflow: false
    }
  };
}

module.exports = { renderBarChart };
