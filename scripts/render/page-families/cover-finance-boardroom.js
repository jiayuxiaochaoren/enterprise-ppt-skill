function createFinanceBoardroomCover(ctx = {}, deps = {}) {
  const {
    addCoverKicker,
    colors,
    drawFooter,
    drawLightCanvasShell
  } = deps;

  function decisionBlocks(slideData = {}) {
    const items = Array.isArray(slideData.coverDecisionBlocks) ? slideData.coverDecisionBlocks : [];
    if (items.length) return items.slice(0, 3);
    return [
      { title:'口径统一', body:'期间、分层和指标先统一到同一口径。' },
      { title:'边界披露', body:'把假设、敏感性和风险边界提前讲清。' },
      { title:'资本动作', body:'资本配置与回收动作对应到审议节点。' }
    ];
  }

  function chipItems(slideData = {}) {
    const items = Array.isArray(slideData.coverSignalChips) ? slideData.coverSignalChips : [];
    if (items.length) return items.slice(0, 3);
    return [
      { label:'期间', value:'Q1 口径' },
      { label:'风险', value:'敏感性' },
      { label:'资本', value:'回收动作' }
    ];
  }

  return function financeBoardroomCover(slide, plan, s) {
    const C = colors();
    const industry = typeof ctx.industryProfile === 'function' ? (ctx.industryProfile(plan) || {}) : {};
    drawLightCanvasShell(slide);

    addCoverKicker(slide, plan, industry, { x:0.86, y:1.02, w:3.80, h:0.14, fontSize:7.0, color:C.accent, charSpace:0.9 });
    ctx.addText(slide, s.title || plan.title || ctx.copyFallback(plan, 'coverTitle'), {
      x:0.84, y:1.80, w:6.44, h:1.00,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 33.0),
      bold:true, color:C.text, breakLine:true, fit:'shrink'
    });
    ctx.addText(slide, s.subtitle || s.coverInsight || plan.subtitle || ctx.copyFallback(plan, 'industryInsight'), {
      x:0.88, y:3.26, w:5.78, h:0.22,
      fontSize:10.6, color:C.body, fit:'shrink'
    });

    const chips = chipItems(s);
    chips.forEach((item, index) => {
      const x = 0.88 + index * 1.58;
      const fill = index === 1 ? 'EDF5F4' : 'F4F7FB';
      const accent = index === 1 ? (C.secondary || C.cyan || C.accent) : C.accent;
      ctx.addRect(slide, x, 3.92, 1.34, 0.54, fill, C.line, {
        fill:{ color:fill, transparency:0 },
        line:{ color:C.line, transparency:28, width:0.24 }
      });
      ctx.addText(slide, item.label || '', {
        x:x + 0.12, y:4.08, w:0.34, h:0.10,
        fontSize:6.8, bold:true, color:accent, fit:'shrink'
      });
      ctx.addText(slide, item.value || '', {
        x:x + 0.52, y:4.08, w:0.70, h:0.10,
        fontSize:7.2, color:C.body, fit:'shrink'
      });
    });

    ctx.addRect(slide, 0.86, 4.74, 11.58, 1.44, C.ink || '172033', C.ink || '172033', {
      fill:{ color:C.ink || '172033', transparency:0 },
      line:{ color:C.ink || '172033', transparency:100 }
    });
    ctx.addLabel(slide, '审议带', {
      x:1.08, y:5.02, w:0.54, h:0.11,
      fontSize:6.8, color:C.cyan || C.secondary || C.accent, charSpace:0
    });
    ctx.addText(slide, s.coverDecision || '把判断、边界和资本动作放在同一页审议。', {
      x:1.72, y:4.98, w:3.64, h:0.14,
      fontSize:8.4, color:C.darkMuted || C.captionOnImage || 'CBD5E1', fit:'shrink'
    });

    const blocks = decisionBlocks(s);
    blocks.forEach((item, index) => {
      const x = 1.10 + index * 3.62;
      ctx.addText(slide, String(index + 1).padStart(2, '0'), {
        x, y:5.38, w:0.34, h:0.12,
        fontSize:8.0, bold:true, color:index === 1 ? (C.secondary || C.cyan || C.accent) : C.accent, fit:'shrink'
      });
      ctx.addText(slide, item.title || '', {
        x:x + 0.44, y:5.34, w:1.14, h:0.14,
        fontSize:9.0, bold:true, color:C.white || 'FFFFFF', fit:'shrink'
      });
      ctx.addText(slide, item.body || '', {
        x:x + 0.44, y:5.62, w:2.76, h:0.22,
        fontSize:8.0, color:C.darkMuted || C.captionOnImage || 'CBD5E1', fit:'shrink', breakLine:true
      });
      if (index < blocks.length - 1) {
        ctx.addRect(slide, x + 3.18, 5.30, 0.02, 0.58, '334155', '334155', {
          fill:{ color:'334155', transparency:34 },
          line:{ color:'334155', transparency:100 }
        });
      }
    });

    ctx.addDeckMeta(slide, plan, { x:0.90, y:6.42, w:5.60, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.6, color:C.muted });
  };
}

module.exports = {
  createFinanceBoardroomCover
};
