function createDarkPageHeader(ctx = {}, C = ctx.colors(), chrome = {}) {
  const {
    drawNumberPageNumber,
    drawTextPageNumber
  } = chrome;

  function visibleUnits(text = '') {
    return [...String(text || '').trim()].reduce((sum, char) => {
      if (/[\u4e00-\u9fff]/.test(char)) return sum + 2;
      if (/\s/.test(char)) return sum + 0.45;
      return sum + 1;
    }, 0);
  }

  function estimateTitleLines(text = '', boxW = 5.8, fontSize = 24, opts = {}) {
    const explicitLines = String(text || '').split(/\n/).filter(Boolean).length;
    if (explicitLines > 1) return Math.min(explicitLines, opts.maxLines || 2);
    const units = visibleUnits(text);
    const unitsPerLine = Math.max(14, boxW * 5.15 * (24 / Math.max(16, fontSize)));
    return Math.min(Math.max(1, Math.ceil(units / unitsPerLine)), opts.maxLines || 2);
  }

  function titleBoxHeight(lines = 1, fontSize = 24, providedH = 0.36) {
    if (lines <= 1) return providedH;
    const lineH = Math.max(0.38, Math.min(0.48, fontSize * 0.0185));
    return Math.max(providedH, (lineH * lines) + 0.08);
  }

  return function drawDarkPageHeader(slide, opts = {}) {
    if (opts.stage !== false) {
      if (opts.stageOpts === undefined) ctx.stageCanvas(slide);
      else ctx.stageCanvas(slide, opts.stageOpts);
    }
    ctx.sectionKicker(slide, opts.kicker || '', opts.x || 0.84, opts.y || 0.72, true);
    const titleW = opts.titleW || 5.8;
    const titleSize = opts.titleSize || 24;
    const titleLines = estimateTitleLines(opts.title || '', titleW, titleSize, {
      maxLines:opts.titleMaxLines
    });
    const baseTitleY = opts.titleY || 1.06;
    const titleY = baseTitleY + (titleLines > 1 ? (opts.longTitleOffsetY == null ? 0.06 : opts.longTitleOffsetY) : 0);
    const titleH = titleBoxHeight(titleLines, titleSize, opts.titleH || 0.36);
    const titleOpts = {
      x:opts.titleX || 0.82,
      y:titleY,
      w:titleW,
      h:titleH,
      fontSize:titleSize,
      bold:true,
      color:opts.titleColor || C.white
    };
    if (opts.titleFit !== false) titleOpts.fit = opts.titleFit || 'shrink';
    if (opts.titleBreakLine != null) titleOpts.breakLine = opts.titleBreakLine;
    else if (titleLines > 1) titleOpts.breakLine = true;
    ctx.addText(slide, opts.title || '', titleOpts);
    let subtitleMetrics = null;
    if (opts.subtitle) {
      const subtitleH = opts.subtitleH || (visibleUnits(opts.subtitle) > 66 ? 0.28 : 0.20);
      const requestedSubtitleY = opts.subtitleY || 1.54;
      const minSubtitleY = titleY + titleH + (opts.titleSubtitleGap == null ? 0.12 : opts.titleSubtitleGap);
      const subtitleY = titleLines > 1 ? Math.max(requestedSubtitleY, minSubtitleY) : requestedSubtitleY;
      const subtitleOpts = {
        x:opts.subtitleX || 0.84,
        y:subtitleY,
        w:opts.subtitleW || 5.9,
        h:subtitleH,
        fontSize:opts.subtitleSize || 10.4,
        color:opts.subtitleColor || C.darkMuted || '94A3B8'
      };
      if (opts.subtitleFit !== false) subtitleOpts.fit = opts.subtitleFit || 'shrink';
      if (opts.subtitleBreakLine != null) subtitleOpts.breakLine = opts.subtitleBreakLine;
      ctx.addText(slide, opts.subtitle, subtitleOpts);
      subtitleMetrics = { y:subtitleY, h:subtitleH };
    }
    if (opts.idx != null) {
      if (opts.pageNumber === 'chrome' && typeof ctx.PageNumber === 'function') {
        ctx.PageNumber(slide, opts.idx, opts.pageNumberOpts || {});
        const contentTop = subtitleMetrics
          ? subtitleMetrics.y + subtitleMetrics.h + (opts.headerContentGap == null ? 0.26 : opts.headerContentGap)
          : titleY + titleH + (opts.headerContentGap == null ? 0.30 : opts.headerContentGap);
        return {
          titleLines,
          titleY,
          titleH,
          subtitleY:subtitleMetrics && subtitleMetrics.y,
          subtitleH:subtitleMetrics && subtitleMetrics.h,
          contentTop
        };
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
        const contentTop = subtitleMetrics
          ? subtitleMetrics.y + subtitleMetrics.h + (opts.headerContentGap == null ? 0.26 : opts.headerContentGap)
          : titleY + titleH + (opts.headerContentGap == null ? 0.30 : opts.headerContentGap);
        return {
          titleLines,
          titleY,
          titleH,
          subtitleY:subtitleMetrics && subtitleMetrics.y,
          subtitleH:subtitleMetrics && subtitleMetrics.h,
          contentTop
        };
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
    const contentTop = subtitleMetrics
      ? subtitleMetrics.y + subtitleMetrics.h + (opts.headerContentGap == null ? 0.26 : opts.headerContentGap)
      : titleY + titleH + (opts.headerContentGap == null ? 0.30 : opts.headerContentGap);
    return {
      titleLines,
      titleY,
      titleH,
      subtitleY:subtitleMetrics && subtitleMetrics.y,
      subtitleH:subtitleMetrics && subtitleMetrics.h,
      contentTop
    };
  };
}

module.exports = {
  createDarkPageHeader
};
