function createCoverStyleRenderer(ctx = {}, deps = {}) {
  const {
    addCoverKicker,
    colors,
    drawFooter
  } = deps;
  const W = () => (typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333);
  const H = () => (typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5);

  function insightFor(plan = {}, s = {}, industry = {}) {
    return s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle || ctx.copyFallback(plan, 'industryInsight');
  }

  function drawRule(slide, x, y, C, accent) {
    ctx.addRect(slide, x, y, 0.86, 0.045, accent || C.accent, accent || C.accent, {
      fill:{ color:accent || C.accent, transparency:0 },
      line:{ color:accent || C.accent, transparency:100 }
    });
  }

  function drawFooterMeta(slide, plan, C, opts = {}) {
    ctx.addDeckMeta(slide, plan, {
      x:opts.x || 0.88, y:opts.y || 6.36, w:opts.w || 5.70, h:0.14,
      fontSize:7.3, color:opts.color || C.muted, fit:'shrink'
    });
    if (drawFooter) drawFooter(slide, plan, { fontSize:7.4, color:opts.color || C.muted });
  }

  function drawMetrics(slide, s = {}, C, opts = {}) {
    const metrics = (Array.isArray(s.metrics) ? s.metrics : []).slice(0, 3);
    if (!metrics.length) return;
    metrics.forEach((metric, index) => {
      const item = Array.isArray(metric)
        ? { value:metric[0], label:metric[1] }
        : metric;
      const x = (opts.x || 0.88) + index * 1.40;
      const y = opts.y || 5.80;
      ctx.addRect(slide, x, y, 1.24, 0.56, opts.fill || C.panel, opts.line || C.line, {
        fill:{ color:opts.fill || C.panel, transparency:opts.transparency ?? 8 },
        line:{ color:opts.line || C.line, transparency:opts.lineTransparency ?? 28, width:0.35 }
      });
      ctx.addText(slide, String(item.value || item.title || ''), {
        x:x + 0.14, y:y + 0.12, w:0.72, h:0.16,
        fontSize:13.6, bold:true, color:opts.textColor || C.text, fit:'shrink'
      });
      ctx.addLabel(slide, String(item.label || item.note || ''), {
        x:x + 0.14, y:y + 0.36, w:0.92, h:0.08,
        fontSize:5.5, color:opts.muted || C.muted, charSpace:0
      });
    });
  }

  function drawImageLedLeftCopy(slide, plan, s, industry, title, design, preset) {
    const C = colors();
    const imagePath = design.imagePath || '';
    ctx.addPhotoPanel(slide, imagePath, 0, 0, W(), H(), {
      tone:'dark',
      transparency:70,
      overlay:C.ink || '05070A',
      fit:'cover',
      fallback:C.ink || '05070A'
    });
    ctx.addRect(slide, 0, 0, 6.15, H(), C.ink || '05070A', C.ink || '05070A', {
      fill:{ color:C.ink || '05070A', transparency:8 },
      line:{ color:C.ink || '05070A', transparency:100 }
    });
    addCoverKicker(slide, plan, industry, { x:0.88, y:0.96, w:3.9, h:0.14, fontSize:7.0, color:C.secondary || C.cyan || C.accent, charSpace:1.0 });
    ctx.addText(slide, title, {
      x:0.86, y:1.70, w:5.35, h:0.92,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 33.0),
      bold:true, color:C.white || C.darkText || 'FFFFFF', breakLine:false, fit:'shrink'
    });
    ctx.addText(slide, insightFor(plan, s, industry), {
      x:0.90, y:3.02, w:4.98, h:0.24,
      fontSize:11.2, bold:true, color:C.captionOnImage || C.darkText || 'CBD5E1', fit:'shrink'
    });
    drawRule(slide, 0.90, 3.58, C, C.accent);
    drawMetrics(slide, s, C, { fill:C.ink2 || C.darkPanel || '111827', line:C.darkLine || C.line, textColor:C.white || 'FFFFFF', muted:C.darkMuted || C.muted, transparency:18, lineTransparency:46 });
    drawFooterMeta(slide, plan, C, { color:C.darkMuted || C.muted });
    return true;
  }

  function drawLightEditorialProof(slide, plan, s, industry, title, design) {
    const C = colors();
    const surface = ctx.surfaceFill();
    ctx.addRect(slide, 0, 0, W(), H(), surface, surface, {
      fill:{ color:surface, transparency:0 },
      line:{ color:surface, transparency:100 }
    });
    if (design.imagePath) {
      ctx.addPhotoPanel(slide, design.imagePath, 5.82, 0, W() - 5.82, H(), {
        tone:'light',
        transparency:34,
        stroke:C.line,
        strokeTransparency:100,
        fit:'cover'
      });
      ctx.addRect(slide, 0, 0, 6.35, H(), surface, surface, {
        fill:{ color:surface, transparency:8 },
        line:{ color:surface, transparency:100 }
      });
    }
    ctx.addRect(slide, 0.86, 0.72, 11.58, 0.01, C.line, C.line, {
      fill:{ color:C.line, transparency:18 },
      line:{ color:C.line, transparency:100 }
    });
    addCoverKicker(slide, plan, industry, { x:0.86, y:1.04, w:3.7, h:0.14, fontSize:7.0, color:C.accent, charSpace:1.0 });
    ctx.addText(slide, title, {
      x:0.84, y:1.72, w:5.75, h:0.94,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 35.0),
      bold:true, color:C.text, breakLine:false, fit:'shrink'
    });
    ctx.addText(slide, insightFor(plan, s, industry), {
      x:0.88, y:3.02, w:5.30, h:0.22,
      fontSize:11.0, bold:true, color:C.body, fit:'shrink'
    });
    drawRule(slide, 0.88, 3.56, C, C.accent);
    drawMetrics(slide, s, C, { y:5.72, fill:ctx.panelFill(), line:C.line, textColor:C.text, muted:C.muted, transparency:0, lineTransparency:18 });
    drawFooterMeta(slide, plan, C);
    return true;
  }

  function drawBrandProductShowcase(slide, plan, s, industry, title, design) {
    const C = colors();
    const surface = ctx.surfaceFill();
    ctx.addRect(slide, 0, 0, W(), H(), surface, surface, {
      fill:{ color:surface, transparency:0 },
      line:{ color:surface, transparency:100 }
    });
    const rightX = 5.75;
    ctx.addPhotoPanel(slide, design.imagePath, rightX, 0, W() - rightX, H(), {
      tone:'light',
      transparency:22,
      stroke:C.line,
      strokeTransparency:100,
      fit:'cover',
      fallback:ctx.panelFill()
    });
    ctx.addRect(slide, 0, 0, 6.10, H(), surface, surface, {
      fill:{ color:surface, transparency:0 },
      line:{ color:surface, transparency:100 }
    });
    addCoverKicker(slide, plan, industry, { x:0.84, y:0.92, w:3.8, h:0.14, fontSize:7.0, color:C.accent, charSpace:0.9 });
    ctx.addText(slide, title, {
      x:0.80, y:1.54, w:5.18, h:1.10,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 34.0),
      bold:true, color:C.text, breakLine:false, fit:'shrink'
    });
    ctx.addText(slide, insightFor(plan, s, industry), {
      x:0.86, y:3.06, w:4.80, h:0.28,
      fontSize:11.1, bold:true, color:C.body, fit:'shrink'
    });
    drawRule(slide, 0.86, 3.62, C, C.accent);
    drawMetrics(slide, s, C, { y:5.78, fill:ctx.panelFill(), line:C.line, textColor:C.text, muted:C.muted, transparency:10, lineTransparency:18 });
    drawFooterMeta(slide, plan, C);
    return true;
  }

  function drawObjectStillLifeVoid(slide, plan, s, industry, title, design) {
    const C = colors();
    const surface = ctx.surfaceFill();
    ctx.addRect(slide, 0, 0, W(), H(), surface, surface, {
      fill:{ color:surface, transparency:0 },
      line:{ color:surface, transparency:100 }
    });
    if (design.imagePath) {
      ctx.addPhotoPanel(slide, design.imagePath, 0, 0, W(), H(), {
        tone:'light',
        transparency:24,
        overlay:surface,
        fit:'cover'
      });
    }
    ctx.addRect(slide, 0, 0, 6.15, H(), surface, surface, {
      fill:{ color:surface, transparency:2 },
      line:{ color:surface, transparency:100 }
    });
    ctx.addRect(slide, 1.16, 3.46, 10.98, 0.01, C.line, C.line, {
      fill:{ color:C.line, transparency:15 },
      line:{ color:C.line, transparency:100 }
    });
    addCoverKicker(slide, plan, industry, { x:1.16, y:4.18, w:3.6, h:0.14, fontSize:7.0, color:C.accent, charSpace:0.8 });
    ctx.addText(slide, title, {
      x:1.14, y:4.58, w:5.55, h:0.72,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 32.0),
      bold:true, color:C.text, breakLine:false, fit:'shrink'
    });
    ctx.addText(slide, insightFor(plan, s, industry), {
      x:1.18, y:5.44, w:5.15, h:0.20,
      fontSize:10.4, bold:true, color:C.body, fit:'shrink'
    });
    ctx.addRect(slide, 11.76, 6.30, 0.44, 0.44, surface, C.accent, {
      fill:{ color:surface, transparency:18 },
      line:{ color:C.accent, transparency:0, width:0.7 }
    });
    ctx.addText(slide, '证', { x:11.88, y:6.42, w:0.18, h:0.10, fontSize:10.4, bold:true, color:C.accent, fit:'shrink' });
    drawFooterMeta(slide, plan, C, { x:1.18, y:6.82, w:4.5 });
    return true;
  }

  return function coverStyleRenderer(slide, plan, s, industry, title) {
    const design = ctx.designForSlide(plan, s, 'cover');
    const preset = design.coverStylePreset || null;
    if (!preset || !preset.rendererFlavor) return false;
    const flavor = preset.rendererFlavor;
    if (flavor === 'image-led-left-copy') return drawImageLedLeftCopy(slide, plan, s, industry, title, design, preset);
    if (flavor === 'light-editorial-proof') return drawLightEditorialProof(slide, plan, s, industry, title, design, preset);
    if (flavor === 'brand-product-showcase') return drawBrandProductShowcase(slide, plan, s, industry, title, design, preset);
    if (flavor === 'object-still-life-void') return drawObjectStillLifeVoid(slide, plan, s, industry, title, design, preset);
    return false;
  };
}

module.exports = {
  createCoverStyleRenderer
};
