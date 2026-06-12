function createEnergySiteDispatchBridge(ctx = {}) {
  const {
    addArrowLine,
    addLabel,
    addRect
  } = ctx;
  const C = ctx.colors();

  function drawEnergySiteDispatchBridge(slide, midX = 6.22) {
    addRect(slide, midX-0.36, 3.08, 0.72, 0.72, C.ink, C.accent, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.accent, transparency:26, width:0.42}
    });
    addArrowLine(slide, midX-0.18, 3.44, 0.36, 0, C.accent, {
      transparency:8,
      width:0.46
    });
    addLabel(slide, 'DISPATCH', {
      x:midX-0.44, y:4.04, w:0.88, h:0.09, fontSize:5.6, color:C.cyan, charSpace:0.65, align:'center'
    });
  }

  return {
    drawEnergySiteDispatchBridge
  };
}

module.exports = {
  createEnergySiteDispatchBridge
};
