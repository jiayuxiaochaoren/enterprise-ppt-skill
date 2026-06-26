function createClosingHealthcareQualityHandoffRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    closingActions,
    closingMeta,
    drawClosingHeader,
    drawFooter
  } = helpers;
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addRect,
    addText,
    copyFallback,
    panelFill
  } = ctx;

  return function closingHealthcareQualityHandoff(slide, plan, s, idx) {
    drawClosingHeader(slide, plan, s, idx, { kicker:'质量交接收口', titleW:6.70, titleSize:28.0, subtitleY:2.04, subtitleW:6.55 });

    const handoff = { x:0.92, y:3.02, w:10.54, h:2.36 };
    addRect(slide, handoff.x, handoff.y, handoff.w, handoff.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
    const actions = closingActions(s);
    const points = actions.length ? actions : [{title:'旅程'}, {title:'质量'}, {title:'治理'}];
    const railX = handoff.x + 0.72;
    const railY = handoff.y + 1.04;
    const step = 8.88 / Math.max(1, points.length - 1);
    points.slice(0,3).forEach((a,i)=>{
      const x = railX + i*step;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      slide.addShape('ellipse', { x:x-0.13, y:railY-0.13, w:0.26, h:0.26, fill:{color:accent}, line:{color:accent, transparency:100} });
      addText(slide, a.title || '', { x:x-0.62, y:railY+0.42, w:1.24, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink', align:'center' });
      addText(slide, a.body || '', { x:x-0.76, y:railY+0.78, w:1.52, h:0.16, fontSize:7.2, color:C.body, fit:'shrink', align:'center' });
      if (i < points.length-1) addArrowLine(slide, x+0.34, railY, step-0.68, 0, accent, { transparency:42, width:0.34 });
    });
    addRect(slide, 8.44, 0.96, 2.92, 1.62, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, '质量闭环', { x:8.76, y:1.32, w:1.20, h:0.09, fontSize:5.4, color:C.accent, charSpace:0 });
    addText(slide, s.decision || s.note || copyFallback(plan, 'closingNote'), { x:8.76, y:1.72, w:1.78, h:0.32, fontSize:8.2, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.40, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  };
}

module.exports = {
  createClosingHealthcareQualityHandoffRenderer
};
