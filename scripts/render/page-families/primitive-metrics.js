function createPrimitiveMetrics(ctx = {}, C = ctx.colors()) {
  function drawMetricCard(slide, metric = {}, box = {}, opts = {}) {
    const accent = opts.accent || C.accent;
    ctx.addRect(slide, box.x, box.y, box.w, box.h, ctx.panelFill(), C.line, {
      fill:{color:ctx.panelFill(), transparency:opts.fillTransparency || 0},
      line:{color:opts.lineColor || C.line, transparency:opts.lineTransparency == null ? 16 : opts.lineTransparency, width:opts.lineWidth || 0.34}
    });
    ctx.addNumber(slide, metric.value || metric.title || '', {
      x:box.x + 0.14,
      y:box.y + 0.13,
      w:0.62,
      h:0.12,
      fontSize:9.0,
      color:accent,
      fit:'shrink'
    });
    ctx.addText(slide, metric.label || metric.body || '', {
      x:box.x + 0.86,
      y:box.y + 0.11,
      w:0.60,
      h:0.12,
      fontSize:8.8,
      color:C.body,
      fit:'shrink'
    });
  }

  function drawMetricRow(slide, metrics = [], box = {}, opts = {}) {
    const items = metrics.slice(0, opts.max || 4);
    const gap = box.gap == null ? (opts.gap == null ? 0.30 : opts.gap) : box.gap;
    const cardW = box.cardW || opts.cardW || (items.length ? (box.w - gap * Math.max(0, items.length - 1)) / items.length : 0);
    const cardH = box.cardH || box.h || opts.cardH || 0.46;
    items.forEach((metric, i) => {
      const accent = typeof opts.accentForIndex === 'function'
        ? opts.accentForIndex(i, metric)
        : ((opts.accents || [])[i] || opts.accent || C.accent);
      drawMetricCard(slide, metric, {
        x:box.x + i * (cardW + gap),
        y:box.y,
        w:cardW,
        h:cardH
      }, Object.assign({}, opts.card || {}, { accent }));
    });
  }

  return {
    drawMetricCard,
    drawMetricRow
  };
}

module.exports = {
  createPrimitiveMetrics
};
