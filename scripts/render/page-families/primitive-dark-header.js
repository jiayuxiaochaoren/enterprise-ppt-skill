function createDarkPageHeader(ctx = {}, C = ctx.colors(), chrome = {}) {
  const {
    drawNumberPageNumber,
    drawTextPageNumber
  } = chrome;

  return function drawDarkPageHeader(slide, opts = {}) {
    if (opts.stage !== false) {
      if (opts.stageOpts === undefined) ctx.stageCanvas(slide);
      else ctx.stageCanvas(slide, opts.stageOpts);
    }
    ctx.sectionKicker(slide, opts.kicker || '', opts.x || 0.84, opts.y || 0.72, true);
    const titleOpts = {
      x:opts.titleX || 0.82,
      y:opts.titleY || 1.06,
      w:opts.titleW || 5.8,
      h:opts.titleH || 0.36,
      fontSize:opts.titleSize || 24,
      bold:true,
      color:opts.titleColor || C.white
    };
    if (opts.titleFit !== false) titleOpts.fit = opts.titleFit || 'shrink';
    if (opts.titleBreakLine != null) titleOpts.breakLine = opts.titleBreakLine;
    ctx.addText(slide, opts.title || '', titleOpts);
    if (opts.subtitle) {
      const subtitleOpts = {
        x:opts.subtitleX || 0.84,
        y:opts.subtitleY || 1.54,
        w:opts.subtitleW || 5.9,
        h:opts.subtitleH || 0.20,
        fontSize:opts.subtitleSize || 10.4,
        color:opts.subtitleColor || C.darkMuted || '94A3B8'
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
          x:11.76,
          y:0.74,
          w:0.58,
          h:0.18,
          fontSize:11.5,
          bold:true,
          color:C.accent,
          align:'right'
        }, opts.pageNumberOpts || {}));
        return;
      }
      drawNumberPageNumber(slide, opts.idx, Object.assign({
        x:11.76,
        y:0.74,
        w:0.58,
        h:0.18,
        fontSize:11.5,
        color:C.accent,
        align:'right'
      }, opts.pageNumberOpts || {}));
    }
  };
}

module.exports = {
  createDarkPageHeader
};
