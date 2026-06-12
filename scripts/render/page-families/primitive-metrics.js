const {
  centerY,
  centeredStackY
} = require('../layout/card-layout');

function createPrimitiveMetrics(ctx = {}, C = ctx.colors()) {
  function drawMetricCard(slide, metric = {}, box = {}, opts = {}) {
    const accent = opts.accent || C.accent;
    const fillColor = opts.fillColor || ctx.panelFill();
    const lineColor = opts.lineColor || C.line;
    const padX = opts.padX == null ? 0.16 : opts.padX;
    const contentW = Math.max(0.1, box.w - padX * 2);
    const label = metric.label || metric.body || '';
    const value = metric.value || metric.title || '';
    const note = metric.note || metric.caption || metric.description || metric.subtitle || '';
    ctx.addRect(slide, box.x, box.y, box.w, box.h, fillColor, lineColor, {
      fill:{color:fillColor, transparency:opts.fillTransparency || 0},
      line:{
        color:lineColor,
        transparency:opts.lineTransparency == null ? 30 : opts.lineTransparency,
        width:opts.lineWidth == null ? 0.28 : opts.lineWidth
      }
    });

    if (opts.layout === 'inline' || (box.h < 0.38 && !note)) {
      const rowH = Math.min(0.18, Math.max(0.12, box.h - 0.14));
      const rowY = centerY(box.y, box.h, rowH);
      ctx.addNumber(slide, value, {
        x:box.x + padX,
        y:rowY,
        w:Math.min(0.72, contentW * 0.44),
        h:rowH,
        fontSize:opts.valueFontSize || 8.8,
        color:accent,
        fit:'shrink',
        valign:'mid'
      });
      ctx.addText(slide, label, {
        x:box.x + padX + Math.min(0.82, contentW * 0.48),
        y:rowY,
        w:Math.max(0.1, contentW - Math.min(0.82, contentW * 0.48)),
        h:rowH,
        fontSize:opts.labelFontSize || 7.8,
        color:C.body,
        fit:'shrink',
        valign:'mid'
      });
      return;
    }

    const compact = box.h < 0.72;
    const labelH = opts.labelH || (compact ? 0.10 : 0.12);
    const valueH = opts.valueH || (compact ? 0.15 : 0.20);
    const noteH = note ? (opts.noteH || (compact ? 0.10 : 0.12)) : 0;
    const gap = opts.stackGap == null ? (compact ? 0.035 : 0.055) : opts.stackGap;
    const stackYs = centeredStackY(
      box.y,
      box.h,
      note ? [labelH, valueH, noteH] : [labelH, valueH],
      gap
    );
    const align = opts.align || 'left';
    ctx.addText(slide, label, {
      x:box.x + padX,
      y:stackYs[0],
      w:contentW,
      h:labelH,
      fontSize:opts.labelFontSize || (compact ? 6.8 : 7.4),
      color:opts.labelColor || C.body,
      bold:opts.labelBold !== false,
      fit:'shrink',
      align,
      valign:'mid'
    });
    ctx.addNumber(slide, value, {
      x:box.x + padX,
      y:stackYs[1],
      w:contentW,
      h:valueH,
      fontSize:opts.valueFontSize || (compact ? 10.0 : 13.4),
      color:accent,
      bold:true,
      fit:'shrink',
      align,
      valign:'mid'
    });
    if (note) {
      ctx.addText(slide, note, {
        x:box.x + padX,
        y:stackYs[2],
        w:contentW,
        h:noteH,
        fontSize:opts.noteFontSize || (compact ? 6.2 : 6.8),
        color:opts.noteColor || C.body,
        fit:'shrink',
        align,
        valign:'mid'
      });
    }
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
