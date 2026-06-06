function renderProductMatrix(ctx = {}, items = [], opts = {}) {
  const list = (items || []).filter(Boolean).slice(0, opts.max || 4);
  if (!list.length) return { rendered: false, itemCount: 0 };
  const slide = ctx.slide;
  const C = ctx.colors || {};
  const z = opts.bbox || { x:8.04, y:4.92, w:3.58, h:0.58 };
  const dark = Boolean(opts.dark);
  const addRect = ctx.addRect || (() => {});
  const addLabel = ctx.addLabel || (() => {});
  const addText = ctx.addText || (() => {});
  const compactText = ctx.compactText || ((text = '', maxChars = 32) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxChars));
  const panelFill = typeof ctx.panelFill === 'function' ? ctx.panelFill : (() => C.white || 'FFFFFF');
  const itemTitle = opts.itemTitle || ((value, fallback = '') => typeof value === 'string' ? value : ((value && (value.title || value.label || value.name || value.value)) || fallback));
  const x = z.x;
  const y = z.y;

  addRect(slide, x, y, z.w, z.h, dark ? C.ink2 : panelFill(), dark ? C.darkLine : C.line, {
    fill:{ color:dark ? C.ink2 : panelFill(), transparency:dark ? 18 : 0 },
    line:{ color:dark ? C.darkLine : C.line, transparency:dark ? 48 : 14, width:0.38 }
  });
  addLabel(slide, opts.label || 'PRODUCT PROOF MATRIX', {
    x:x + 0.18,
    y:y + 0.15,
    w:1.42,
    h:0.08,
    fontSize:4.7,
    color:dark ? C.cyan : C.accent,
    charSpace:0.35
  });

  if ((z.h || 0) < 1.05) {
    addText(slide, list.map(item => compactText(item.product || itemTitle(item, 'Proof'), 16)).join('  /  '), {
      x:x + 1.68,
      y:y + 0.14,
      w:Math.max(1.0, z.w - 1.90),
      h:0.12,
      fontSize:6.8,
      color:dark ? C.captionOnImage : C.body,
      fit:'shrink'
    });
    const proofLine = list
      .map(item => item.benefit || item.scene || item.businessMeaning)
      .filter(Boolean)
      .map(value => compactText(value, 14))
      .join('  ·  ');
    if (proofLine) {
      addText(slide, proofLine, {
        x:x + 0.18,
        y:y + 0.38,
        w:Math.max(1.0, z.w - 0.36),
        h:0.10,
        fontSize:6.0,
        color:dark ? C.darkMuted : C.body,
        fit:'shrink'
      });
    }
    return {
      id: 'product-matrix',
      rendered: true,
      rendererModule: 'components/product-matrix',
      bbox: z,
      itemCount: list.length,
      drawnCount: list.length
    };
  }

  const headers = [
    ['PRODUCT', 'product'],
    ['SCENE', 'scene'],
    ['PROOF', 'benefit'],
    ['BUSINESS', 'businessMeaning']
  ];
  const top = y + 0.40;
  const rowH = Math.min(0.36, Math.max(0.22, (z.h - 0.56) / Math.max(1, list.length)));
  const colW = (z.w - 0.36) / headers.length;
  headers.forEach(([label], i) => {
    addLabel(slide, label, {
      x:x + 0.18 + i * colW,
      y:top,
      w:Math.max(0.52, colW - 0.04),
      h:0.08,
      fontSize:4.5,
      color:i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet),
      charSpace:0.28
    });
  });
  list.forEach((item, row) => {
    const rowY = top + 0.18 + row * rowH;
    headers.forEach(([, key], i) => {
      const value = item[key] || (i === 0 ? itemTitle(item, 'Product') : '');
      addText(slide, compactText(value, 18), {
        x:x + 0.18 + i * colW,
        y:rowY,
        w:Math.max(0.52, colW - 0.04),
        h:Math.max(0.09, rowH - 0.06),
        fontSize:5.9,
        bold:i === 0,
        color:dark ? C.captionOnImage : C.body,
        fit:'shrink',
        breakLine:true
      });
    });
  });
  return {
    id: 'product-matrix',
    rendered: true,
    rendererModule: 'components/product-matrix',
    bbox: z,
    itemCount: list.length,
    drawnCount: list.length
  };
}

module.exports = {
  renderProductMatrix
};
