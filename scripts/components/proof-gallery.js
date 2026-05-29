function titleOf(item, fallback = '') {
  if (typeof item === 'string') return item || fallback;
  return item.title || item.label || item.name || item.metric || fallback;
}

function bodyOf(item, fallback = '') {
  if (typeof item === 'string') return fallback;
  return item.body || item.note || item.text || item.description || item.summary || fallback;
}

function compact(ctx, text = '', maxChars = 32) {
  return ctx.compactText ? ctx.compactText(text, maxChars) : String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars);
}

function renderProofGallery(ctx, items = [], opts = {}) {
  const C = ctx.colors;
  const dark = Boolean(opts.dark);
  const list = (items || []).slice(0, opts.max || 3);
  if (!list.length) return { rendered: false, reason: 'no proof items' };

  const x = opts.x == null ? 8.02 : opts.x;
  const y = opts.y == null ? 5.54 : opts.y;
  const w = opts.w == null ? 3.72 : opts.w;
  const h = opts.h == null ? 0.74 : opts.h;
  const gap = opts.gap == null ? 0.08 : opts.gap;
  const cellW = (w - gap * Math.max(0, list.length - 1)) / Math.max(1, list.length);

  list.forEach((item, i) => {
    const cx = x + i * (cellW + gap);
    ctx.addRect(ctx.slide, cx, y, cellW, h, dark ? C.ink2 : ctx.panelFill(), dark ? C.darkLine : C.line, {
      fill: { color: dark ? C.ink2 : ctx.panelFill(), transparency: dark ? 18 : 0 },
      line: { color: dark ? C.darkLine : C.line, transparency: dark ? 46 : 14, width: 0.38 }
    });
    ctx.addLabel(ctx.slide, `PROOF ${i + 1}`, {
      x: cx + 0.12,
      y: y + 0.12,
      w: 0.62,
      h: 0.08,
      typeRole: 'microLabel',
      fontSize: 4.7,
      color: i === 0 ? C.accent : C.cyan,
      charSpace: 0.35
    });
    ctx.addText(ctx.slide, compact(ctx, titleOf(item, 'Evidence'), 22), {
      x: cx + 0.12,
      y: y + 0.30,
      w: cellW - 0.24,
      h: 0.13,
      typeRole: 'caption',
      fontSize: 6.9,
      bold: true,
      color: dark ? C.captionOnImage : C.text,
      fit: 'shrink'
    });
    const body = compact(ctx, bodyOf(item, ''), 28);
    if (body) {
      ctx.addText(ctx.slide, body, {
        x: cx + 0.12,
        y: y + 0.48,
        w: cellW - 0.24,
        h: 0.12,
        typeRole: 'caption',
        fontSize: 6.8,
        color: dark ? C.darkMuted : C.body,
        fit: 'shrink'
      });
    }
  });

  return {
    rendered: true,
    rendererModule: 'components/proof-gallery',
    bbox: { x, y, w, h },
    itemCount: list.length
  };
}

module.exports = { renderProofGallery };
