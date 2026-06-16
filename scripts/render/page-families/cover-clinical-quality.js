function createClinicalQualityCover(ctx = {}, deps = {}) {
  const {
    addCoverKicker,
    colors,
    drawFooter,
    drawLightCanvasShell
  } = deps;

  function clinicalNodes(slideData = {}) {
    return (Array.isArray(slideData.coverFlow) && slideData.coverFlow.length
      ? slideData.coverFlow
      : [
        { title:'分诊', note:'入口识别' },
        { title:'接诊', note:'服务动作' },
        { title:'复核', note:'质量校验' },
        { title:'随访', note:'结果回流' }
      ]).slice(0, 4);
  }

  return function clinicalQualityCover(slide, plan, s) {
    const C = colors();
    const industry = typeof ctx.industryProfile === 'function' ? (ctx.industryProfile(plan) || {}) : {};
    drawLightCanvasShell(slide);

    addCoverKicker(slide, plan, industry, { x:0.86, y:1.02, w:3.80, h:0.14, fontSize:7.1, color:C.secondary || C.accent, charSpace:0.9 });
    ctx.addText(slide, s.title || plan.title || ctx.copyFallback(plan, 'coverTitle'), {
      x:0.84, y:1.84, w:5.86, h:0.96,
      fontFace:ctx.profileFont('editorial'),
      fontSize:ctx.typeSize('coverTitle', 33.0),
      bold:true, color:C.text, breakLine:false, fit:'shrink'
    });
    ctx.addText(slide, s.subtitle || s.coverInsight || plan.subtitle || ctx.copyFallback(plan, 'industryInsight'), {
      x:0.88, y:3.20, w:5.18, h:0.22,
      fontSize:10.8, color:C.body, fit:'shrink'
    });

    ctx.addRect(slide, 7.06, 1.04, 4.88, 4.98, 'FBFEFC', C.line, {
      fill:{ color:'FBFEFC', transparency:0 },
      line:{ color:C.line, transparency:22, width:0.36 }
    });
    ctx.addRect(slide, 7.06, 1.04, 0.04, 4.98, C.secondary || C.accent, C.secondary || C.accent, {
      fill:{ color:C.secondary || C.accent, transparency:0 },
      line:{ color:C.secondary || C.accent, transparency:100 }
    });
    ctx.addLabel(slide, '服务质量路径', {
      x:7.42, y:1.42, w:1.56, h:0.12,
      fontSize:6.8, color:C.secondary || C.accent, charSpace:0
    });

    const nodes = clinicalNodes(s);
    const startX = 7.58;
    const step = 0.98;
    nodes.forEach((node, index) => {
      const x = startX + index * step;
      const fill = index % 2 === 0 ? 'CFE0DB' : 'DDE7CF';
      slide.addShape('ellipse', {
        x,
        y:2.26,
        w:0.54,
        h:0.54,
        fill:{ color:fill, transparency:0 },
        line:{ color:fill, transparency:100 }
      });
      if (index < nodes.length - 1) {
        ctx.addRect(slide, x + 0.60, 2.50, 0.42, 0.04, C.secondary || C.accent, C.secondary || C.accent, {
          fill:{ color:C.secondary || C.accent, transparency:18 },
          line:{ color:C.secondary || C.accent, transparency:100 }
        });
      }
      ctx.addText(slide, node.title || '', {
        x:x - 0.02, y:3.08, w:0.74, h:0.14,
        fontSize:8.0, bold:true, color:C.text, fit:'shrink', align:'center'
      });
      ctx.addText(slide, node.note || '', {
        x:x - 0.06, y:3.40, w:0.82, h:0.12,
        fontSize:6.8, color:C.muted, fit:'shrink', align:'center'
      });
    });

    const summary = [
      { title:'入口', body:'资源调度与候诊提示回到同一规则' },
      { title:'动作', body:'服务动作、质控节点和回访节奏统一记录' },
      { title:'结果', body:'把满意度与返工原因汇总到同一复盘口径' }
    ];
    summary.forEach((item, index) => {
      const x = 7.32 + index * 1.50;
      const w = 1.28;
      ctx.addRect(slide, x, 4.42, w, 0.88, 'F4FAF7', C.line, {
        fill:{ color:'F4FAF7', transparency:0 },
        line:{ color:C.line, transparency:34, width:0.26 }
      });
      ctx.addText(slide, item.title, {
        x:x + 0.12, y:4.58, w:0.44, h:0.10,
        fontSize:6.8, bold:true, color:C.secondary || C.accent, fit:'shrink'
      });
      ctx.addText(slide, item.body, {
        x:x + 0.12, y:4.82, w:w - 0.24, h:0.24,
        fontSize:6.4, color:C.body, fit:'shrink', breakLine:true
      });
    });

    ctx.addDeckMeta(slide, plan, { x:0.90, y:6.42, w:5.60, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { fontSize:7.6, color:C.muted });
  };
}

module.exports = {
  createClinicalQualityCover
};
