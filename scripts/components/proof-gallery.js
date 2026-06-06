function titleOf(item, fallback = '') {
  if (typeof item === 'string') return item || fallback;
  return item.title || item.label || item.name || item.metric || fallback;
}

function bodyOf(item, fallback = '') {
  if (typeof item === 'string') return fallback;
  return item.body || item.note || item.text || item.description || item.summary || fallback;
}

function captionOf(item, fallback = '') {
  if (typeof item === 'string') return fallback;
  return item.caption || item.source || item.sourceNote || item.source_note || fallback;
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
  const images = (Array.isArray(opts.images) ? opts.images : []).filter(Boolean);
  const sourceText = compact(ctx, opts.sourceNote || opts.source || captionOf(list[0], ''), 52);
  const captionText = compact(ctx, opts.caption || opts.explanation || bodyOf(list[0], ''), 74);
  const labelPrefix = opts.labelPrefix || 'PROOF';

  if (images.length && h >= 1.35 && typeof ctx.addSmartPhotoPanel === 'function') {
    const imageW = Math.min(w * 0.44, 2.72);
    const cardX = x + imageW + 0.14;
    const cardW = Math.max(1.2, w - imageW - 0.14);
    const captionH = captionText || sourceText ? 0.34 : 0;
    const stageH = Math.max(0.5, h - captionH);
    ctx.addRect(ctx.slide, x, y, w, h, dark ? C.ink2 : ctx.panelFill(), dark ? C.darkLine : C.line, {
      fill: { color: dark ? C.ink2 : ctx.panelFill(), transparency: dark ? 18 : 0 },
      line: { color: dark ? C.darkLine : C.line, transparency: dark ? 46 : 14, width: 0.38 }
    });
    ctx.addSmartPhotoPanel(ctx.slide, images[0], x + 0.10, y + 0.10, imageW - 0.20, stageH - 0.20, {
      role:'evidence',
      tone:dark ? 'dark' : 'light',
      transparency:dark ? 42 : 88,
      stroke:dark ? C.darkLine : C.line,
      strokeTransparency:dark ? 44 : 26
    });
    const cardCount = Math.min(3, list.length);
    const cardGap = 0.08;
    const cardH = (stageH - 0.20 - cardGap * Math.max(0, cardCount - 1)) / Math.max(1, cardCount);
    list.slice(0, cardCount).forEach((item, i) => {
      const cy = y + 0.10 + i * (cardH + cardGap);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      ctx.addRect(ctx.slide, cardX, cy, cardW - 0.10, cardH, dark ? C.ink : 'FFFFFF', accent, {
        fill:{ color:dark ? C.ink : 'FFFFFF', transparency:dark ? 8 : 0 },
        line:{ color:accent, transparency:30, width:0.34 }
      });
      ctx.addLabel(ctx.slide, `${labelPrefix} ${i + 1}`, {
        x:cardX + 0.12,
        y:cy + 0.12,
        w:0.72,
        h:0.08,
        typeRole:'microLabel',
        fontSize:4.7,
        color:accent,
        charSpace:0.35
      });
      ctx.addText(ctx.slide, compact(ctx, titleOf(item, 'Evidence'), 24), {
        x:cardX + 0.92,
        y:cy + 0.10,
        w:Math.max(0.72, cardW - 1.12),
        h:0.11,
        typeRole:'caption',
        fontSize:6.7,
        bold:true,
        color:dark ? C.captionOnImage : C.text,
        fit:'shrink'
      });
      const body = compact(ctx, bodyOf(item, ''), 38);
      if (body) {
        ctx.addText(ctx.slide, body, {
          x:cardX + 0.12,
          y:cy + 0.30,
          w:Math.max(0.72, cardW - 0.34),
          h:Math.max(0.11, cardH - 0.38),
          typeRole:'caption',
          fontSize:6.4,
          color:dark ? C.darkMuted : C.body,
          fit:'shrink',
          breakLine:true
        });
      }
    });
    if (captionH) {
      ctx.addLabel(ctx.slide, 'CAPTION', {
        x:x + 0.12,
        y:y + h - 0.22,
        w:0.72,
        h:0.08,
        typeRole:'microLabel',
        fontSize:4.7,
        color:C.accent,
        charSpace:0.35
      });
      ctx.addText(ctx.slide, captionText || sourceText, {
        x:x + 0.92,
        y:y + h - 0.23,
        w:Math.max(0.8, w - 1.04),
        h:0.10,
        typeRole:'caption',
        fontSize:6.2,
        color:dark ? C.captionOnImage : C.body,
        fit:'shrink'
      });
    }
    return {
      rendered: true,
      rendererModule: 'components/proof-gallery',
      rendererMethod: 'story',
      bbox: { x, y, w, h },
      itemCount: list.length,
      imageCount: images.length
    };
  }

  const gap = opts.gap == null ? 0.08 : opts.gap;
  const cellW = (w - gap * Math.max(0, list.length - 1)) / Math.max(1, list.length);

  list.forEach((item, i) => {
    const cx = x + i * (cellW + gap);
    ctx.addRect(ctx.slide, cx, y, cellW, h, dark ? C.ink2 : ctx.panelFill(), dark ? C.darkLine : C.line, {
      fill: { color: dark ? C.ink2 : ctx.panelFill(), transparency: dark ? 18 : 0 },
      line: { color: dark ? C.darkLine : C.line, transparency: dark ? 46 : 14, width: 0.38 }
    });
    ctx.addLabel(ctx.slide, `${labelPrefix} ${i + 1}`, {
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
