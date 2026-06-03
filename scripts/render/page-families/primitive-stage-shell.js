function createPrimitiveStageShell(ctx = {}, C = ctx.colors(), chrome = {}) {
  const {
    drawChromePageNumber,
    drawNumberPageNumber,
    drawTextPageNumber
  } = chrome;

  function drawDarkStageShell(slide, opts = {}) {
    if (opts.stage !== false) {
      if (opts.stageOpts === undefined) ctx.stageCanvas(slide);
      else ctx.stageCanvas(slide, opts.stageOpts);
    }
    if (opts.breathingCircle) {
      const circle = opts.breathingCircle;
      ctx.addDarkBreathingCircle(slide, circle.x, circle.y, circle.w, circle.h, circle.color || C.accent);
    }
    if (opts.kicker) {
      ctx.addLabel(slide, opts.kicker, Object.assign({
        x:0.84,
        y:0.90,
        w:1.80,
        h:0.13,
        fontSize:7.0,
        color:C.cyan,
        charSpace:1.0
      }, opts.kickerOpts || {}));
    }
    if (opts.idx != null) {
      const pageNumberOpts = opts.pageNumberOpts || {};
      if (opts.pageNumberMethod === 'chrome') {
        drawChromePageNumber(slide, opts.idx, pageNumberOpts);
      } else if (opts.pageNumberMethod === 'number') {
        drawNumberPageNumber(slide, opts.idx, pageNumberOpts);
      } else if (opts.pageNumberMethod === 'text') {
        drawTextPageNumber(slide, opts.idx, pageNumberOpts);
      }
    }
  }

  return {
    drawDarkStageShell
  };
}

module.exports = {
  createPrimitiveStageShell
};
