function createFinancialResultsRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    PageNumber,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption,
    footerText,
    formatMetricDelta,
    lightCanvas,
    panelFill,
    sectionKicker
  } = ctx;

  function financeMetricDashboard(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'PORTFOLIO DASHBOARD', 0.86, 0.72, false);
    addText(slide, s.title || '组合表现复盘', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || '把回报、现金回收和风险暴露放在同一张投委会复盘页。';
    addText(slide, claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);

    const metrics = (s.metrics || []).slice(0,4);
    const primary = metrics[0] || { label:'组合 IRR', value:'—', note:'需要结合估值、现金回收和退出窗口一起判断。' };
    const panel = { x:0.92, y:2.08, w:3.10, h:3.94 };
    addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY RETURN', { x:panel.x+0.30, y:panel.y+0.34, w:1.42, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, primary.label || '核心指标', { x:panel.x+0.30, y:panel.y+0.78, w:1.56, h:0.15, fontSize:9.0, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, primary.value || '—', { x:panel.x+0.28, y:panel.y+1.12, w:2.18, h:0.58, fontSize:38, color:C.white, fit:'shrink' });
    const delta = formatMetricDelta(primary.delta || primary.unit);
    if (delta) {
      addRect(slide, panel.x+0.34, panel.y+1.96, 1.62, 0.26, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
      addText(slide, delta, { x:panel.x+0.46, y:panel.y+2.00, w:1.36, h:0.12, fontSize:6.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
    }
    addText(slide, primary.note || '核心回报指标需要和现金回收、退出窗口、后续融资共同复盘。', { x:panel.x+0.32, y:panel.y+2.58, w:2.30, h:0.46, fontSize:7.2, color:'A8B3C3', breakLine:true, fit:'shrink' });
    addHairline(slide, panel.x+0.32, panel.y+3.38, 0.82, C.accent, 0, 0.58);
    addLabel(slide, 'IC VIEW', { x:panel.x+0.32, y:panel.y+3.62, w:0.82, h:0.12, fontSize:6.8, color:'64748B', charSpace:0.7 });

    const chart = { x:4.46, y:2.10, w:3.16, h:3.86 };
    addRect(slide, chart.x, chart.y, chart.w, chart.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
    addLabel(slide, 'RETURN / CASH / RISK', { x:chart.x+0.26, y:chart.y+0.32, w:1.96, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    const bars = metrics.slice(0,3);
    bars.forEach((m,i)=>{
      const y = chart.y + 0.86 + i*0.82;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.risk);
      addText(slide, m.label || `指标 ${i+1}`, { x:chart.x+0.28, y:y-0.02, w:1.10, h:0.12, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '—', { x:chart.x+2.04, y:y-0.06, w:0.74, h:0.16, fontSize:11.6, color:accent, align:'right', fit:'shrink' });
      addRect(slide, chart.x+0.28, y+0.28, 2.34, 0.055, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, chart.x+0.28, y+0.28, [1.82,1.20,0.82][i] || 1.0, 0.055, accent, accent, { line:{color:accent, transparency:100} });
      if (m.delta) addText(slide, formatMetricDelta(m.delta), { x:chart.x+0.28, y:y+0.46, w:1.56, h:0.12, fontSize:6.8, color:C.muted, fit:'shrink' });
    });
    addRect(slide, chart.x+0.28, chart.y+3.34, 2.40, 0.28, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    addText(slide, '现金回收、估值修复、风险项目必须同步看。', { x:chart.x+0.40, y:chart.y+3.40, w:2.12, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });

    const table = { x:8.08, y:2.10, w:3.64, h:3.86 };
    addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
    addLabel(slide, 'MANAGEMENT READOUT', { x:table.x+0.26, y:table.y+0.32, w:1.88, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    metrics.slice(0,3).forEach((m,i)=>{
      const y = table.y + 0.86 + i*0.82;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.risk);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:table.x+0.28, y:y, w:0.28, h:0.12, fontSize:6.8, color:accent });
      addText(slide, m.label || `指标 ${i+1}`, { x:table.x+0.72, y:y-0.02, w:0.86, h:0.12, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
      addText(slide, m.note || '纳入季度复盘。', { x:table.x+1.72, y:y-0.02, w:1.38, h:0.18, fontSize:6.8, color:C.body, fit:'shrink' });
      addHairline(slide, table.x+0.28, y+0.48, 2.84, C.line, 20, 0.34);
    });
    addText(slide, s.note || 'DPI 与估值修复是当前最重要的复盘信号。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.2, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function financialKpiSnapshot(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'FINANCIAL KPI SNAPSHOT', 0.86, 0.72, false);
    addText(slide, s.title || '核心经营快照', { x:0.84, y:1.05, w:6.2, h:0.34, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.claim || s.subtitle || '先用一个主判断和三组辅助指标确认本期经营质量。', { x:0.86, y:1.50, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);
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
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function chartGridWithCommentary(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'CHART GRID WITH COMMENTARY', 0.86, 0.72, false);
    addText(slide, s.title || '经营读数与评论', { x:0.84, y:1.05, w:6.2, h:0.34, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.claim || s.subtitle || '趋势图和评论区必须绑定到同一经营动作。', { x:0.86, y:1.50, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);
    const metrics = (s.metrics || []).slice(0, 3);
    const charts = [
      { x:0.92, y:2.08, w:2.78, h:1.58, color:C.accent },
      { x:4.02, y:2.08, w:2.78, h:1.58, color:C.cyan },
      { x:0.92, y:4.18, w:5.88, h:1.68, color:C.violet }
    ];
    charts.forEach((box, i) => {
      const m = metrics[i] || {};
      addRect(slide, box.x, box.y, box.w, box.h, panelFill(), i === 0 ? box.color : C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i === 0 ? box.color : C.line, transparency:i === 0 ? 18 : 16, width:0.42}
      });
      addLabel(slide, `CHART 0${i + 1}`, { x:box.x+0.22, y:box.y+0.22, w:0.94, h:0.10, fontSize:6.8, color:box.color, charSpace:0.7 });
      addText(slide, m.label || `经营读数 ${i+1}`, { x:box.x+0.22, y:box.y+0.52, w:1.28, h:0.13, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '-', { x:box.x+box.w-1.06, y:box.y+0.48, w:0.70, h:0.15, fontSize:10.6, color:box.color, align:'right', fit:'shrink' });
      const baseY = box.y + box.h - 0.34;
      const values = i === 0 ? [0.42, 0.62, 0.54, 0.78] : (i === 1 ? [0.70, 0.58, 0.52, 0.46] : [0.32, 0.48, 0.60, 0.72, 0.84]);
      values.forEach((v, j) => {
        const bw = box.w > 3 ? 0.52 : 0.30;
        const gap = box.w > 3 ? 0.26 : 0.20;
        const x = box.x + 0.34 + j * (bw + gap);
        const h = 0.72 * v;
        addRect(slide, x, baseY - h, bw, h, box.color, box.color, { fill:{color:box.color, transparency:j === values.length - 1 ? 0 : 28}, line:{color:box.color, transparency:100} });
      });
      addText(slide, compactEvidenceCaption(m.note || '', 28), { x:box.x+0.22, y:box.y+box.h-0.13, w:box.w-0.44, h:0.10, fontSize:6.8, color:C.muted, fit:'shrink' });
    });

    const commentary = { x:7.18, y:2.08, w:4.34, h:3.78 };
    addRect(slide, commentary.x, commentary.y, commentary.w, commentary.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'COMMENTARY RAIL', { x:commentary.x+0.30, y:commentary.y+0.34, w:1.54, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    const logic = s.businessLogic || {};
    [
      ['现状', logic.currentState || '指标正在形成同向信号。'],
      ['原因', logic.cause || '客户结构、回款周期和项目筛选共同影响结果。'],
      ['动作', logic.action || '把评论转为下一季度投入和风险边界。']
    ].forEach((row, i) => {
      const y = commentary.y + 0.92 + i * 0.82;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:commentary.x+0.32, y:y+0.04, w:0.30, h:0.09, fontSize:6.8, color:accent });
      addText(slide, row[0], { x:commentary.x+0.78, y:y-0.01, w:0.76, h:0.16, fontSize:9.6, bold:true, color:C.white, fit:false });
      addText(slide, row[1], {
        x:commentary.x+1.72, y:y-0.02, w:2.26, h:0.38,
        fontSize:8.8, color:C.captionOnImage, fit:false, breakLine:true, valign:'top'
      });
      addHairline(slide, commentary.x+0.32, y+0.56, 3.42, '334155', 46, 0.32);
    });
    addText(slide, s.note || '图表评论区必须解释数据为什么改变下一步动作。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function quarterlyResultsSummary(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'QUARTERLY RESULTS SUMMARY', 0.86, 0.72, false);
    addText(slide, s.title || '季度结果摘要', { x:0.84, y:1.05, w:6.5, h:0.34, fontSize:23.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.claim || s.subtitle || '季度页同时呈现结果、差异解释和管理动作。', { x:0.86, y:1.50, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);
    const metrics = (s.metrics || []).slice(0, 4);
    const logic = s.businessLogic || {};
    const period = s.period || s.quarter || 'Quarter';

    const periodBox = { x:0.92, y:2.06, w:2.46, h:3.86 };
    addRect(slide, periodBox.x, periodBox.y, periodBox.w, periodBox.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'REPORTING PERIOD', { x:periodBox.x+0.28, y:periodBox.y+0.34, w:1.36, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, period, { x:periodBox.x+0.28, y:periodBox.y+0.86, w:1.44, h:0.26, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, logic.currentState || '本期结果好于预算基线。', { x:periodBox.x+0.28, y:periodBox.y+1.52, w:1.64, h:0.48, fontSize:8.6, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addHairline(slide, periodBox.x+0.28, periodBox.y+2.54, 0.78, C.accent, 0, 0.62);
    addLabel(slide, 'SOURCE', { x:periodBox.x+0.28, y:periodBox.y+2.88, w:0.72, h:0.09, fontSize:5.4, color:'64748B', charSpace:0.6 });
    addText(slide, s.source || 'Management reporting', { x:periodBox.x+0.28, y:periodBox.y+3.18, w:1.64, h:0.16, fontSize:7.2, color:'CBD5E1', fit:'shrink' });

    const table = { x:3.82, y:2.06, w:4.22, h:3.86 };
    addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
    addLabel(slide, 'REPORTED METRICS', { x:table.x+0.26, y:table.y+0.28, w:1.38, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    metrics.forEach((m, i) => {
      const y = table.y + 0.76 + i * 0.70;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.risk));
      addText(slide, m.label || `指标 ${i+1}`, { x:table.x+0.26, y, w:1.12, h:0.13, fontSize:8.4, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '-', { x:table.x+1.72, y:y-0.04, w:0.78, h:0.16, fontSize:11.6, color:accent, align:'right', fit:'shrink' });
      addText(slide, compactEvidenceCaption(m.note || '', 22), { x:table.x+2.76, y, w:0.92, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
      addHairline(slide, table.x+0.26, y+0.38, 3.56, C.line, 18, 0.30);
    });

    const action = { x:8.46, y:2.06, w:2.96, h:3.86 };
    addRect(slide, action.x, action.y, action.w, action.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.accent, transparency:26, width:0.46} });
    addLabel(slide, 'VARIANCE / ACTION', { x:action.x+0.24, y:action.y+0.28, w:1.28, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    [
      ['差异解释', logic.cause || '复购客户、价格纪律和费用边界共同推动结果。'],
      ['管理动作', logic.action || s.guidance || '继续按月复盘回款、毛利和费用效率。'],
      ['指引边界', s.guidance || logic.impact || '下季度保持核心投入，但不突破预算上限。']
    ].forEach((row, i) => {
      const y = action.y + 0.82 + i * 0.86;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addText(slide, row[0], { x:action.x+0.24, y, w:0.86, h:0.13, fontSize:8.6, bold:true, color:C.text, fit:'shrink' });
      addText(slide, compactEvidenceCaption(row[1], 34), { x:action.x+1.22, y:y-0.02, w:1.28, h:0.20, fontSize:7.2, color:C.body, fit:'shrink', breakLine:true });
      addRect(slide, action.x+0.24, y+0.44, 0.46, 0.035, accent, accent, { line:{color:accent, transparency:100} });
    });
    addText(slide, s.note || '季度结果摘要需要同时回答结果、原因和下一步。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  return {
    chartGridWithCommentary,
    financeMetricDashboard,
    financialKpiSnapshot,
    quarterlyResultsSummary
  };
}

module.exports = {
  createFinancialResultsRenderers
};
