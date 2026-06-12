const { chartColors, numericValues, rawValueLabel, rect, renderChartFrame, text } = require('./chart-layout');

function renderScorecard(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const values = numericValues(spec).slice(0, opts.max || 6);
  if (spec.kind === 'informationGap' || values.length < 1) return { rendered: false, reason: 'scorecard requires metrics' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const colors = chartColors(ctx);
  const cols = values.length === 4 ? 2 : (values.length <= 3 ? values.length : 3);
  const rows = Math.ceil(values.length / cols);
  const gap = 0.14;
  const cellW = (plot.w - gap * Math.max(0, cols - 1)) / Math.max(1, cols);
  const cellH = Math.min(1.02, (plot.h - gap * Math.max(0, rows - 1)) / Math.max(1, rows));
  const gridH = rows * cellH + gap * Math.max(0, rows - 1);
  const gridY = plot.y + Math.max(0, (plot.h - gridH) / 2);
  values.forEach((value, i) => {
    const cx = plot.x + (i % cols) * (cellW + gap);
    const cy = gridY + Math.floor(i / cols) * (cellH + gap);
    const color = colors[i % colors.length];
    rect(ctx, cx, cy, cellW, cellH, ctx.panelFill(), color, {
      fill: { color: ctx.panelFill(), transparency: 0 },
      line: { color, transparency: i === 0 ? 16 : 36, width: 0.42 }
    });
    text(ctx, value.category || `Metric ${i + 1}`, {
      x: cx + 0.14,
      y: cy + 0.16,
      w: cellW - 0.28,
      h: 0.12,
      typeRole: 'metricSmall',
      fontSize: 6.8,
      bold: true,
      color,
      fit: 'shrink'
    });
    text(ctx, rawValueLabel(value, spec), {
      x: cx + 0.14,
      y: cy + 0.42,
      w: Math.max(1.16, cellW - 0.28),
      h: 0.20,
      typeRole: 'metricMedium',
      fontSize: cellW < 1.72 ? 11.2 : 13.0,
      bold: true,
      color,
      fit: 'shrink'
    });
    if (value.note) {
      text(ctx, value.note, {
        x: cx + 0.14,
        y: cy + 0.72,
        w: cellW - 0.28,
        h: 0.14,
        typeRole: 'caption',
        fontSize: 6.4,
        color: C.body,
        fit: 'shrink'
      });
    }
  });
  return {
    rendered: true,
    rendererModule: 'components/scorecard',
    componentId: 'scorecard',
    bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
    itemCount: values.length,
    visualChecks: {
      axisLabels: false,
      unitVisible: Boolean(spec.unit),
      sourceVisible: frame.sourceVisible,
      labelCollision: values.length > 6,
      valueOverflow: false
    }
  };
}

module.exports = { renderScorecard };
