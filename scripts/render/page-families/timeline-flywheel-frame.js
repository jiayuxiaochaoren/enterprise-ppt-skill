function createFlywheelFrame(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawFlywheelFrame(slide, s, layout) {
    const { cx, cy } = layout;
    addRect(slide, 0.92, 2.02, 10.92, 4.26, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:60},
      line:{color:'334155', transparency:76, width:0.36}
    });
    addLabel(slide, s.flywheelLabel || 'INPUT · ACTION · SIGNAL · REVIEW', { x:1.20, y:2.32, w:2.58, h:0.10, fontSize:6.0, color:'64748B', charSpace:0.8 });
    slide.addShape('ellipse', { x:cx-2.20, y:cy-1.24, w:4.40, h:2.48, fill:{color:C.ink, transparency:100}, line:{color:C.accent, transparency:48, width:0.50} });
    slide.addShape('ellipse', { x:cx-1.38, y:cy-0.76, w:2.76, h:1.52, fill:{color:C.ink, transparency:0}, line:{color:'334155', transparency:62, width:0.30} });
    addText(slide, s.centerTitle || '飞轮复利', { x:cx-0.78, y:cy-0.16, w:1.56, h:0.20, fontSize:13.2, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, s.centerLabel || 'COMPOUNDING LOOP', { x:cx-0.88, y:cy+0.20, w:1.76, h:0.09, fontSize:5.4, color:'64748B', align:'center', charSpace:0.60 });
  }

  return {
    drawFlywheelFrame
  };
}

module.exports = {
  createFlywheelFrame
};
