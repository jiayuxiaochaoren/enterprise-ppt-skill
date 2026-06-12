function riskTitle(row, fallback = '') {
  if (Array.isArray(row)) return row[0] || fallback;
  if (typeof row === 'string') return row || fallback;
  return row.title || row.risk || row.name || row.item || fallback;
}

function riskLevel(row) {
  if (Array.isArray(row)) return row[1] || '';
  if (!row || typeof row === 'string') return '';
  return row.level || row.severity || row.priority || row.owner || '';
}

function riskAction(row) {
  if (Array.isArray(row)) return row[2] || row.slice(1).join(' / ');
  if (!row || typeof row === 'string') return '';
  return row.action || row.response || row.ownerAction || row.body || row.note || row.description || '';
}

function renderRiskRegister(ctx, rows = [], opts = {}) {
  const C = ctx.colors;
  const dark = Boolean(opts.dark);
  const list = (rows || []).slice(0, opts.max || 3);
  if (!list.length) return { rendered: false, reason: 'no risk rows' };

  const x = opts.x == null ? 8.04 : opts.x;
  const y = opts.y == null ? 4.82 : opts.y;
  const w = opts.w == null ? 3.72 : opts.w;
  const rowH = opts.rowH == null ? 0.42 : opts.rowH;
  const h = opts.h == null ? (0.38 + list.length * rowH) : opts.h;
  const fill = dark ? C.ink2 : ctx.panelFill();
  ctx.addRect(ctx.slide, x, y, w, h, fill, dark ? C.darkLine : C.line, {
    fill: { color: fill, transparency: dark ? 18 : 0 },
    line: { color: dark ? C.darkLine : C.line, transparency: dark ? 42 : 14, width: 0.4 }
  });
  ctx.addLabel(ctx.slide, opts.label || 'RISK REGISTER', {
    x: x + 0.16,
    y: y + 0.14,
    w: 1.18,
    h: 0.08,
    typeRole: 'microLabel',
    fontSize: 4.9,
    color: dark ? C.cyan : C.risk,
    charSpace: 0.38
  });

  list.forEach((row, i) => {
    const cy = y + 0.42 + i * rowH;
    const accent = /高|high|critical/i.test(String(riskLevel(row))) ? C.risk : (i === 0 ? C.accent : C.cyan);
    ctx.slide.addShape('ellipse', {
      x: x + 0.16,
      y: cy + 0.03,
      w: 0.07,
      h: 0.07,
      fill: { color: accent },
      line: { color: accent, transparency: 100 }
    });
    ctx.addText(ctx.slide, riskTitle(row, `Risk ${i + 1}`), {
      x: x + 0.34,
      y: cy - 0.02,
      w: 1.06,
      h: 0.11,
      typeRole: 'tableHeader',
      fontSize: 6.6,
      bold: true,
      color: dark ? C.captionOnImage : C.text,
      fit: 'shrink',
      valign: 'mid'
    });
    const level = riskLevel(row);
    if (level) {
      ctx.addText(ctx.slide, level, {
        x: x + 1.48,
        y: cy - 0.02,
        w: 0.42,
        h: 0.11,
        typeRole: 'microLabel',
        fontSize: 6.2,
        bold: true,
        color: accent,
        fit: 'shrink',
        valign: 'mid'
      });
    }
    const action = riskAction(row);
    if (action) {
      ctx.addText(ctx.slide, action, {
        x: x + 1.96,
        y: cy - 0.02,
        w: w - 2.16,
        h: 0.12,
        typeRole: 'tableBody',
        fontSize: 6.2,
        color: dark ? C.darkMuted : C.body,
        fit: 'shrink',
        valign: 'mid'
      });
    }
  });

  return {
    rendered: true,
    rendererModule: 'components/risk-register',
    bbox: { x, y, w, h },
    itemCount: list.length
  };
}

module.exports = { renderRiskRegister };
