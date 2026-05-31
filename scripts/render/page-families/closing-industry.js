function createClosingIndustryRenderers(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const closingActions = helpers.closingActions || (() => []);
  const closingMeta = helpers.closingMeta || (plan => ctx.footerText(plan));
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    copyFallback,
    footerText,
    lightCanvas,
    panelFill,
    profileFont,
    sectionKicker
  } = ctx;

  function closingManufacturingPilotRollout(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, s.label || 'PILOT ROLLOUT', 0.86, 0.72, false);
    addText(slide, s.title || copyFallback(plan, 'closingTitle'), { x:0.84, y:1.08, w:6.90, h:0.66, fontSize:29.0, bold:true, color:C.text, fit:'shrink', breakLine:true });
    addText(slide, s.subtitle || copyFallback(plan, 'closingSubtitle'), { x:0.86, y:2.06, w:6.40, h:0.22, fontSize:10.6, color:C.body, fit:'shrink' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const core = { x:8.36, y:0.88, w:2.98, h:5.68 };
    addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'LINE 01', { x:core.x+0.32, y:1.28, w:0.86, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, 'PILOT', { x:core.x+0.32, y:1.72, w:1.78, h:0.36, fontFace:profileFont('latin'), fontSize:23.5, bold:true, color:C.white, fit:'shrink' });
    addHairline(slide, core.x+0.34, 2.66, 1.16, C.accent, 0, 0.58);
    addText(slide, s.decision || s.note || copyFallback(plan, 'closingNote'), {
      x:core.x+0.34, y:3.10, w:1.94, h:0.58, fontSize:8.6, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    ['设备对象', '工单闭环', 'OEE复盘'].forEach((label,i)=>{
      const y = 4.42 + i*0.42;
      addNumber(slide, String(i+1).padStart(2,'0'), { x:core.x+0.34, y, w:0.28, h:0.09, fontSize:5.8, color:i===0?C.accent:(i===1?C.cyan:C.violet) });
      addText(slide, label, { x:core.x+0.76, y:y-0.02, w:0.92, h:0.11, fontSize:7.2, color:'CBD5E1', fit:'shrink' });
    });

    const actions = closingActions(s);
    const y = 4.30;
    actions.forEach((a,i)=>{
      const x = 0.92 + i*2.34;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, y, 2.06, 1.20, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:14, width:0.44} });
      addRect(slide, x, y, 2.06, 0.04, accent, accent, { line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.36, w:0.32, h:0.10, fontSize:6.8, color:accent });
      addText(slide, a.title || '', { x:x+0.66, y:y+0.30, w:0.90, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, a.body || '', { x:x+0.22, y:y+0.72, w:1.46, h:0.16, fontSize:7.2, color:C.body, fit:'shrink' });
      if (i < actions.length - 1) addArrowLine(slide, x+2.18, y+0.60, 0.28, 0, accent, { transparency:32, width:0.38 });
    });
    addRect(slide, 0.92, 3.24, 6.94, 0.32, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
    addText(slide, copyFallback(plan, 'closingDecisionOutcome'), { x:1.14, y:3.31, w:6.46, h:0.12, fontSize:8.0, color:C.body, fit:'shrink' });
    addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.50, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  }

  function closingFinanceInvestmentDecision(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, s.label || 'INVESTMENT DECISION', 0.86, 0.72, false);
    addText(slide, s.title || copyFallback(plan, 'closingTitle'), { x:0.84, y:1.08, w:6.80, h:0.66, fontSize:28.0, bold:true, color:C.text, fit:'shrink', breakLine:true });
    addText(slide, s.subtitle || copyFallback(plan, 'closingSubtitle'), { x:0.86, y:2.04, w:6.40, h:0.22, fontSize:10.6, color:C.body, fit:'shrink' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const memo = { x:8.20, y:0.92, w:3.20, h:5.64 };
    addRect(slide, memo.x, memo.y, memo.w, memo.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'IC MEMO', { x:memo.x+0.30, y:1.26, w:0.92, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, 'DECISION', { x:memo.x+0.30, y:1.70, w:1.78, h:0.34, fontFace:profileFont('latin'), fontSize:21.5, bold:true, color:C.white, fit:'shrink' });
    addHairline(slide, memo.x+0.30, 2.54, 1.10, C.accent, 0, 0.56);
    addText(slide, s.decision || s.note || copyFallback(plan, 'closingNote'), { x:memo.x+0.30, y:2.94, w:2.08, h:0.56, fontSize:8.8, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    [
      ['CAPITAL', '配置动作'],
      ['RISK', '风险约束'],
      ['EXIT', '退出节奏']
    ].forEach((row,i)=>{
      const y = 4.34 + i*0.42;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addLabel(slide, row[0], { x:memo.x+0.32, y, w:0.72, h:0.08, fontSize:5.0, color:accent, charSpace:0.5 });
      addText(slide, row[1], { x:memo.x+1.28, y:y-0.02, w:0.88, h:0.11, fontSize:7.2, color:'CBD5E1', fit:'shrink' });
    });

    const actions = closingActions(s);
    addRect(slide, 0.92, 3.28, 6.72, 2.26, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
    addLabel(slide, 'NEXT CAPITAL ACTIONS', { x:1.18, y:3.58, w:1.62, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    actions.forEach((a,i)=>{
      const y = 4.04 + i*0.44;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:1.20, y, w:0.28, h:0.09, fontSize:6.0, color:accent });
      addText(slide, a.title || '', { x:1.76, y:y-0.03, w:1.16, h:0.13, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      addText(slide, a.body || '', { x:3.36, y:y-0.03, w:3.10, h:0.13, fontSize:7.6, color:C.body, fit:'shrink' });
      addHairline(slide, 1.18, y+0.25, 5.88, C.line, 22, 0.28);
    });
    addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.20, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  }

  function closingHealthcareQualityHandoff(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, s.label || 'QUALITY HANDOFF', 0.86, 0.72, false);
    addText(slide, s.title || copyFallback(plan, 'closingTitle'), { x:0.84, y:1.08, w:6.70, h:0.66, fontSize:28.0, bold:true, color:C.text, fit:'shrink', breakLine:true });
    addText(slide, s.subtitle || copyFallback(plan, 'closingSubtitle'), { x:0.86, y:2.04, w:6.55, h:0.22, fontSize:10.6, color:C.body, fit:'shrink' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const handoff = { x:0.92, y:3.02, w:10.54, h:2.36 };
    addRect(slide, handoff.x, handoff.y, handoff.w, handoff.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
    const actions = closingActions(s);
    const points = actions.length ? actions : [{title:'旅程'}, {title:'质量'}, {title:'治理'}];
    const railX = handoff.x + 0.72;
    const railY = handoff.y + 1.04;
    const step = 8.88 / Math.max(1, points.length - 1);
    addHairline(slide, railX, railY, step*(points.length-1), C.line, 8, 0.62);
    points.slice(0,3).forEach((a,i)=>{
      const x = railX + i*step;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      slide.addShape('ellipse', { x:x-0.13, y:railY-0.13, w:0.26, h:0.26, fill:{color:accent}, line:{color:accent, transparency:100} });
      addText(slide, a.title || '', { x:x-0.62, y:railY+0.42, w:1.24, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink', align:'center' });
      addText(slide, a.body || '', { x:x-0.76, y:railY+0.78, w:1.52, h:0.16, fontSize:7.2, color:C.body, fit:'shrink', align:'center' });
      if (i < points.length-1) addArrowLine(slide, x+0.34, railY, step-0.68, 0, accent, { transparency:42, width:0.34 });
    });
    addRect(slide, 8.44, 0.96, 2.92, 1.62, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'QUALITY LOOP', { x:8.76, y:1.32, w:1.20, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.7 });
    addText(slide, s.decision || s.note || copyFallback(plan, 'closingNote'), { x:8.76, y:1.72, w:1.78, h:0.32, fontSize:8.2, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.40, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  }

  function closingSaasAdoptionClose(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, s.label || 'ADOPTION TO REVENUE', 0.86, 0.72, false);
    addText(slide, s.title || copyFallback(plan, 'closingTitle'), { x:0.84, y:1.08, w:6.90, h:0.66, fontSize:28.5, bold:true, color:C.text, fit:'shrink', breakLine:true });
    addText(slide, s.subtitle || copyFallback(plan, 'closingSubtitle'), { x:0.86, y:2.04, w:6.60, h:0.22, fontSize:10.6, color:C.body, fit:'shrink' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const actions = closingActions(s);
    const board = { x:0.92, y:3.04, w:7.02, h:2.34 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
    addLabel(slide, 'CUSTOMER HEALTH PATH', { x:board.x+0.28, y:board.y+0.28, w:1.64, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    actions.forEach((a,i)=>{
      const x = board.x + 0.42 + i*2.08;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, board.y+0.82, 1.56, 0.78, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
        fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1?0:8},
        line:{color:i===1?accent:C.line, transparency:i===1?22:16, width:0.38}
      });
      addText(slide, a.title || '', { x:x+0.18, y:board.y+1.10, w:1.16, h:0.12, fontSize:8.4, bold:true, color:i===1?C.white:C.text, align:'center', fit:'shrink' });
      addText(slide, a.body || '', { x:x+0.12, y:board.y+1.76, w:1.28, h:0.14, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
      if (i < actions.length-1) addArrowLine(slide, x+1.70, board.y+1.20, 0.32, 0, accent, { transparency:34, width:0.36 });
    });
    const metric = { x:8.56, y:1.04, w:2.70, h:4.72 };
    addRect(slide, metric.x, metric.y, metric.w, metric.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'REVENUE SIGNAL', { x:metric.x+0.28, y:1.38, w:1.22, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.7 });
    addText(slide, 'NRR', { x:metric.x+0.28, y:1.88, w:1.20, h:0.36, fontFace:profileFont('latin'), fontSize:24.0, bold:true, color:C.accent, fit:'shrink' });
    addText(slide, 'ADOPTION DEPTH', { x:metric.x+0.30, y:2.46, w:1.32, h:0.09, fontSize:5.2, color:'64748B', charSpace:0.65 });
    addHairline(slide, metric.x+0.30, 3.02, 1.10, C.accent, 0, 0.56);
    addText(slide, s.decision || s.note || copyFallback(plan, 'closingNote'), { x:metric.x+0.30, y:3.44, w:1.76, h:0.44, fontSize:8.0, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.50, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  }

  return {
    closingFinanceInvestmentDecision,
    closingHealthcareQualityHandoff,
    closingManufacturingPilotRollout,
    closingSaasAdoptionClose
  };
}

module.exports = {
  createClosingIndustryRenderers
};
