const RIGHT_SIDE_CARD_DEFAULT = Object.freeze({
  x: 8.50,
  y: 1.34,
  w: 2.90,
  h: 4.86
});

function rightSideCardBox(overrides = {}) {
  return {
    x: overrides.x ?? RIGHT_SIDE_CARD_DEFAULT.x,
    y: overrides.y ?? RIGHT_SIDE_CARD_DEFAULT.y,
    w: overrides.w ?? RIGHT_SIDE_CARD_DEFAULT.w,
    h: overrides.h ?? RIGHT_SIDE_CARD_DEFAULT.h
  };
}

function createRightSideCardRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addRect
  } = ctx;

  function drawRightSideCard(slide, overrides = {}, opts = {}) {
    const box = rightSideCardBox(overrides);
    const fill = opts.fill || C.ink;
    const line = opts.line || fill;
    const railW = opts.railWidth ?? 0.035;
    const railGap = opts.railGap ?? 0.13;
    const railX = opts.railX ?? (box.x - railGap - railW);
    const railColor = opts.railColor || C.accent;
    const railTransparency = opts.railTransparency ?? 12;

    if (opts.rail !== false) {
      addRect(slide, railX, box.y, railW, box.h, railColor, railColor, {
        fill:{ color:railColor, transparency:railTransparency },
        line:{ color:railColor, transparency:100 }
      });
    }

    addRect(slide, box.x, box.y, box.w, box.h, fill, line, {
      fill:{ color:fill, transparency:opts.fillTransparency ?? 0 },
      line:{ color:line, transparency:opts.lineTransparency ?? 100, width:opts.lineWidth ?? 0.38 }
    });

    return box;
  }

  return {
    drawRightSideCard,
    rightSideCardBox
  };
}

module.exports = {
  RIGHT_SIDE_CARD_DEFAULT,
  createRightSideCardRenderer,
  rightSideCardBox
};
