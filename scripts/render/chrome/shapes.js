function createShapeHelpers(core = {}) {
  const { C, activePlan, zone, zoneBounds } = core;

  function addRect(slide, x, y, w, h, color, lineColor = color, extra = {}) {
    slide.addShape('rect', Object.assign({ x, y, w, h, fill:{ color }, line:{ color:lineColor } }, extra));
  }
  function addLine(slide, x, y, w, color = C.line, width = 1) {
    slide.addShape('line', { x, y, w, h:0, line:{ color, width } });
  }
  function addHairline(slide, x, y, w, color = C.line, transparency = 45, width = 0.55) {
    slide.addShape('line', { x, y, w, h:0, line:{ color, transparency, width } });
  }
  function addArrowLine(slide, x, y, w, h, color = C.accent, opts = {}) {
    const line = {
      color,
      transparency:opts.transparency ?? 28,
      width:opts.width || 0.56
    };
    if (opts.beginArrowType) line.beginArrowType = opts.beginArrowType;
    if (opts.endArrowType !== null) line.endArrowType = opts.endArrowType || 'triangle';
    slide.addShape('line', { x, y, w, h, line });
  }
  function addArrowBetweenRects(slide, from, to, direction = 'right', color = C.accent, opts = {}) {
    const gap = opts.gap ?? 0.16;
    const base = Object.assign({ transparency:30, width:0.42 }, opts);
    if (direction === 'right') {
      const x = from.x + from.w + gap;
      const y = opts.y ?? (from.y + from.h / 2);
      const endX = to.x - gap;
      return addArrowLine(slide, x, y, Math.max(0.08, endX - x), (opts.endY ?? (to.y + to.h / 2)) - y, color, base);
    }
    if (direction === 'down') {
      const x = opts.x ?? (from.x + from.w / 2);
      const y = from.y + from.h + gap;
      const endY = to.y - gap;
      return addArrowLine(slide, x, y, (opts.endX ?? (to.x + to.w / 2)) - x, Math.max(0.08, endY - y), color, base);
    }
    if (direction === 'left') {
      const x = to.x + to.w + gap;
      const y = opts.y ?? (from.y + from.h / 2);
      const endX = from.x - gap;
      return addArrowLine(slide, x, y, Math.max(0.08, endX - x), (opts.endY ?? (to.y + to.h / 2)) - y, color, Object.assign({}, base, { beginArrowType:'triangle', endArrowType:null }));
    }
    if (direction === 'up') {
      const x = opts.x ?? (from.x + from.w / 2);
      const y = to.y + to.h + gap;
      const endY = from.y - gap;
      return addArrowLine(slide, x, y, (opts.endX ?? (to.x + to.w / 2)) - x, Math.max(0.08, endY - y), color, Object.assign({}, base, { beginArrowType:'triangle', endArrowType:null }));
    }
    return addArrowLine(slide, from.x, from.y, to.x - from.x, to.y - from.y, color, base);
  }
  function addCardToCardConnector(slide, from, to, color = C.accent, opts = {}) {
    if (!slide || !from || !to) return false;
    const gap = opts.gap ?? 0.10;
    const x = from.x + from.w + gap;
    const y = opts.y ?? (from.y + from.h / 2);
    const endX = to.x - gap;
    const endY = opts.endY ?? (to.y + to.h / 2);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(endX) || !Number.isFinite(endY)) return false;
    if (endX <= x) return false;
    const marker = opts.marker !== false;
    const markerSize = opts.markerSize ?? 0.09;
    const lineEndX = marker ? Math.max(x + 0.02, endX - markerSize * 0.45) : endX;
    addArrowLine(slide, x, y, lineEndX - x, endY - y, color, {
      transparency:opts.transparency ?? 34,
      width:opts.width ?? 0.36,
      endArrowType:marker ? null : opts.endArrowType
    });
    if (marker) {
      slide.addShape('triangle', {
        x:endX - markerSize * 0.50,
        y:endY - markerSize * 0.50,
        w:markerSize,
        h:markerSize,
        rotate:90,
        fill:{ color, transparency:opts.markerTransparency ?? Math.max(0, (opts.transparency ?? 34) - 12) },
        line:{ color, transparency:100 }
      });
    }
    return true;
  }
  function addClockwiseLoopConnectors(slide, slots, connectorColors = [], opts = {}) {
    if (slots.length < 4) return;
    addArrowBetweenRects(slide, slots[0], slots[1], 'right', connectorColors[0] || C.accent, opts);
    addArrowBetweenRects(slide, slots[1], slots[2], 'down', connectorColors[1] || C.cyan, opts);
    addArrowBetweenRects(slide, slots[2], slots[3], 'left', connectorColors[2] || C.violet, opts);
    addArrowBetweenRects(slide, slots[3], slots[0], 'up', connectorColors[3] || '94A3B8', opts);
  }
  function markDecoration(slide, type, bbox = {}) {
    if (!slide) return false;
    slide.__codexDecorations = slide.__codexDecorations || [];
    const entry = Object.assign({ type }, zoneBounds(bbox));
    slide.__codexDecorations.push(entry);
    return true;
  }
  function addDarkBreathingCircle(slide, x = 8.20, y = 0.78, outer = 4.42, inner = 2.50, accent = C.accent) {
    if (slide.__codexBreathingCircleRendered) return false;
    slide.__codexBreathingCircleRendered = true;
    markDecoration(slide, 'breathing-circle', zone('breathing-circle', x, y, outer, outer, 'decoration'));
    slide.addShape('ellipse', { x, y, w:outer, h:outer, fill:{ color:accent, transparency:98 }, line:{ color:accent, transparency:88, width:0.45 } });
    const inset = (outer - inner) / 2;
    slide.addShape('ellipse', { x:x + inset, y:y + inset, w:inner, h:inner, fill:{ color:C.ink, transparency:100 }, line:{ color:C.cyan, transparency:92, width:0.35 } });
  }
  function addLightBreathingCircle(slide, x = 9.58, y = 0.42, size = 3.45, color = C.softBlue, transparency = 50) {
    if (slide.__codexBreathingCircleRendered) return false;
    slide.__codexBreathingCircleRendered = true;
    markDecoration(slide, 'breathing-circle', zone('breathing-circle', x, y, size, size, 'decoration'));
    slide.addShape('ellipse', { x, y, w:size, h:size, fill:{ color, transparency }, line:{ color, transparency:100 } });
  }
  function addPulseCurve(slide, x, y, w, h, accent = C.accent, dark = true, opts = {}) {
    if (slide.__codexPulseCurveRendered && opts.allowMultiple !== true) return false;
    slide.__codexPulseCurveRendered = true;
    const decorType = opts.decorType || 'pulse-curve';
    markDecoration(slide, decorType, zone(decorType, x, y, w, h, 'decoration'));
    const pts = opts.points || [[0.00,0.66],[0.16,0.64],[0.30,0.49],[0.43,0.55],[0.56,0.32],[0.70,0.38],[0.84,0.22],[1.00,0.29]];
    const lineColor = opts.color || accent;
    const trans = opts.transparency ?? (dark ? 36 : 8);
    for (let i = 0; i < pts.length - 1; i++) {
      const [px, py] = pts[i];
      const [nx, ny] = pts[i + 1];
      const sx = x + px * w;
      const sy = y + py * h;
      const mx = x + nx * w;
      const my = y + ny * h;
      slide.addShape('line', { x:sx, y:sy, w:mx - sx, h:0, line:{ color:lineColor, transparency:trans, width:opts.width || 0.62 } });
      slide.addShape('line', { x:mx, y:sy, w:0, h:my - sy, line:{ color:lineColor, transparency:trans, width:opts.width || 0.62 } });
    }
    if (opts.nodes !== false) {
      [pts[2], pts[5], pts[7]].forEach((p, i) => {
        slide.addShape('ellipse', {
          x:x + p[0] * w - 0.035, y:y + p[1] * h - 0.035, w:0.07, h:0.07,
          fill:{ color:i === 1 ? C.cyan : lineColor, transparency:dark ? 10 : 0 },
          line:{ color:i === 1 ? C.cyan : lineColor, transparency:100 }
        });
      });
    }
    return true;
  }

  return {
    addArrowBetweenRects,
    addArrowLine,
    addCardToCardConnector,
    addClockwiseLoopConnectors,
    addDarkBreathingCircle,
    addHairline,
    addLightBreathingCircle,
    addLine,
    addPulseCurve,
    addRect,
    markDecoration
  };
}

module.exports = {
  createShapeHelpers
};
