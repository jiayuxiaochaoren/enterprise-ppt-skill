const { rect, renderChartFrame, text } = require('./chart-layout');

function tableRows(spec = {}) {
  if (spec.table && Array.isArray(spec.table.rows)) return spec.table.rows;
  return (spec.series || []).flatMap(series => series.values || []).map(value => ({
    title: value.category,
    value: value.rawValue || value.value,
    body: value.note
  }));
}

function renderTableWithCommentary(ctx, spec = {}, opts = {}) {
  const C = ctx.colors;
  const rows = tableRows(spec).slice(0, opts.max || 5);
  if (spec.kind === 'informationGap' || !rows.length) return { rendered: false, reason: 'table requires rows' };
  const frame = renderChartFrame(ctx, spec, opts);
  const plot = frame.plot;
  const rowH = Math.min(0.48, (plot.h - 0.16) / Math.max(1, rows.length));
  rows.forEach((row, i) => {
    const y = plot.y + 0.06 + i * rowH;
    const title = typeof row === 'string' ? row : (row.title || row.label || row.name || (Array.isArray(row) ? row[0] : ''));
    const value = typeof row === 'string' ? '' : (row.value || row.amount || (Array.isArray(row) ? row[1] : ''));
    const body = typeof row === 'string' ? '' : (row.body || row.note || row.description || (Array.isArray(row) ? row.slice(2).join(' / ') : ''));
    rect(ctx, plot.x, y, plot.w, rowH - 0.08, i === 0 ? (C.panelAlt || 'F1F5F9') : ctx.panelFill(), C.line, {
      fill: { color: i === 0 ? (C.panelAlt || 'F1F5F9') : ctx.panelFill(), transparency: i === 0 ? 0 : 8 },
      line: { color: C.line, transparency: 18, width: 0.30 }
    });
    text(ctx, title, {
      x: plot.x + 0.18,
      y: y + 0.12,
      w: 1.34,
      h: 0.12,
      typeRole: 'tableHeader',
      fontSize: 7.1,
      bold: true,
      color: C.text,
      fit: 'shrink'
    });
    if (value) {
      text(ctx, value, {
        x: plot.x + 1.70,
        y: y + 0.12,
        w: 0.78,
        h: 0.12,
        typeRole: 'number',
        fontSize: 7.1,
        bold: true,
        color: C.accent,
        align: 'right',
        fit: 'shrink'
      });
    }
    text(ctx, body, {
      x: plot.x + 2.72,
      y: y + 0.12,
      w: plot.w - 2.92,
      h: 0.12,
      typeRole: 'tableBody',
      fontSize: 6.8,
      color: C.body,
      fit: 'shrink'
    });
  });
  return {
    rendered: true,
    rendererModule: 'components/table-with-commentary',
    componentId: 'table-with-commentary',
    bbox: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
    itemCount: rows.length,
    visualChecks: {
      axisLabels: false,
      unitVisible: Boolean(spec.unit),
      sourceVisible: frame.sourceVisible,
      labelCollision: rows.length > 5,
      valueOverflow: false
    }
  };
}

module.exports = { renderTableWithCommentary };
