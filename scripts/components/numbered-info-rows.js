function colorsOf(ctx = {}) {
  return typeof ctx.colors === 'function' ? ctx.colors() : (ctx.colors || {});
}

function panelFillOf(ctx = {}, fallback = 'FFFFFF') {
  return typeof ctx.panelFill === 'function' ? ctx.panelFill() : fallback;
}

function defaultAccentFor(index, colors = {}) {
  if (index === 0) return colors.accent;
  if (index === 1) return colors.cyan;
  if (index === 2) return colors.violet;
  return colors.muted || colors.accent;
}

function centerY(rowY, rowH, boxH) {
  return rowY + Math.max(0, (rowH - boxH) / 2);
}

function renderNumberedInfoRows(ctx = {}, items = [], opts = {}) {
  const slide = ctx.slide;
  const list = (items || []).filter(Boolean).slice(0, opts.max || 4);
  if (!slide || !list.length) return { rendered: false, itemCount: 0 };

  const C = colorsOf(ctx);
  const addRect = ctx.addRect || (() => {});
  const addNumber = ctx.addNumber || (() => {});
  const addText = ctx.addText || (() => {});
  const itemTitle = opts.itemTitle || ((item, fallback = '') => (
    typeof item === 'string'
      ? item
      : ((item && (item.title || item.label || item.value || item.name)) || fallback)
  ));
  const itemBody = opts.itemBody || ((item = {}) => item.body || item.note || item.text || item.description || '');

  const x = opts.x == null ? 6.58 : opts.x;
  const y = opts.y == null ? 2.02 : opts.y;
  const w = opts.w == null ? 5.18 : opts.w;
  const rowH = opts.rowH == null ? 0.74 : opts.rowH;
  const gap = opts.gap == null ? 0.22 : opts.gap;
  const fill = opts.fill || panelFillOf(ctx, C.white || 'FFFFFF');
  const line = opts.line || C.line || 'D8D0CD';
  const badge = opts.badge || 0.38;
  const titleH = opts.titleH || 0.24;
  const bodyH = opts.bodyH || 0.44;
  const titleX = opts.titleX == null ? x + 0.78 : opts.titleX;
  const titleW = opts.titleW == null ? 0.78 : opts.titleW;
  const bodyX = opts.bodyX == null ? x + 1.74 : opts.bodyX;
  const bodyW = opts.bodyW == null ? Math.max(0.60, w - (bodyX - x) - 0.30) : opts.bodyW;
  const accentFor = typeof opts.accentFor === 'function' ? opts.accentFor : defaultAccentFor;

  list.forEach((item, i) => {
    const rowY = y + i * (rowH + gap);
    const accent = accentFor(i, C);
    const rowCenterY = rowY + rowH / 2;
    addRect(slide, x, rowY, w, rowH, fill, line, {
      fill: { color: fill, transparency: opts.fillTransparency || 0 },
      line: {
        color: i === 0 ? accent : line,
        transparency: i === 0 ? 22 : 16,
        width: 0.48
      }
    });
    addRect(slide, x + 0.24, rowCenterY - badge / 2, badge, badge, accent, accent, {
      fill: { color: accent, transparency: 88 },
      line: { color: accent, transparency: 28, width: 0.5 }
    });
    addNumber(slide, String(i + 1).padStart(2, '0'), {
      x: x + 0.24,
      y: rowCenterY - badge / 2,
      w: badge,
      h: badge,
      fontSize: opts.numberFontSize || 8.6,
      color: accent,
      align: 'center',
      valign: 'mid',
      margin: 0,
      allowTiny: true
    });
    addText(slide, itemTitle(item, `能力 ${i + 1}`), {
      x: titleX,
      y: centerY(rowY, rowH, titleH),
      w: titleW,
      h: titleH,
      fontSize: opts.titleFontSize || 10.4,
      bold: true,
      color: C.text,
      fit: false,
      noFit: true,
      valign: 'mid'
    });
    addText(slide, itemBody(item), {
      x: bodyX,
      y: centerY(rowY, rowH, bodyH),
      w: bodyW,
      h: bodyH,
      fontSize: opts.bodyFontSize || 9.2,
      color: C.body,
      breakLine: true,
      fit: false,
      noFit: true,
      valign: 'mid'
    });
  });

  return {
    id: opts.id || 'numbered-info-rows',
    rendered: true,
    rendererModule: 'components/numbered-info-rows',
    bbox: { x, y, w, h: list.length * rowH + Math.max(0, list.length - 1) * gap },
    itemCount: list.length,
    drawnCount: list.length
  };
}

module.exports = {
  renderNumberedInfoRows
};
