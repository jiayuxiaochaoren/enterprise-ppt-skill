function createFlywheelSlots(ctx = {}) {
  const C = ctx.colors();
  const {
    addArrowLine
  } = ctx;

  function fourNodeSlots(slide, layout, itemCount) {
    const { cx, cy, nodeW } = layout;
    const slots = [
      { x:cx-nodeW/2, y:2.42 },
      { x:8.64, y:3.40 },
      { x:cx-nodeW/2, y:4.76 },
      { x:2.62, y:3.40 }
    ].slice(0, itemCount);
    addArrowLine(slide, cx+1.18, cy-1.12, 1.30, 0, C.accent, { transparency:34, width:0.40 });
    addArrowLine(slide, 9.62, cy-0.06, 0, 0.72, C.cyan, { transparency:36, width:0.40 });
    addArrowLine(slide, cx-2.48, cy+1.12, 1.30, 0, C.violet, { beginArrowType:'triangle', endArrowType:null, transparency:38, width:0.40 });
    addArrowLine(slide, 3.62, cy-0.06, 0, 0.72, '94A3B8', { beginArrowType:'triangle', endArrowType:null, transparency:42, width:0.40 });
    return slots;
  }

  function circularSlots(slide, items, layout) {
    const { cx, cy, nodeH, nodeW, radiusX, radiusY } = layout;
    const points = items.map((_, i) => {
      const angle = -Math.PI / 2 + i * (Math.PI * 2 / items.length);
      return {
        x: cx + Math.cos(angle) * radiusX,
        y: cy + Math.sin(angle) * radiusY,
        angle
      };
    });
    points.forEach((p, i) => {
      const next = points[(i+1) % points.length];
      const sx = p.x + Math.cos(p.angle) * 0.56;
      const sy = p.y + Math.sin(p.angle) * 0.28;
      const ex = next.x - Math.cos(next.angle) * 0.56;
      const ey = next.y - Math.sin(next.angle) * 0.28;
      addArrowLine(slide, sx, sy, ex-sx, ey-sy, i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : '94A3B8')), { transparency:46, width:0.36 });
    });
    return points.map(p => ({
      x: Math.max(1.18, Math.min(10.44, p.x - nodeW / 2)),
      y: Math.max(2.62, Math.min(5.32, p.y - nodeH / 2))
    }));
  }

  function flywheelSlots(slide, items, layout) {
    return items.length <= 4
      ? fourNodeSlots(slide, layout, items.length)
      : circularSlots(slide, items, layout);
  }

  return {
    flywheelSlots
  };
}

module.exports = {
  createFlywheelSlots
};
