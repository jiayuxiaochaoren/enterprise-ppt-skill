const { chartColors, clamp, line, numericValues, rawValueLabel, renderChartFrame, text } = require('./chart-layout');

function renderLineChart(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const values = numericValues(spec).slice(0, opts.max || 8);
  if (spec.kind === 'informationGap' || values.length < 2) return { rendered: false, reason: 'line chart requires at least two values' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const nums = values.map(v => v.number);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = Math.max(1, max - min);
  const colors = chartColors(ctx);
  const axisY = plot.y + plot.h - 0.28;
  line(ctx, plot.x, axisY, plot.w, 0, C.line, { transparency: 10, width: 0.48 });
  line(ctx, plot.x, plot.y + 0.08, 0, plot.h - 0.34, C.line, { transparency: 24, width: 0.34 });
  const step = plot.w / Math.max(1, values.length - 1);
  const points = values.map((value, i) => {
    const x = plot.x + i * step;
    const y = axisY - ((value.number - min) / span) * (plot.h - 0.72) - 0.12;
    return { x, y, value };
  });
  for (let i = 1; i < points.length; i++) {
    line(ctx, points[i - 1].x, points[i - 1].y, points[i].x - points[i - 1].x, points[i].y - points[i - 1].y, C.accent, { transparency: 0, width: 1.05 });
  }
  points.forEach((point, i) => {
    const color = i === nums.indexOf(max) ? colors[0] : (i === nums.indexOf(min) ? colors[1] : colors[2]);
    ctx.slide.addShape('ellipse', {
      x: point.x - 0.075,
      y: point.y - 0.075,
      w: 0.15,
      h: 0.15,
      fill: { color },
      line: { color: 'FFFFFF', transparency: 0, width: 0.34 }
    });
    text(ctx, rawValueLabel(point.value, spec), {
      x: clamp(point.x - 0.42, plot.x, plot.x + plot.w - 0.84),
      y: point.y - 0.34,
      w: 0.84,
      h: 0.12,
      fontSize: 6.8,
      bold: true,
      color,
      align: 'center',
      fit: 'shrink'
    });
    text(ctx, point.value.category || `P${i + 1}`, {
      x: clamp(point.x - 0.40, plot.x, plot.x + plot.w - 0.80),
      y: axisY + 0.16,
      w: 0.80,
      h: 0.12,
      fontSize: 6.7,
      color: C.body,
      align: 'center',
      fit: 'shrink'
    });
  });
  return {
    rendered: true,
    rendererModule: 'components/line-chart',
    componentId: 'line-chart',
    bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
    itemCount: values.length,
    visualChecks: {
      axisLabels: true,
      unitVisible: Boolean(spec.unit),
      sourceVisible: frame.sourceVisible,
      labelCollision: values.length > 8,
      valueOverflow: false
    }
  };
}

module.exports = { renderLineChart };
