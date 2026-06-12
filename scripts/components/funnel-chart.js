const { chartColors, clamp, numericValues, rawValueLabel, rect, renderChartFrame, text } = require('./chart-layout');

function renderFunnelChart(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const values = numericValues(spec).slice(0, opts.max || 6);
  if (spec.kind === 'informationGap' || values.length < 3) return { rendered: false, reason: 'funnel requires at least three values' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const max = Math.max(...values.map(v => Math.abs(v.number)), 1);
  const minPositive = Math.min(...values.map(v => Math.abs(v.number)).filter(v => v > 0));
  const highVariance = Number.isFinite(minPositive) && minPositive > 0 && max / minPositive > 20;
  const colors = chartColors(ctx);
  const stepH = Math.min(0.46, (plot.h - 0.26) / Math.max(1, values.length));
  const gap = Math.max(0.09, ((plot.h - 0.22) - values.length * stepH) / Math.max(1, values.length - 1));
  const labelW = Math.min(1.34, Math.max(1.02, plot.w * 0.20));
  const valueW = 0.72;
  const trackX = plot.x + labelW + 0.24;
  const trackW = Math.max(1.0, plot.w - labelW - valueW - 0.52);
  values.forEach((value, i) => {
    const y = plot.y + 0.12 + i * (stepH + gap);
    const color = colors[i % colors.length];
    const magnitude = Math.abs(value.number);
    const ratio = highVariance
      ? Math.log10(magnitude + 1) / Math.log10(max + 1)
      : magnitude / max;
    const fillW = clamp(trackW * ratio, highVariance ? trackW * 0.22 : 0.08, trackW);
    rect(ctx, trackX, y + stepH * 0.34, trackW, 0.08, C.panelAlt || 'F1F5F9', C.line, {
      fill: { color: C.panelAlt || 'F1F5F9', transparency: 0 },
      line: { color: C.line, transparency: 100 }
    });
    rect(ctx, trackX, y + stepH * 0.34, fillW, 0.08, color, color, {
      fill: { color, transparency: i === 0 ? 0 : 10 },
      line: { color, transparency: 100 }
    });
    text(ctx, value.category || `Stage ${i + 1}`, {
      x: plot.x,
      y: y + 0.03,
      w: labelW,
      h: 0.12,
      fontSize: 6.8,
      bold: true,
      color: C.text,
      fit: 'shrink'
    });
    text(ctx, rawValueLabel(value, spec), {
      x: plot.x + plot.w - valueW,
      y: y + 0.03,
      w: valueW,
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
      sourceVisible: frame.sourceVisible,
      labelCollision: values.length > 6,
      valueOverflow: false,
      scaleMode: highVariance ? 'log-compressed' : 'linear'
    }
  };
}

module.exports = { renderFunnelChart };
