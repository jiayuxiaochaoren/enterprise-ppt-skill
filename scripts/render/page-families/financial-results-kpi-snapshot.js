function createFinancialKpiSnapshot(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption,
    panelFill
  } = ctx;
  const {
    drawFooter,
    drawResultsHeader
  } = deps;

  return function financialKpiSnapshot(slide, plan, s, idx) {
    drawResultsHeader(slide, s, idx, {
      kicker:'FINANCIAL KPI SNAPSHOT',
      title:'核心经营快照',
      titleY:1.05,
      titleW:6.2,
      titleH:0.34,
      titleSize:24,
      subtitle:'先用一个主判断和三组辅助指标确认本期经营质量。',
      subtitleY:1.50,
      subtitleW:7.0,
      subtitleSize:10.0
    });
    const metrics = (s.metrics || []).slice(0, 4);
    const primary = metrics[0] || { label:'主指标', value:'-', note:'需要补充本期核心经营判断。' };
    const period = s.period || s.quarter || 'Reporting period';
    const source = s.source || s.note || 'Source: management reporting';

    const hero = { x:0.92, y:2.02, w:4.18, h:4.16 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY KPI', { x:hero.x+0.34, y:hero.y+0.38, w:1.16, h:0.10, fontSize:6.4, color:C.accent, charSpace:0.8 });
    addText(slide, primary.label || '核心指标', { x:hero.x+0.34, y:hero.y+0.86, w:1.64, h:0.16, fontSize:10.0, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, primary.value || '-', { x:hero.x+0.30, y:hero.y+1.28, w:2.80, h:0.80, fontSize:48, color:C.white, fit:'shrink' });
    addText(slide, primary.note || '主指标必须直接服务董事会的第一判断。', { x:hero.x+0.36, y:hero.y+2.42, w:2.74, h:0.46, fontSize:8.4, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, hero.x+0.36, hero.y+3.28, 0.88, C.accent, 0, 0.66);
    addLabel(slide, 'PERIOD', { x:hero.x+0.36, y:hero.y+3.58, w:0.64, h:0.09, fontSize:5.8, color:'64748B', charSpace:0.7 });
    addText(slide, period, { x:hero.x+1.14, y:hero.y+3.55, w:1.62, h:0.12, fontSize:8.0, color:'CBD5E1', fit:'shrink' });

    const strip = { x:5.62, y:2.02, w:5.84, h:2.04 };
    addLabel(slide, 'SUPPORTING METRIC STRIP', { x:strip.x, y:strip.y+0.02, w:1.94, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8 });
    metrics.slice(1, 4).forEach((m, i) => {
      const x = strip.x + i * 1.92;
      const accent = i === 0 ? C.cyan : (i === 1 ? C.violet : C.risk);
      addRect(slide, x, strip.y+0.42, 1.58, 1.34, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.42} });
      addText(slide, m.label || `指标 ${i+2}`, { x:x+0.18, y:strip.y+0.68, w:0.92, h:0.12, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '-', { x:x+0.18, y:strip.y+0.96, w:0.96, h:0.20, fontSize:13.8, color:accent, fit:'shrink' });
      addText(slide, compactEvidenceCaption(m.note || '', 18), { x:x+0.18, y:strip.y+1.34, w:1.26, h:0.11, fontSize:6.8, color:C.body, fit:'shrink' });
    });

    const readout = { x:5.62, y:4.46, w:5.84, h:1.46 };
    addRect(slide, readout.x, readout.y, readout.w, readout.h, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    addLabel(slide, '预算判断', { x:readout.x+0.28, y:readout.y+0.26, w:1.00, h:0.09, fontSize:6.2, color:C.accent, charSpace:0 });
    const logic = s.businessLogic || {};
    const readoutText = logic.action || logic.impact || s.note || '下一步需要把收入质量、现金边界和费用纪律放在同一复盘口径中。';
    addText(slide, readoutText, { x:readout.x+0.28, y:readout.y+0.62, w:4.92, h:0.24, fontSize:9.0, color:C.body, fit:'shrink', breakLine:true });
    addText(slide, source, { x:0.94, y:6.48, w:8.6, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createFinancialKpiSnapshot
};
