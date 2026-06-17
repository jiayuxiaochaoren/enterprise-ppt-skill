const {
  createRightSideCardRenderer
} = require('./right-side-card');

function createClosingManufacturingRolloutRenderer(ctx = {}, helpers = {}) {
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
    addNumber,
    addRect,
    addText,
    copyFallback,
    panelFill,
  } = ctx;
  const {
    drawRightSideCard
  } = createRightSideCardRenderer(ctx);

  return function closingManufacturingPilotRollout(slide, plan, s, idx) {
    drawClosingHeader(slide, plan, s, idx, {
      kicker:'经营动作闭环',
      titleW:6.78,
      titleY:1.02,
      titleH:0.96,
      titleSize:25.8,
      titleMaxLines:3,
      longTitleOffsetY:0.02,
      subtitleY:2.30,
      subtitleW:6.16,
      subtitleH:0.28,
      subtitleSize:10.2,
      titleSubtitleGap:0.20,
      headerContentGap:0.34
    });

    const core = drawRightSideCard(slide, { x:8.42, y:1.34, w:2.98, h:4.86 }, {
      fill:C.ink,
      railColor:C.accent,
      railTransparency:18
    });
    addLabel(slide, '执行主线', { x:core.x+0.32, y:core.y+0.36, w:0.86, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    addText(slide, '闭环', { x:core.x+0.32, y:core.y+0.82, w:1.78, h:0.36, fontSize:23.5, bold:true, color:C.white, fit:'shrink' });
    addHairline(slide, core.x+0.34, core.y+1.72, 1.16, C.accent, 0, 0.58);
    addText(slide, s.decision || s.note || copyFallback(plan, 'closingNote'), {
      x:core.x+0.34, y:core.y+2.16, w:1.94, h:0.58, fontSize:8.6, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    const checklist = (Array.isArray(s.rows) ? s.rows : [])
      .map(row => row && (row.title || row.label || row.name || row.item))
      .filter(Boolean)
      .slice(0, 4);
    (checklist.length ? checklist : ['套餐规则', '渠道预算', '认证交付', '按月复盘']).forEach((label,i)=>{
      const y = core.y + 3.38 + i*0.34;
      addNumber(slide, String(i+1).padStart(2,'0'), { x:core.x+0.34, y, w:0.28, h:0.09, fontSize:5.8, color:i===0?C.accent:(i===1?C.cyan:C.violet) });
      addText(slide, label, { x:core.x+0.76, y:y-0.02, w:1.28, h:0.11, fontSize:7.0, color:'CBD5E1', fit:'shrink' });
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
    const outcome = s.outcome || s.decisionOutcome || s.closingOutcome || plan.closingDecisionOutcome || '';
    if (outcome) {
      addRect(slide, 0.92, 3.24, 6.94, 0.32, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
      addText(slide, outcome, { x:1.14, y:3.31, w:6.46, h:0.12, fontSize:8.0, color:C.body, fit:'shrink' });
    }
    addText(slide, closingMeta(plan), { x:0.86, y:6.68, w:7.50, h:0.15, fontSize:7.4, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  };
}

module.exports = {
  createClosingManufacturingRolloutRenderer
};
