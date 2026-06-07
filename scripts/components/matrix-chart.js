const { chartColors, cleanColor, clamp, numericValues, rect, renderChartFrame, text } = require('./chart-layout');

function matrixCells(spec = {}) {
  if (spec.matrix && Array.isArray(spec.matrix.rows) && Array.isArray(spec.matrix.columns)) {
    const rows = spec.matrix.rows.slice(0, 5);
    const cols = spec.matrix.columns.slice(0, 5);
    const values = spec.matrix.values || [];
    return { rows, cols, values };
  }
  const values = numericValues(spec).slice(0, 9);
  const rows = ['High', 'Medium', 'Low'];
  const cols = ['Low', 'Medium', 'High'];
  const grid = rows.map(() => cols.map(() => null));
  values.forEach((value, i) => {
    const r = i % rows.length;
    const c = Math.floor(i / rows.length) % cols.length;
    grid[r][c] = value;
  });
  return { rows, cols, values: grid };
}

function renderMatrixChart(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const cells = matrixCells(spec);
  if (spec.kind === 'informationGap' || cells.rows.length < 2 || cells.cols.length < 2) return { rendered: false, reason: 'matrix requires rows and columns' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const colors = chartColors(ctx);
  const rowH = (plot.h - 0.42) / cells.rows.length;
  const colW = (plot.w - 1.02) / cells.cols.length;
  cells.cols.forEach((col, i) => {
    text(ctx, col, {
      x: plot.x + 0.92 + i * colW,
      y: plot.y,
      w: colW - 0.06,
      h: 0.12,
      fontSize: 6.6,
      color: C.muted,
      align: 'center',
      fit: 'shrink'
    });
  });
  cells.rows.forEach((row, ri) => {
    const y = plot.y + 0.32 + ri * rowH;
    text(ctx, row, {
      x: plot.x,
      y: y + rowH / 2 - 0.06,
      w: 0.78,
      h: 0.12,
      fontSize: 6.7,
      bold: true,
      color: C.body,
      fit: 'shrink'
    });
    cells.cols.forEach((_, ci) => {
      const x = plot.x + 0.92 + ci * colW;
      const raw = cells.values[ri] && cells.values[ri][ci];
      const value = raw && typeof raw === 'object' ? raw : { rawValue: raw, value: raw };
      const numeric = Number(value.value != null ? value.value : value.rawValue);
      const color = colors[(ri + ci) % colors.length];
      const fillTransparency = Number.isFinite(numeric)
        ? clamp(78 - Math.abs(numeric), 8, 72)
        : (raw == null ? 88 : 18);
      rect(ctx, x, y, colW - 0.06, rowH - 0.07, raw == null ? C.panelAlt || 'F1F5F9' : color, C.line, {
        fill: { color: cleanColor(raw == null ? C.panelAlt || 'F1F5F9' : color), transparency: fillTransparency },
        line: { color: cleanColor(C.line), transparency: 18, width: 0.30 }
      });
      if (raw != null) {
        const cellText = value.label || value.title || value.rawValue || value.value || String(raw);
        const valueLike = /[+-]?\d/.test(String(cellText || ''));
        text(ctx, cellText, {
          x: x + 0.08,
          y: y + rowH / 2 - (valueLike ? 0.10 : 0.08),
          w: colW - 0.22,
          h: valueLike ? 0.18 : 0.13,
          fontSize: valueLike ? 9.2 : 6.8,
          bold: true,
          color: C.text,
          align: 'center',
          fit: 'shrink'
        });
      }
    });
  });
  return {
    rendered: true,
    rendererModule: 'components/matrix-chart',
    componentId: spec.kind === 'heatmap' ? 'heatmap-chart' : 'matrix-chart',
    bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
    itemCount: cells.rows.length * cells.cols.length,
    visualChecks: {
      axisLabels: true,
      unitVisible: Boolean(spec.unit),
      sourceVisible: frame.sourceVisible,
      labelCollision: cells.rows.length * cells.cols.length > 20,
      valueOverflow: false
    }
  };
}

module.exports = { renderMatrixChart };
