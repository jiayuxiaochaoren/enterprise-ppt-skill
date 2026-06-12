function pageNumberLabel(idx) {
  return String(idx).padStart(2, '0');
}

function createPrimitiveChrome(ctx = {}, C = ctx.colors()) {
  function drawFooter(slide, plan, opts = {}) {
    const text = ctx.footerText(plan);
    if (!text) return false;
    ctx.addText(slide, text, {
      x:opts.x || 0.82,
      y:opts.y || 7.05,
      w:opts.w || 7.8,
      h:opts.h || 0.16,
      fontSize:opts.fontSize || 7.8,
      color:opts.color || C.muted,
      fit:opts.fit
    });
    return true;
  }

  function drawLightCanvasShell(slide) {
    ctx.lightCanvas(slide);
  }

  function drawTextPageNumber(slide, idx, opts = {}) {
    ctx.addText(slide, pageNumberLabel(idx), opts);
  }

  function drawNumberPageNumber(slide, idx, opts = {}) {
    ctx.addNumber(slide, pageNumberLabel(idx), opts);
  }

  function drawChromePageNumber(slide, idx, opts = {}) {
    ctx.PageNumber(slide, idx, opts);
  }

  function drawRiskBoardFooter(slide, plan, opts = {}) {
    drawFooter(slide, plan, Object.assign({
      color:opts.dark ? (C.darkMuted || '94A3B8') : C.muted
    }, opts));
  }

  return {
    drawChromePageNumber,
    drawFooter,
    drawLightCanvasShell,
    drawNumberPageNumber,
    drawRiskBoardFooter,
    drawTextPageNumber
  };
}

module.exports = {
  createPrimitiveChrome,
  pageNumberLabel
};
