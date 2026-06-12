function titleOf(point, fallback = '') {
  if (typeof point === 'string') return point || fallback;
  return point.title || point.label || point.name || point.step || fallback;
}

function renderValueChain(ctx, points = [], opts = {}) {
  const C = ctx.colors;
  const dark = Boolean(opts.dark);
  const labels = (points || []).slice(0, opts.max || 3);
  if (!labels.length) return { rendered: false, reason: 'no value-chain points' };

  const x = opts.x == null ? 7.72 : opts.x;
  const y = opts.y == null ? 5.66 : opts.y;
  const w = opts.w == null ? 3.86 : opts.w;
  const h = opts.h == null ? 0.62 : opts.h;
  const gap = opts.gap == null ? 0.08 : opts.gap;
  const cellW = (w - gap * Math.max(0, labels.length - 1)) / Math.max(1, labels.length);

  labels.forEach((point, i) => {
    const cx = x + i * (cellW + gap);
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
    ctx.addRect(ctx.slide, cx, y, cellW, h, dark ? C.ink2 : ctx.panelFill(), accent, {
      fill: { color: dark ? C.ink2 : ctx.panelFill(), transparency: dark ? 18 : 0 },
      line: { color: accent, transparency: 26, width: 0.42 }
    });
    ctx.addLabel(ctx.slide, (opts.labels || ['INPUT', 'ACTION', 'OUTCOME'])[i] || `STEP ${i + 1}`, {
      x: cx + 0.12,
      y: y + 0.13,
      w: 0.72,
      h: 0.08,
      typeRole: 'microLabel',
      fontSize: 4.8,
      color: accent,
      charSpace: 0.4
    });
    ctx.addText(ctx.slide, titleOf(point, String(point)), {
      x: cx + 0.12,
      y: y + 0.32,
      w: cellW - 0.24,
      h: 0.13,
      typeRole: 'caption',
      fontSize: 6.9,
      bold: true,
      color: dark ? C.captionOnImage : C.text,
      fit: 'shrink'
    });
  });

  return {
    rendered: true,
    rendererModule: 'components/value-chain',
    bbox: { x, y, w, h },
    itemCount: labels.length
  };
}

module.exports = { renderValueChain };
