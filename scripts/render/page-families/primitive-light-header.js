function createLightPageHeader(ctx = {}, C = ctx.colors(), chrome = {}) {
  const {
    drawNumberPageNumber,
    drawTextPageNumber
  } = chrome;

  return function drawLightPageHeader(slide, opts = {}) {
    if (opts.canvas !== false) ctx.lightCanvas(slide, opts.canvasOpts || {});
    ctx.sectionKicker(slide, opts.kicker || '', opts.x || 0.86, opts.y || 0.72, false);
    const titleOpts = {
      x:opts.titleX || 0.84,
      y:opts.titleY || 1.05,
      w:opts.titleW || 5.8,
      h:opts.titleH || 0.35,
      fontSize:opts.titleSize || 24,
      bold:true,
      color:opts.titleColor || C.text
    };
    if (opts.titleFit !== false) titleOpts.fit = opts.titleFit || 'shrink';
    if (opts.titleBreakLine != null) titleOpts.breakLine = opts.titleBreakLine;
    ctx.addText(slide, opts.title || '', titleOpts);
    if (opts.subtitle) {
      const subtitleOpts = {
        x:opts.subtitleX || 0.86,
        y:opts.subtitleY || 1.52,
        w:opts.subtitleW || 6.3,
        h:opts.subtitleH || 0.20,
        fontSize:opts.subtitleSize || 10.0,
        color:opts.subtitleColor || C.muted
      };
      if (opts.subtitleFit !== false) subtitleOpts.fit = opts.subtitleFit || 'shrink';
      if (opts.subtitleBreakLine != null) subtitleOpts.breakLine = opts.subtitleBreakLine;
      ctx.addText(slide, opts.subtitle, subtitleOpts);
    }
    if (opts.idx != null) {
      if (opts.pageNumber === 'chrome' && typeof ctx.PageNumber === 'function') {
        ctx.PageNumber(slide, opts.idx, opts.pageNumberOpts || {});
        return;
      }
      if (opts.pageNumberMethod === 'text') {
        drawTextPageNumber(slide, opts.idx, Object.assign({
          x:11.70,
          y:0.66,
          w:0.72,
          h:0.22,
          fontSize:13,
          bold:true,
          color:C.accent,
          align:'right'
        }, opts.pageNumberOpts || {}));
        return;
      }
      drawNumberPageNumber(slide, opts.idx, Object.assign({
        x:11.70,
        y:0.66,
        w:0.72,
        h:0.22,
        fontSize:13,
        color:C.accent,
        align:'right'
      }, opts.pageNumberOpts || {}));
    }
  };
}

module.exports = {
  createLightPageHeader
};
