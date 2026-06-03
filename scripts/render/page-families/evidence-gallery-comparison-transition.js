function createCaseComparisonTransition(ctx = {}) {
  const {
    addArrowBetweenRects,
    addLabel
  } = ctx;
  const C = ctx.colors();

  function drawCaseComparisonTransition(slide, beforePanel, afterPanel) {
    const transitionY = 3.44;
    addArrowBetweenRects(slide, beforePanel, afterPanel, 'right', C.accent, {
      gap:0.30,
      y:transitionY,
      endY:transitionY,
      transparency:8,
      width:0.50
    });
    const midX = (beforePanel.x + beforePanel.w + afterPanel.x) / 2;
    slide.addShape('ellipse', {
      x:midX - 0.06,
      y:transitionY - 0.06,
      w:0.12,
      h:0.12,
      fill:{color:C.accent},
      line:{color:C.accent, transparency:100}
    });
    addLabel(slide, 'CHANGE', {
      x:midX - 0.44, y:transitionY+0.52, w:0.88, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8, align:'center'
    });
  }

  return {
    drawCaseComparisonTransition
  };
}

module.exports = {
  createCaseComparisonTransition
};
