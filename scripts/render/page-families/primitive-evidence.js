function createPrimitiveEvidence(ctx = {}, C = ctx.colors()) {
  function drawCaptionStack(slide, item, fallbackTitle, box = {}, opts = {}) {
    ctx.addEvidenceCaptionStack(slide, item, fallbackTitle || '证据', box, opts);
  }

  function drawImagePanel(slide, image, box = {}, opts = {}) {
    if (image && ctx.addSmartPhotoPanel) {
      ctx.addSmartPhotoPanel(slide, image, box.x, box.y, box.w, box.h, Object.assign({
        role:'evidence',
        tone:'light',
        transparency:100,
        stroke:C.line,
        strokeTransparency:24
      }, opts));
      return true;
    }
    if (ctx.genericShowcaseField) {
      ctx.genericShowcaseField(slide, box.x, box.y, box.w, box.h, opts.placeholder || 'EVIDENCE');
      return false;
    }
    ctx.addRect(slide, box.x, box.y, box.w, box.h, opts.fill || ctx.panelFill(), opts.lineColor || C.line, {
      fill:{color:opts.fill || ctx.panelFill(), transparency:opts.fillTransparency == null ? 6 : opts.fillTransparency},
      line:{color:opts.lineColor || C.line, transparency:opts.lineTransparency == null ? 24 : opts.lineTransparency}
    });
    return false;
  }

  function drawEvidencePanel(slide, item, box = {}, opts = {}) {
    const accent = opts.accent || C.accent;
    ctx.addRect(slide, box.x, box.y, box.w, box.h, ctx.panelFill(), opts.lineColor || C.line, {
      fill:{color:ctx.panelFill(), transparency:opts.fillTransparency || 0},
      line:{color:opts.lineColor || C.line, transparency:opts.lineTransparency == null ? 16 : opts.lineTransparency, width:opts.lineWidth || 0.42}
    });
    ctx.addEvidenceCaptionStack(slide, item, opts.fallbackTitle || '证据', {
      x:box.x + (opts.captionX || 0.24),
      y:box.y + (opts.captionY || 0.14),
      w:box.w - (opts.captionWInset || 0.48),
      h:box.h - (opts.captionHInset || 0.26)
    }, Object.assign({ accent }, opts.caption || {}));
  }

  function drawEvidenceBoard(slide, items = [], boxes = [], opts = {}) {
    const images = opts.images || [];
    boxes.slice(0, items.length || boxes.length).forEach((box, i) => {
      const item = items[i] || {};
      const accent = typeof opts.accentForIndex === 'function'
        ? opts.accentForIndex(i, item)
        : ((opts.accents || [])[i] || opts.accent || C.accent);
      drawEvidencePanel(slide, item, box, Object.assign({}, opts.panel || {}, {
        accent,
        caption: Object.assign({
          number:i + 1
        }, opts.caption || {})
      }));
      if (images[i] && opts.imageBoxFor) {
        drawImagePanel(slide, images[i], opts.imageBoxFor(box, i), opts.image || {});
      }
    });
  }

  return {
    drawCaptionStack,
    drawEvidenceBoard,
    drawEvidencePanel,
    drawImagePanel
  };
}

module.exports = {
  createPrimitiveEvidence
};
