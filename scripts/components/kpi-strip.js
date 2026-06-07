function metricValue(metric = {}) {
  return metric.value || metric.amount || metric.delta || '';
}

function metricLabel(metric = {}, fallback = '') {
  return metric.label || metric.title || metric.name || fallback;
}

function metricNote(metric = {}) {
  return metric.note || metric.body || metric.unit || metric.description || '';
}

function renderKpiStrip(ctx, metrics = [], opts = {}) {
  const C = ctx.colors;
  const list = (metrics || []).slice(0, opts.max || 4);
  if (!list.length) return { rendered: false, reason: 'no metrics' };

  const x = opts.x == null ? 0.86 : opts.x;
  const y = opts.y == null ? 5.90 : opts.y;
  const w = opts.w == null ? 10.60 : opts.w;
  const h = opts.h == null ? 0.72 : opts.h;
  const gap = opts.gap == null ? 0.18 : opts.gap;
  const fill = opts.fill || ctx.panelFill();
  const cellW = (w - gap * Math.max(0, list.length - 1)) / Math.max(1, list.length);
  const sourceNote = String(opts.sourceNote || opts.source || '').trim();

  list.forEach((metric, i) => {
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
    const cx = x + i * (cellW + gap);
    ctx.addRect(ctx.slide, cx, y, cellW, h, fill, C.line, {
      fill: { color: fill, transparency: opts.transparency || 0 },
      line: { color: i === 0 ? accent : C.line, transparency: i === 0 ? 18 : 14, width: 0.42 }
    });
    ctx.addLabel(ctx.slide, metricLabel(metric, `Metric ${i + 1}`), {
      x: cx + 0.16,
      y: y + 0.13,
      w: Math.min(1.16, cellW - 0.24),
      h: 0.12,
      typeRole: 'metricSmall',
      fontSize: 6.8,
      color: accent,
      charSpace: 0
    });
    ctx.addNumber(ctx.slide, metricValue(metric), {
      x: cx + 0.16,
      y: y + 0.36,
      w: Math.min(0.98, cellW - 0.28),
      h: 0.18,
      typeRole: 'metricMedium',
      fontSize: 13.2,
      color: accent,
      fit: 'shrink'
    });
    const note = metricNote(metric);
    if (note) {
      ctx.addText(ctx.slide, note, {
        x: cx + 1.16,
        y: y + 0.36,
        w: Math.max(0.50, cellW - 1.36),
        h: 0.12,
        typeRole: 'caption',
        fontSize: 6.8,
        color: C.body,
        fit: 'shrink'
      });
    }
  });

  if (sourceNote) {
    ctx.addText(ctx.slide, sourceNote, {
      x,
      y: y + h + 0.08,
      w,
      h: 0.11,
      typeRole: 'sourceNote',
      fontSize: 6.3,
      color: C.muted,
      fit: 'shrink'
    });
  }

  return {
    rendered: true,
    rendererModule: 'components/kpi-strip',
    bbox: { x, y, w, h },
    itemCount: list.length,
    visualChecks: {
      sourceVisible: Boolean(sourceNote),
      unitVisible: list.some(metric => metric.unit || /%|％|bps|bp|pt|pts|x|倍|w|万|亿|bn|m|mn|JPY|RMB|USD|CNY|¥|\$|min|分钟|天|月|年/i.test(String(metricValue(metric))))
    }
  };
}

module.exports = { renderKpiStrip };
