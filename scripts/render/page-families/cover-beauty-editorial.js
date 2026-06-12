function createBeautyBrandEditorialCover(ctx = {}, deps = {}) {
  const {
    colors,
    drawFooter,
    drawLightCanvasShell,
    fileExists
  } = deps;

  function drawBeautyTextureFallback(slide, box, label = '产品质感') {
    const C = colors();
    const cream = C.paper || 'F7F2EE';
    const blush = C.softBlue || 'F4D9D6';
    const shadow = C.ink || '2A0D13';
    ctx.addRect(slide, box.x, box.y, box.w, box.h, cream, cream, {
      fill:{ color:cream, transparency:0 },
      line:{ color:'FFFFFF', transparency:100 }
    });
    slide.addShape('ellipse', {
      x:box.x + box.w * 0.12,
      y:box.y + box.h * 0.16,
      w:box.w * 0.92,
      h:box.h * 0.78,
      fill:{ color:blush, transparency:34 },
      line:{ color:blush, transparency:100 }
    });
    slide.addShape('ellipse', {
      x:box.x + box.w * 0.54,
      y:box.y + box.h * 0.12,
      w:box.w * 0.30,
      h:box.h * 0.30,
      fill:{ color:C.accent, transparency:76 },
      line:{ color:C.accent, transparency:100 }
    });
    ctx.addRect(slide, box.x + box.w * 0.23, box.y + box.h * 0.24, box.w * 0.20, box.h * 0.54, shadow, shadow, {
      fill:{ color:shadow, transparency:0 },
      line:{ color:shadow, transparency:100 }
    });
    ctx.addRect(slide, box.x + box.w * 0.27, box.y + box.h * 0.12, box.w * 0.12, box.h * 0.16, shadow, shadow, {
      fill:{ color:shadow, transparency:0 },
      line:{ color:shadow, transparency:100 }
    });
    ctx.addRect(slide, box.x + box.w * 0.26, box.y + box.h * 0.48, box.w * 0.14, 0.035, C.accent, C.accent, {
      fill:{ color:C.accent, transparency:8 },
      line:{ color:C.accent, transparency:100 }
    });
    slide.addShape('ellipse', {
      x:box.x + box.w * 0.54,
      y:box.y + box.h * 0.48,
      w:box.w * 0.30,
      h:box.h * 0.18,
      fill:{ color:'FFFFFF', transparency:5 },
      line:{ color:C.accent, transparency:52, width:0.42 }
    });
    slide.addShape('ellipse', {
      x:box.x + box.w * 0.58,
      y:box.y + box.h * 0.50,
      w:box.w * 0.22,
      h:box.h * 0.12,
      fill:{ color:C.accent, transparency:66 },
      line:{ color:C.accent, transparency:100 }
    });
    ctx.addRect(slide, box.x + box.w * 0.58, box.y + box.h * 0.76, box.w * 0.36, 0.045, C.cyan, C.cyan, {
      fill:{ color:C.cyan, transparency:16 },
      line:{ color:C.cyan, transparency:100 }
    });
    ctx.addLabel(slide, label, {
      x:box.x + 0.24,
      y:box.y + box.h - 0.36,
      w:Math.min(box.w - 0.48, 2.42),
      h:0.10,
      fontSize:5.8,
      color:'64748B',
      charSpace:0.8
    });
  }

  return function beautyBrandEditorialCover(slide, plan, s) {
    const C = colors();
    const W = ctx.canvasWidth ? ctx.canvasWidth() : 13.333;
    const H = ctx.canvasHeight ? ctx.canvasHeight() : 7.5;
    const imagePath = ctx.designForSlide(plan, s, 'cover').imagePath;
    const paper = C.paper || 'FBF3EF';
    const textColor = C.text || C.ink || '1C1A20';
    drawLightCanvasShell(slide);
    slide.background = { color:paper };
    ctx.addRect(slide, 0, 0, W, H, paper, paper, {
      fill:{ color:paper, transparency:0 },
      line:{ color:paper, transparency:100 }
    });
    if (imagePath && fileExists(imagePath)) {
      slide.addImage({
        path:imagePath,
        x:5.92,
        y:0,
        w:W - 5.92,
        h:H,
        sizing:{ type:'cover', x:5.92, y:0, w:W - 5.92, h:H }
      });
      ctx.addRect(slide, 0, 0, 5.92, H, paper, paper, {
        fill:{ color:paper, transparency:5 },
        line:{ color:paper, transparency:100 }
      });
    } else {
      drawBeautyTextureFallback(slide, { x:6.20, y:0.84, w:5.30, h:5.30 }, '产品质感');
    }

    const brandName = String(plan.organization || s.brandName || s.brand || '')
      .replace(/\s+/g, ' ')
      .trim() || '品牌经营';
    ctx.addText(slide, brandName, {
      x:0.78, y:0.62, w:1.46, h:0.16, fontSize:8.6, bold:true, color:C.accent, fit:'shrink'
    });
    ctx.addLabel(slide, '美妆品牌世界', { x:2.54, y:0.66, w:2.00, h:0.13, fontSize:6.9, color:C.muted || '8A7A7F', charSpace:0 });
    ctx.addRect(slide, 0.78, 1.02, 0.84, 0.06, C.accent, C.accent);
    ctx.addRect(slide, 1.78, 1.02, 0.36, 0.06, C.cyan, C.cyan, {
      fill:{ color:C.cyan, transparency:22 },
      line:{ color:C.cyan, transparency:100 }
    });
    const title = deps.coverTitleText(s.title || plan.title || ctx.copyFallback(plan, 'coverTitle'));
    ctx.addText(slide, title, {
      x:0.74, y:1.36, w:4.88, h:1.18,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 40.0),
      bold:true, color:textColor, fit:'shrink', breakLine:true
    });
    ctx.addText(slide, s.subtitle || s.coverInsight || plan.subtitle || ctx.copyFallback(plan, 'industryInsight'), {
      x:0.82, y:2.90, w:4.70, h:0.58, fontSize:12.0, color:C.body || '5D5156', fit:'shrink', breakLine:true
    });

    ctx.addText(slide, s.coverInsight || '核心词：状态管理；核心利益：稳一点、亮一点、细一点', {
      x:0.84, y:3.72, w:4.34, h:0.20, fontSize:8.4, bold:true, color:C.accent, fit:'shrink'
    });

    const proof = Array.isArray(s.coverIndex) ? s.coverIndex : (Array.isArray(plan.coverIndex) ? plan.coverIndex : [
      ['状态管理', '不做强美白，做轻修护入口'],
      ['149元', '首发到手价降低尝试门槛'],
      ['7月6日', '全渠道上市节奏锚点']
    ]);
    proof.slice(0, 3).forEach((row, i) => {
      const item = Array.isArray(row) ? row : [ctx.itemTitle(row), ctx.itemBody(row)];
      const y = 4.74 + i * 0.48;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      ctx.addRect(slide, 0.84, y + 0.30, 4.38, 0.02, accent, accent, {
        fill:{ color:accent, transparency:i === 0 ? 2 : 44 },
        line:{ color:accent, transparency:100 }
      });
      ctx.addNumber(slide, String(i + 1).padStart(2, '0'), { x:0.86, y:y, w:0.30, h:0.12, fontSize:6.9, color:accent });
      ctx.addText(slide, item[0], { x:1.34, y:y-0.01, w:1.08, h:0.16, fontSize:9.4, bold:true, color:textColor, fit:'shrink' });
      ctx.addText(slide, item[1], { x:2.70, y:y, w:2.48, h:0.14, fontSize:7.8, color:C.body || '5D5156', fit:'shrink' });
    });
    ctx.addRect(slide, 9.32, 5.56, 2.90, 0.84, paper, 'FFFFFF', {
      fill:{ color:paper, transparency:18 },
      line:{ color:'FFFFFF', transparency:34, width:0.40 }
    });
    ctx.addRect(slide, 9.32, 5.56, 0.05, 0.84, C.accent, C.accent, {
      fill:{ color:C.accent, transparency:0 },
      line:{ color:C.accent, transparency:100 }
    });
    ctx.addLabel(slide, '首发到手价', { x:9.52, y:5.72, w:1.06, h:0.10, fontSize:5.9, color:C.accent, charSpace:0 });
    ctx.addNumber(slide, '149', { x:9.66, y:5.92, w:1.08, h:0.32, fontSize:21.0, color:C.accent, align:'right' });
    ctx.addText(slide, '元首发到手价', { x:10.82, y:6.06, w:1.12, h:0.14, fontSize:7.4, bold:true, color:textColor, fit:'shrink' });
    ctx.addText(slide, '30ml / 2026.07.06', { x:9.54, y:6.24, w:2.34, h:0.12, fontSize:6.9, color:C.body || '5D5156', fit:'shrink', align:'right' });
    ctx.addDeckMeta(slide, plan, { x:0.84, y:6.56, w:5.50, h:0.14, fontSize:7.4, color:C.muted || '8A7A7F', fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.6, color:C.muted || '8A7A7F' });
  };
}

module.exports = {
  createBeautyBrandEditorialCover
};
