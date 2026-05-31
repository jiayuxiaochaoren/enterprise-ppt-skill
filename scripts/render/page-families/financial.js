const family = 'financial';
const {
  chartNumber,
  chooseChannelLabelBox,
  coerceChartItems,
  computeChannelMatrixBubbles,
  computeMonthlyTrendPoints,
  computeWaterfallBars,
  firstChartItems
} = require('./financial-chart-utils');
const {
  createFinancialInvestmentRenderers
} = require('./financial-investment');

const types = [
  'metric-comparison',
  'industry-chart',
  'finance-bridge',
  'portfolio-table'
];

function createFinancialRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    PageNumber,
    addArrowLine,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    chartSpecToComponentId,
    compactEvidenceCaption,
    componentRendererContext,
    footerText,
    formatMetricDelta,
    isVisualIndustry,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    publicSlideNote,
    recordChartConsumption,
    renderChartSpec,
    routeChartSpec,
    sectionKicker,
    variantOf
  } = ctx;
  const {
    financeBridgeSlide,
    portfolioTableSlide
  } = createFinancialInvestmentRenderers(ctx);

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

  function manufacturingOeeBoard(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'OEE / LINE READOUT', 0.86, 0.72, false);
    addText(slide, s.title || 'OEE 与产线效率复盘', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || '把稼动、节拍、良率、停机和维修动作放到同一张产线复盘页。';
    addText(slide, claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const metrics = (s.metrics || []).slice(0,4);
    const findMetric = (re, fallbackIndex) => metrics.find(m => re.test(`${m.label || ''} ${m.title || ''}`)) || metrics[fallbackIndex] || {};
    const primary = findMetric(/OEE|设备效率|產線|产线/i, 0);
    const maintenance = findMetric(/响应|維修|维修|MTTR|停机|停線|重复/i, 1);
    const quality = findMetric(/良率|质量|品質|重复|返工/i, 2);
    const pctWidth = (value, max=2.30) => {
      const num = Number(String(value || '').replace(/[^\d.-]/g, ''));
      if (!Number.isFinite(num)) return max * 0.56;
      return Math.max(0.28, Math.min(max, max * Math.min(100, Math.abs(num)) / 100));
    };
    const components = (s.oee || s.oeeComponents || [
      { label:'稼动率', value:'92%', body:'停机窗口和换线等待进入复盘。' },
      { label:'性能率', value:'84%', body:'节拍波动和瓶颈工位可被识别。' },
      { label:'良率', value:'97%', body:'返工、报废和质量异常绑定工单。' }
    ]).slice(0,3);

    const hero = { x:0.92, y:2.10, w:2.88, h:3.92 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.accent, transparency:28, width:0.56} });
    addRect(slide, hero.x+0.30, hero.y+0.68, hero.w-0.60, 0.06, C.accent, C.accent, { line:{color:C.accent, transparency:100} });
    addRect(slide, hero.x+0.30, hero.y+3.18, hero.w-0.60, 0.34, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY OEE', { x:hero.x+0.30, y:hero.y+0.34, w:1.20, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, primary.label || 'OEE', { x:hero.x+0.30, y:hero.y+0.86, w:1.42, h:0.15, fontSize:9.0, bold:true, color:C.text, fit:'shrink' });
    addNumber(slide, primary.value || '78%', { x:hero.x+0.28, y:hero.y+1.20, w:2.12, h:0.62, fontSize:40, color:C.text, fit:'shrink' });
    if (primary.delta) {
      addRect(slide, hero.x+0.34, hero.y+2.02, 1.82, 0.30, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
      addText(slide, formatMetricDelta(primary.delta), { x:hero.x+0.46, y:hero.y+2.08, w:1.54, h:0.15, fontSize:8.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
    }
    addText(slide, primary.note || 'OEE 不是孤立指标，需要拆到稼动、节拍和良率，再回到维修动作。', { x:hero.x+0.32, y:hero.y+2.62, w:2.10, h:0.36, fontSize:7.2, color:C.body, breakLine:true, fit:'shrink' });
    addLabel(slide, 'LINE 01 · LIVE READOUT', { x:hero.x+0.44, y:hero.y+3.30, w:1.56, h:0.12, fontSize:6.4, color:'CBD5E1', charSpace:0.7 });

    const board = { x:4.28, y:2.10, w:4.24, h:3.92 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'OEE DECOMPOSITION', { x:board.x+0.28, y:board.y+0.32, w:1.70, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    components.forEach((m,i)=>{
      const y = board.y + 0.88 + i*0.86;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:board.x+0.30, y:y+0.02, w:0.30, h:0.12, fontSize:6.8, color:accent });
      addText(slide, m.label || `构成 ${i+1}`, { x:board.x+0.72, y:y-0.04, w:0.98, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '—', { x:board.x+3.06, y:y-0.06, w:0.68, h:0.16, fontSize:11.2, color:accent, align:'right', fit:'shrink' });
      addRect(slide, board.x+0.72, y+0.30, 2.36, 0.055, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, board.x+0.72, y+0.30, pctWidth(m.value, 2.36), 0.055, accent, accent, { line:{color:accent, transparency:100} });
      addText(slide, m.body || m.note || '', { x:board.x+0.72, y:y+0.48, w:2.88, h:0.17, fontSize:8.8, color:C.body, fit:'shrink' });
    });
    addRect(slide, board.x+0.28, board.y+3.32, 3.52, 0.30, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    addText(slide, '产线证据要能回到停机原因、维修工单和策略更新。', { x:board.x+0.42, y:board.y+3.38, w:3.10, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });

    const ops = { x:8.92, y:2.10, w:2.86, h:3.92 };
    addRect(slide, ops.x, ops.y, ops.w, ops.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'MAINTENANCE SIGNALS', { x:ops.x+0.26, y:ops.y+0.32, w:1.78, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    [maintenance, quality].forEach((m,i)=>{
      const y = ops.y + 0.92 + i*1.05;
      const accent = i===0 ? C.cyan : C.risk;
      addText(slide, m.label || (i===0 ? '平均响应' : '重复故障'), { x:ops.x+0.28, y:y-0.02, w:1.18, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || (i===0 ? '18min' : '12%'), { x:ops.x+1.70, y:y-0.05, w:0.78, h:0.18, fontSize:13.5, color:accent, align:'right', fit:'shrink' });
      addText(slide, m.note || '纳入班组复盘。', { x:ops.x+0.28, y:y+0.36, w:1.96, h:0.28, fontSize:8.8, color:C.body, fit:'shrink' });
      addHairline(slide, ops.x+0.28, y+0.78, 2.18, C.line, 20, 0.34);
    });
    const rail = ['STATE', 'STOP', 'WO', 'OEE'];
    rail.forEach((label,i)=>{
      const y = ops.y + 3.12;
      const x = ops.x + 0.26 + i*0.58;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      slide.addShape('ellipse', { x, y, w:0.12, h:0.12, fill:{color:accent}, line:{color:accent, transparency:100} });
      if (i<rail.length-1) addHairline(slide, x+0.12, y+0.06, 0.42, C.line, 18, 0.34);
      addText(slide, label, { x:x-0.14, y:y+0.28, w:0.48, h:0.18, fontSize:5.8, color:C.muted, align:'center', fit:'shrink' });
    });
    addText(slide, s.note || 'OEE 拆解和维修闭环同屏呈现，形成从损失到动作的证据链。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function metricPctWidth(value, max = 1.8, fallback = 0.56) {
    const num = Number(String(value || '').replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(num)) return max * fallback;
    return Math.max(0.22, Math.min(max, max * Math.min(100, Math.abs(num)) / 100));
  }

  function findMetric(metrics, re, fallbackIndex = 0) {
    return metrics.find(m => re.test(`${m.label || ''} ${m.title || ''} ${m.note || ''}`)) || metrics[fallbackIndex] || {};
  }

  function healthcareServiceScorecard(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'PATIENT SERVICE SCORECARD', 0.86, 0.72, false);
    addText(slide, s.title || '患者体验与响应效率', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || '把满意度、等待时长和反馈闭环放回患者旅程，而不是孤立展示 KPI。';
    addText(slide, claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const metrics = (s.metrics || []).slice(0,4);
    const satisfaction = findMetric(metrics, /满意|NPS|experience|satisfaction/i, 0);
    const wait = findMetric(metrics, /等待|wait|响应|response/i, 1);
    const closure = findMetric(metrics, /闭环|投诉|反馈|closure|case/i, 2);
    const stage = { x:0.92, y:2.10, w:10.90, h:3.92 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

    const hero = { x:1.22, y:2.44, w:2.28, h:2.98 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY EXPERIENCE', { x:hero.x+0.28, y:hero.y+0.30, w:1.40, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
    addText(slide, satisfaction.label || '满意度', { x:hero.x+0.28, y:hero.y+0.78, w:1.10, h:0.15, fontSize:8.6, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, satisfaction.value || '—', { x:hero.x+0.26, y:hero.y+1.12, w:1.74, h:0.54, fontSize:35, color:C.white, fit:'shrink' });
    addHairline(slide, hero.x+0.28, hero.y+2.08, 0.88, C.accent, 0, 0.55);
    addText(slide, satisfaction.note || '把体验结果回看至预约、到院、检查和随访触点。', { x:hero.x+0.28, y:hero.y+2.36, w:1.58, h:0.30, fontSize:6.8, color:C.captionOnImage, fit:'shrink', breakLine:true });

    const flowX = 4.06;
    const flowY = 2.60;
    addLabel(slide, 'JOURNEY READOUT', { x:flowX, y:flowY-0.02, w:1.22, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    const journey = [
      { title:'预约', metric:wait, color:C.accent },
      { title:'到院', metric:satisfaction, color:C.cyan },
      { title:'反馈', metric:closure, color:C.violet }
    ];
    journey.forEach((j,i)=>{
      const x = flowX + i*2.12;
      slide.addShape('ellipse', { x:x, y:flowY+0.70, w:0.18, h:0.18, fill:{color:j.color}, line:{color:j.color, transparency:100} });
      if (i < journey.length - 1) addArrowLine(slide, x+0.30, flowY+0.79, 1.54, 0, j.color, { transparency:44, width:0.34 });
      addText(slide, j.title, { x:x-0.24, y:flowY+1.12, w:0.72, h:0.14, fontSize:8.6, bold:true, color:C.text, align:'center', fit:'shrink' });
      addText(slide, j.metric.value || '—', { x:x-0.34, y:flowY+1.52, w:0.92, h:0.16, fontSize:11.0, bold:true, color:j.color, align:'center', fit:'shrink' });
    });

    const queue = { x:4.02, y:4.64, w:6.70, h:0.62 };
    addRect(slide, queue.x, queue.y, queue.w, queue.h, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
    [
      ['WAIT', wait],
      ['SATISFACTION', satisfaction],
      ['CLOSURE', closure]
    ].forEach((row,i)=>{
      const x = queue.x + 0.28 + i*2.04;
      const color = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addLabel(slide, row[0], { x, y:queue.y+0.16, w:0.90, h:0.08, fontSize:4.8, color, charSpace:0.4 });
      addRect(slide, x, queue.y+0.40, 1.36, 0.045, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, x, queue.y+0.40, metricPctWidth(row[1].value, 1.36, i===0?0.42:0.76), 0.045, color, color, { line:{color, transparency:100} });
    });
    addText(slide, s.note || '患者指标页要能回到服务触点、责任动作和质量复盘。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function retailMemberGrowthBoard(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'MEMBER GROWTH BOARD', 0.86, 0.72, false);
    addText(slide, s.title || '会员增长指标', { x:0.84, y:1.06, w:5.8, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || '把复购、客单和门店转化放进会员经营节奏，而不是只展示数字。';
    addText(slide, claim, { x:0.86, y:1.54, w:6.8, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const metrics = (s.metrics || []).slice(0,4);
    const repurchase = findMetric(metrics, /复购|repeat|retention/i, 0);
    const basket = findMetric(metrics, /客单|AOV|basket|order/i, 1);
    const conversion = findMetric(metrics, /转化|conversion|门店/i, 2);
    const band = { x:0.92, y:2.16, w:10.42, h:3.62 };
    addRect(slide, band.x, band.y, band.w, band.h, C.paper || 'FFF7F0', C.line, {
      fill:{color:C.paper || 'FFF7F0', transparency:6},
      line:{color:C.line, transparency:100}
    });
    addRect(slide, band.x, band.y, 10.42, 0.12, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });

    const hero = { x:1.18, y:2.50, w:2.42, h:2.94 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'LOYALTY SIGNAL', { x:hero.x+0.28, y:hero.y+0.30, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, repurchase.label || '复购率', { x:hero.x+0.28, y:hero.y+0.78, w:1.20, h:0.15, fontSize:8.6, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, repurchase.value || '—', { x:hero.x+0.26, y:hero.y+1.12, w:1.90, h:0.54, fontSize:36, color:C.white, fit:'shrink' });
    addText(slide, formatMetricDelta(repurchase.delta || repurchase.unit), { x:hero.x+0.30, y:hero.y+1.88, w:1.36, h:0.12, fontSize:6.8, bold:true, color:C.accent, fit:'shrink' });
    addHairline(slide, hero.x+0.28, hero.y+2.24, 0.86, C.accent, 0, 0.54);
    addText(slide, repurchase.note || '用会员触达、商品组合和门店体验解释复购变化。', { x:hero.x+0.28, y:hero.y+2.52, w:1.72, h:0.28, fontSize:6.8, color:C.captionOnImage, fit:'shrink', breakLine:true });

    const cohort = { x:4.08, y:2.48, w:3.34, h:2.76 };
    addLabel(slide, 'COHORT / PRODUCT STORY', { x:cohort.x, y:cohort.y, w:1.68, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7 });
    [
      ['NEW', '新客入会', C.accent],
      ['ACTIVE', '活跃会员', C.cyan],
      ['VIP', '高价值会员', C.violet]
    ].forEach((row,i)=>{
      const y = cohort.y + 0.52 + i*0.70;
      addRect(slide, cohort.x, y-0.05, 2.88, 0.42, i===1 ? C.ink : 'FFFFFF', C.line, {
        fill:{color:i===1 ? C.ink : 'FFFFFF', transparency:i===1 ? 0 : 0},
        line:{color:i===1 ? C.ink : C.line, transparency:i===1 ? 100 : 18, width:0.34}
      });
      addLabel(slide, row[0], { x:cohort.x+0.18, y:y+0.08, w:0.60, h:0.08, fontSize:6.8, color:row[2], charSpace:0.2 });
      addText(slide, row[1], { x:cohort.x+0.94, y:y+0.06, w:1.04, h:0.13, fontSize:8.9, bold:true, color:i===1 ? C.white : C.text, fit:'shrink' });
      addRect(slide, cohort.x+2.10, y+0.10, 0.58, 0.045, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, cohort.x+2.10, y+0.10, [0.34,0.48,0.54][i], 0.045, row[2], row[2], { line:{color:row[2], transparency:100} });
    });

    const right = { x:7.72, y:3.02, w:3.08, h:2.42 };
    [basket, conversion].forEach((m,i)=>{
      const y = right.y + i*1.04;
      const color = i===0 ? C.cyan : C.violet;
      addRect(slide, right.x, y-0.02, 2.62, 0.84, 'FFFFFF', C.line, { fill:{color:'FFFFFF', transparency:0}, line:{color:C.line, transparency:18, width:0.34} });
      addLabel(slide, i===0 ? 'BASKET' : 'STORE CONVERSION', { x:right.x+0.18, y:y+0.18, w:1.34, h:0.09, fontSize:6.8, color, charSpace:0.4 });
      addText(slide, m.label || (i===0 ? '客单价' : '门店转化'), { x:right.x+0.18, y:y+0.44, w:1.12, h:0.13, fontSize:8.9, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '—', { x:right.x+1.60, y:y+0.34, w:0.76, h:0.18, fontSize:13.6, color, align:'right', fit:'shrink' });
    });
    addText(slide, s.note || '零售指标页应把数字解释为会员分层、商品组合和门店动作的结果。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function saasAdoptionRevenueBoard(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'ADOPTION / REVENUE BOARD', 0.86, 0.72, false);
    addText(slide, s.title || '增长指标进入复盘区间', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || '把 NRR、激活率和集成深度放在同一条产品采用链路上。';
    addText(slide, claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const metrics = (s.metrics || []).slice(0,4);
    const nrr = findMetric(metrics, /NRR|净收入|收入|revenue/i, 0);
    const activation = findMetric(metrics, /激活|activate|activation/i, 1);
    const integration = findMetric(metrics, /集成|integration|嵌入/i, 2);
    const board = { x:0.92, y:2.08, w:10.86, h:3.94 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

    const path = { x:1.24, y:2.62, w:9.72, h:1.62 };
    addLabel(slide, 'CUSTOMER ADOPTION PATH', { x:path.x, y:path.y-0.20, w:1.70, h:0.10, fontSize:6.4, color:C.accent, charSpace:0.6 });
    [
      { title:'激活', metric:activation, color:C.accent },
      { title:'集成', metric:integration, color:C.cyan },
      { title:'扩展', metric:nrr, color:C.violet }
    ].forEach((step,i)=>{
      const x = path.x + i*3.24;
      addRect(slide, x, path.y+0.18, 2.38, 0.92, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
        fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1?0:8},
        line:{color:i===1?step.color:C.line, transparency:i===1?20:16, width:0.38}
      });
      addText(slide, step.title, { x:x+0.28, y:path.y+0.46, w:0.78, h:0.13, fontSize:9.4, bold:true, color:i===1?C.white:C.text, align:'center', fit:'shrink' });
      addText(slide, step.metric.value || '—', { x:x+1.38, y:path.y+0.42, w:0.68, h:0.16, fontSize:10.2, bold:true, color:step.color, align:'right', fit:'shrink' });
      if (i < 2) addArrowLine(slide, x+2.52, path.y+0.64, 0.46, 0, step.color, { transparency:34, width:0.34 });
    });
    const revenue = { x:1.24, y:4.62, w:9.72, h:0.86 };
    addRect(slide, revenue.x, revenue.y, revenue.w, revenue.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'REVENUE QUALITY', { x:revenue.x+0.28, y:revenue.y+0.18, w:1.18, h:0.09, fontSize:6.2, color:C.accent, charSpace:0.5 });
    addText(slide, nrr.label || 'NRR', { x:revenue.x+1.82, y:revenue.y+0.18, w:0.74, h:0.13, fontSize:8.9, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, nrr.value || '—', { x:revenue.x+2.70, y:revenue.y+0.10, w:1.08, h:0.28, fontSize:18.8, color:C.accent, fit:'shrink' });
    addText(slide, nrr.note || '扩展收入和留存改善共同解释增长质量。', { x:revenue.x+4.40, y:revenue.y+0.26, w:3.66, h:0.14, fontSize:8.9, color:C.white, fit:'shrink' });
    addHairline(slide, revenue.x+8.42, revenue.y+0.42, 0.70, C.accent, 0, 0.52);
    addText(slide, s.note || 'SaaS 指标页要把产品采用、企业集成和扩展收入连起来看。', { x:0.94, y:6.42, w:8.8, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function drawIndustryWaterfall(slide, board, s) {
    const items = firstChartItems(s, ['waterfallBridge', 'targetBridge', 'bridge'], [
      { label:'Q1净销', value:'1482w', kind:'start' },
      { label:'P04防晒', value:'+252w', kind:'up' },
      { label:'私域', value:'+39w', kind:'up' },
      { label:'渠道修复', value:'+22w', kind:'up' },
      { label:'其他修复', value:'+55w', kind:'up' },
      { label:'Q2目标', value:'1850w', kind:'end' }
    ]).slice(0, 6);
    const baseY = board.y + 3.18;
    const topY = board.y + 0.76;
    const barW = 0.54;
    const gap = (board.w - 1.22 - items.length * barW) / Math.max(1, items.length - 1);
    addLabel(slide, 'CONTRIBUTION BRIDGE', { x:board.x+0.30, y:board.y+0.30, w:1.62, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
    addHairline(slide, board.x+0.42, baseY, board.w-0.84, C.line, 10, 0.48);
    const { bars, yForValue:yFor } = computeWaterfallBars(items, { baseY, topY });
    bars.forEach((bar) => {
      const { it, i, kind, raw, from, to } = bar;
      const x = board.x + 0.62 + i * (barW + gap);
      const y = Math.min(yFor(from), yFor(to));
      const h = Math.max(0.06, Math.abs(yFor(from) - yFor(to)));
      const color = kind === 'down' ? C.risk : (kind === 'end' ? C.ink : (kind === 'start' ? C.accent : C.cyan));
      addRect(slide, x, y, barW, h, color, color, { fill:{color, transparency:kind === 'down' ? 12 : 0}, line:{color, transparency:100} });
      addText(slide, it.value || '', { x:x-0.24, y:y-0.24, w:1.02, h:0.12, fontSize:7.3, bold:true, color, align:'center', fit:'shrink' });
      addText(slide, it.label || it.title || `项目 ${i+1}`, { x:x-0.40, y:baseY+0.24, w:1.34, h:0.20, fontSize:6.9, bold:i===0 || i===items.length-1, color:C.text, align:'center', fit:'shrink' });
      if (i < items.length - 1) {
        addHairline(slide, x+barW, yFor(to), Math.max(0.10, gap * 0.74), C.line, 24, 0.30);
      }
    });
    addLabel(slide, 'START', { x:board.x+0.40, y:baseY+0.72, w:0.44, h:0.08, fontSize:5.2, color:C.muted, charSpace:0 });
    addLabel(slide, 'TARGET', { x:board.x+board.w-1.02, y:baseY+0.72, w:0.56, h:0.08, fontSize:5.2, color:C.muted, charSpace:0 });
  }

  function drawMonthlyPulseTrend(slide, board, s) {
    const items = firstChartItems(s, ['monthlyPulse', 'monthlyTrend', 'trend'], (s.metrics || [
      { label:'1月', value:'456.2w', note:'春节前礼盒与精华稳定' },
      { label:'2月', value:'402.2w', note:'节后流量低谷' },
      { label:'3月', value:'618.4w', note:'女神节+防晒预热' }
    ])).slice(0, 5);
    const chart = { x:board.x+0.56, y:board.y+0.70, w:board.w-1.06, h:2.60 };
    addLabel(slide, 'MONTHLY NET SALES TREND', { x:board.x+0.30, y:board.y+0.30, w:1.90, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
    addHairline(slide, chart.x, chart.y+chart.h, chart.w, C.line, 10, 0.50);
    slide.addShape('line', { x:chart.x, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:24, width:0.34} });
    const trend = computeMonthlyTrendPoints(items, chart, [456.2, 402.2, 618.4, 520, 560]);
    const { values, min, max, points, baselineY } = trend;
    points.forEach((p, i) => {
      const color = i === values.indexOf(max) ? C.accent : (i === values.indexOf(min) ? C.cyan : C.violet);
      slide.addShape('line', { x:p.x, y:p.y, w:0, h:Math.max(0.04, baselineY - p.y), line:{color, transparency:18, width:0.44} });
      addHairline(slide, p.x - 0.16, baselineY, 0.32, color, 18, 0.34);
      slide.addShape('ellipse', { x:p.x-0.13, y:p.y-0.13, w:0.26, h:0.26, fill:{color}, line:{color:'FFFFFF', transparency:0, width:0.40} });
      addText(slide, p.item.value || String(p.value), { x:p.x-0.48, y:p.y-0.42, w:0.96, h:0.14, fontSize:8.2, bold:true, color, align:'center', fit:'shrink' });
      addText(slide, p.item.label || p.item.title || `${i+1}月`, { x:p.x-0.42, y:chart.y+chart.h+0.26, w:0.84, h:0.14, fontSize:8.4, bold:true, color:C.text, align:'center', fit:'shrink' });
      addText(slide, compactEvidenceCaption(p.item.note || p.item.body || '', 18), { x:p.x-0.78, y:chart.y+chart.h+0.58, w:1.56, h:0.18, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
    });
  }

  function drawChannelEfficiencyMatrix(slide, board, s) {
    const items = firstChartItems(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'], s.items || s.cards || [
      { label:'私域CRM', title:'私域CRM', value:'8x', x:22, y:82, size:64, body:'ROAS高、花费低' },
      { label:'天猫搜索', title:'天猫搜索', value:'4.1x', x:56, y:44, size:48, body:'承接品牌词' },
      { label:'抖音', title:'抖音', value:'4.1x', x:84, y:44, size:46, body:'脚本收口' },
      { label:'小红书KOL', title:'小红书KOL', value:'3.3x', x:66, y:34, size:42, body:'种草承接' },
      { label:'京东广告', title:'京东广告', value:'3.2x', x:30, y:33, size:40, body:'资源位' }
    ]).slice(0, 6);
    const chart = { x:board.x+0.54, y:board.y+0.62, w:board.w-1.06, h:2.84 };
    addLabel(slide, 'ROAS × SPEND MATRIX', { x:board.x+0.30, y:board.y+0.30, w:1.58, h:0.10, fontSize:6.6, color:C.accent, charSpace:0.8 });
    addHairline(slide, chart.x, chart.y+chart.h, chart.w, C.line, 8, 0.52);
    slide.addShape('line', { x:chart.x, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:8, width:0.52} });
    slide.addShape('line', { x:chart.x + chart.w * 0.50, y:chart.y, w:0, h:chart.h, line:{color:C.line, transparency:58, width:0.28} });
    addText(slide, 'ROAS', { x:chart.x-0.06, y:chart.y-0.28, w:0.56, h:0.11, fontSize:6.8, bold:true, color:C.muted, fit:'shrink' });
    addText(slide, '花费', { x:chart.x+chart.w-0.40, y:chart.y+chart.h+0.16, w:0.40, h:0.11, fontSize:6.8, bold:true, color:C.muted, fit:'shrink', align:'right' });
    addText(slide, '高效触点', { x:chart.x+0.18, y:chart.y+0.12, w:0.78, h:0.11, fontSize:6.4, color:C.accent, fit:'shrink' });
    addText(slide, '规模触点', { x:chart.x+chart.w-0.88, y:chart.y+0.12, w:0.76, h:0.11, fontSize:6.4, color:C.muted, fit:'shrink', align:'right' });
    const bubbles = computeChannelMatrixBubbles(items, chart, [C.accent, C.cyan, C.violet, C.risk, '94A3B8', C.muted]);
    bubbles.forEach(p => {
      slide.addShape('ellipse', { x:p.x-p.r, y:p.y-p.r, w:p.r*2, h:p.r*2, fill:{color:p.color, transparency:8}, line:{color:p.color, transparency:100} });
      addText(slide, p.item.value || p.item.roas || '', { x:p.x-p.r, y:p.y-0.06, w:p.r*2, h:0.12, fontSize:6.8, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink', allowTiny:true });
    });
    const occupiedLabels = [];
    bubbles.forEach(p => {
      const labelBox = chooseChannelLabelBox(p, { chart, bubbles, occupiedLabels });
      occupiedLabels.push(labelBox);
      const labelMidY = labelBox.y + labelBox.h / 2;
      if (labelBox.x > p.x + p.r && Math.abs(labelMidY - p.y) < 0.18) {
        const w = labelBox.x - (p.x + p.r + 0.05);
        if (w > 0.08) addHairline(slide, p.x+p.r+0.03, p.y, w, C.line, 44, 0.22);
      } else if (labelBox.x + labelBox.w < p.x - p.r && Math.abs(labelMidY - p.y) < 0.18) {
        const w = p.x - p.r - (labelBox.x + labelBox.w + 0.05);
        if (w > 0.08) addHairline(slide, labelBox.x+labelBox.w+0.03, p.y, w, C.line, 44, 0.22);
      }
      addText(slide, labelBox.label, { x:labelBox.x, y:labelBox.y+0.02, w:labelBox.w, h:labelBox.h, fontSize:7.0, bold:true, color:C.text, fit:'shrink' });
    });
    const legendY = board.y + 3.56;
    ['低花费/高效率', '高花费/高效率', '需优化'].forEach((label, i) => {
      const color = [C.accent, C.cyan, C.risk][i];
      slide.addShape('ellipse', { x:board.x+0.56+i*1.70, y:legendY+0.03, w:0.09, h:0.09, fill:{color}, line:{color, transparency:100} });
      addText(slide, label, { x:board.x+0.72+i*1.70, y:legendY, w:1.10, h:0.12, fontSize:6.8, color:C.body, fit:'shrink' });
    });
  }

  function industryChartSlide(slide, plan, s, idx) {
    const variant = variantOf(s, 'evidence-readout');
    if (variant === 'member-growth-board') return retailMemberGrowthBoard(slide, plan, s, idx);
    lightCanvas(slide);
    const labels = {
      'downtime-pareto': 'DOWNTIME PARETO',
      'valuation-sensitivity': 'VALUATION SENSITIVITY',
      'quality-handoff': 'QUALITY HANDOFF',
      'patient-bottleneck': 'PATIENT BOTTLENECK',
      'member-cohort-ladder': 'MEMBER COHORTS',
      'channel-efficiency-matrix': 'CHANNEL EFFICIENCY',
      'monthly-pulse-trend': 'MONTHLY PULSE',
      'waterfall-bridge': 'TARGET BRIDGE',
      'dispatch-map': 'DISPATCH MAP',
      'adoption-funnel': 'ADOPTION FUNNEL',
      'evidence-readout': 'INDUSTRY READOUT'
    };
    sectionKicker(slide, labels[variant] || labels['evidence-readout'], 0.86, 0.72, false);
    addText(slide, s.title || '行业证据读数', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const side = { x:0.92, y:2.10, w:2.62, h:3.96 };
    const board = { x:3.92, y:2.10, w:7.76, h:3.96 };
    addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PROOF OBJECT', { x:side.x+0.28, y:side.y+0.34, w:1.28, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || labels[variant] || '行业读数', { x:side.x+0.28, y:side.y+0.86, w:1.72, h:0.32, fontSize:14.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || s.decision || '把行业材料转成可判断、可追责、可行动的证据对象。', { x:side.x+0.28, y:side.y+1.56, w:1.86, h:0.66, fontSize:8.8, color:'CBD5E1', fit:'shrink', breakLine:true });
    addHairline(slide, side.x+0.28, side.y+2.62, 0.78, C.accent, 0, 0.55);
    addText(slide, s.note || '关键指标与行业对象放在同一张判断图中。', { x:side.x+0.28, y:side.y+2.92, w:1.76, h:0.42, fontSize:8.8, color:'A8B3C3', fit:'shrink', breakLine:true });
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });

    const chartSpec = s.chartSpec || routeChartSpec(plan, s, { index:idx, total:(plan.slides || []).length });
    let chartSpecRendered = false;
    if (chartSpec) {
      const result = renderChartSpec(componentRendererContext(slide), chartSpec, {
        x:board.x,
        y:board.y,
        w:board.w,
        h:board.h,
        noFrame:true,
        showTitle:false,
        compactHeader:true
      });
      if (result.rendered) {
        chartSpecRendered = true;
        recordChartConsumption(slide, chartSpec, result, { plannedComponentId:chartSpecToComponentId(chartSpec), mode:'native-chart-spec' });
      }
    }

    if (chartSpecRendered) {
      // chartSpec/v1 renderer owns the board.
    } else if (variant === 'waterfall-bridge') {
      drawIndustryWaterfall(slide, board, s);
    } else if (variant === 'monthly-pulse-trend') {
      drawMonthlyPulseTrend(slide, board, s);
    } else if (variant === 'channel-efficiency-matrix') {
      drawChannelEfficiencyMatrix(slide, board, s);
    } else if (variant === 'downtime-pareto') {
      const items = coerceChartItems(s.downtimePareto || s.pareto || s.lossPareto || s.oeeLosses, [
        { title:'等待备件', value:36, body:'停机分钟' },
        { title:'传感器误报', value:28, body:'停机分钟' },
        { title:'换型调试', value:22, body:'停机分钟' },
        { title:'巡检遗漏', value:14, body:'停机分钟' }
      ]).slice(0,5);
      const max = Math.max(...items.map(it => Number(it.value) || 1), 1);
      addLabel(slide, 'LOSS SOURCES', { x:board.x+0.30, y:board.y+0.32, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
      items.forEach((it,i)=>{
        const y = board.y + 0.86 + i*0.56;
        const val = Number(it.value) || (max - i*5);
        const w = Math.max(0.44, (board.w - 2.78) * val / max);
        const color = i===0 ? C.risk : (i===1 ? C.accent : C.cyan);
        addText(slide, itemTitle(it, `损失 ${i+1}`), { x:board.x+0.34, y:y-0.02, w:1.28, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
        addRect(slide, board.x+1.86, y+0.02, board.w-2.60, 0.16, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
        addRect(slide, board.x+1.86, y+0.02, w, 0.16, color, color, { fill:{color, transparency:i===0?0:10}, line:{color, transparency:100} });
        addText(slide, `${val}${it.unit || '%'}`, { x:board.x+board.w-0.78, y:y-0.01, w:0.46, h:0.12, fontSize:7.2, bold:true, color:color, align:'right', fit:'shrink' });
      });
    } else if (variant === 'valuation-sensitivity') {
      const rows = (s.valuationSensitivity && s.valuationSensitivity.rows) || s.rows || ['低增长','基准','高增长'];
      const cols = (s.valuationSensitivity && s.valuationSensitivity.cols) || ['低退出倍数','基准','高退出倍数'];
      const values = (s.valuationSensitivity && s.valuationSensitivity.values) || [[12,16,19],[15,20,24],[18,23,29]];
      addLabel(slide, 'IRR / EXIT SCENARIO', { x:board.x+0.30, y:board.y+0.32, w:1.72, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
      rows.slice(0,3).forEach((r,ri)=>{
        addText(slide, String(r), { x:board.x+0.34, y:board.y+1.00+ri*0.78, w:1.06, h:0.16, fontSize:8.8, bold:true, color:C.body, fit:'shrink' });
        cols.slice(0,3).forEach((c,ci)=>{
          if (ri===0) addText(slide, String(c), { x:board.x+1.70+ci*1.52, y:board.y+0.64, w:1.02, h:0.16, fontSize:8.8, color:C.muted, align:'center', fit:'shrink' });
          const v = (values[ri] && values[ri][ci]) || 0;
          const color = v >= 23 ? C.cyan : (v <= 14 ? C.risk : C.accent);
          addRect(slide, board.x+1.62+ci*1.52, board.y+0.92+ri*0.78, 1.18, 0.46, color, color, { fill:{color, transparency:v>=23?8:18}, line:{color, transparency:100} });
          addText(slide, `${v}%`, { x:board.x+1.62+ci*1.52, y:board.y+1.06+ri*0.78, w:1.18, h:0.12, fontSize:9.0, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink' });
        });
      });
    } else if (variant === 'quality-handoff') {
      const items = coerceChartItems(s.qualityHandoff || s.handoffs || s.handoffMap, [
        { from:'导诊', to:'检查', title:'身份与检查项目', body:'避免重复问询' },
        { from:'检查', to:'医生', title:'报告节点', body:'异常优先提醒' },
        { from:'医生', to:'随访', title:'处置建议', body:'进入质控复盘' }
      ]).slice(0,4);
      addLabel(slide, 'ROLE HANDOFFS', { x:board.x+0.30, y:board.y+0.32, w:1.30, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
      items.forEach((it,i)=>{
        const x = board.x + 0.34 + i*1.78;
        const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
        addRect(slide, x, board.y+0.92, 1.34, 1.62, panelFill(), accent, { fill:{color:panelFill(), transparency:0}, line:{color:accent, transparency:22, width:0.42} });
        addText(slide, it.from || `角色 ${i+1}`, { x:x+0.16, y:board.y+1.08, w:0.82, h:0.16, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
        addText(slide, it.to || '下一角色', { x:x+0.16, y:board.y+1.40, w:0.82, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
        addText(slide, itemTitle(it, '交接材料'), { x:x+0.16, y:board.y+1.86, w:0.96, h:0.16, fontSize:8.8, color:C.text, fit:'shrink' });
        addText(slide, itemBody(it), { x:x+0.16, y:board.y+2.18, w:0.92, h:0.18, fontSize:8.8, color:C.body, fit:'shrink' });
        if (i < items.length - 1) addArrowLine(slide, x+1.42, board.y+1.72, 0.28, 0, accent, { transparency:20, width:0.34 });
      });
    } else if (variant === 'member-cohort-ladder') {
      const items = coerceChartItems(s.memberCohorts || s.cohorts || s.rfmLadder, [
        { title:'新客', value:'31%', body:'首购转化' },
        { title:'活跃会员', value:'42%', body:'复购贡献' },
        { title:'高价值会员', value:'18%', body:'客单提升' },
        { title:'沉睡会员', value:'9%', body:'召回动作' }
      ]).slice(0,4);
      items.forEach((it,i)=>{
        const y = board.y + 3.10 - i*0.62;
        const w = 1.24 + i*0.70;
        const x = board.x + 0.72 + i*0.38;
        const accent = i===0 ? C.muted : (i===1 ? C.accent : (i===2 ? C.cyan : C.violet));
        addRect(slide, x, y, w, 0.38, accent, accent, { fill:{color:accent, transparency:i===0?22:8}, line:{color:accent, transparency:100} });
        addText(slide, itemTitle(it, `客群 ${i+1}`), { x:x+0.14, y:y+0.08, w:0.82, h:0.16, fontSize:8.8, bold:true, color:C.onAccent || C.white, fit:'shrink' });
        addText(slide, it.value || '', { x:x+w+0.28, y:y+0.08, w:0.54, h:0.16, fontSize:8.8, bold:true, color:accent, fit:'shrink' });
        addText(slide, itemBody(it), { x:x+w+0.92, y:y+0.08, w:1.44, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
      });
    } else if (variant === 'dispatch-map') {
      const items = coerceChartItems(s.dispatchMap || s.siteDispatch || s.loadStorageDispatch, [
        { title:'A 站', value:'SOC 63%', body:'告警优先' },
        { title:'B 站', value:'负荷高峰', body:'调度放电' },
        { title:'C 站', value:'限电风险', body:'策略复盘' },
        { title:'区域中心', value:'36min', body:'平均处置' }
      ]).slice(0,4);
      addText(slide, s.centerTitle || '区域调度', { x:board.x+3.12, y:board.y+1.76, w:1.06, h:0.16, fontSize:11.4, bold:true, color:C.text, align:'center', fit:'shrink' });
      slide.addShape('ellipse', { x:board.x+3.12, y:board.y+1.22, w:1.06, h:1.06, fill:{color:C.panelAlt || C.softBlue, transparency:5}, line:{color:C.accent, transparency:28, width:0.42} });
      const pos = [[0.42,0.76],[5.54,0.76],[0.42,2.72],[5.54,2.72]];
      items.forEach((it,i)=>{
        const [px,py]=pos[i];
        const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.risk));
        addRect(slide, board.x+px, board.y+py, 1.64, 0.72, panelFill(), accent, { fill:{color:panelFill(), transparency:0}, line:{color:accent, transparency:22, width:0.38} });
        addText(slide, itemTitle(it, `站点 ${i+1}`), { x:board.x+px+0.16, y:board.y+py+0.10, w:0.72, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
        addText(slide, it.value || '', { x:board.x+px+0.94, y:board.y+py+0.10, w:0.52, h:0.16, fontSize:8.8, color:accent, align:'right', fit:'shrink' });
        addText(slide, itemBody(it), { x:board.x+px+0.16, y:board.y+py+0.44, w:1.16, h:0.14, fontSize:8.8, color:C.muted, fit:'shrink' });
      });
    } else if (variant === 'adoption-funnel' || variant === 'patient-bottleneck') {
      const source = variant === 'adoption-funnel'
        ? (s.adoptionFunnel || s.activationFunnel || s.cohortFunnel)
        : (s.patientBottlenecks || s.waitBottlenecks);
      const fallback = variant === 'adoption-funnel'
        ? [{title:'注册',value:100},{title:'激活',value:64},{title:'集成',value:46},{title:'扩展',value:28}]
        : [{title:'预约',value:100,body:'入口等待'},{title:'到院',value:72,body:'签到等待'},{title:'检查',value:48,body:'资源瓶颈'},{title:'反馈',value:34,body:'处置瓶颈'}];
      const items = coerceChartItems(source, fallback).slice(0,5);
      const max = Math.max(...items.map(it => Number(it.value) || 1), 1);
      items.forEach((it,i)=>{
        const y = board.y + 0.76 + i*0.56;
        const val = Number(it.value) || (max - i*12);
        const w = Math.max(0.70, 4.80 * val / max);
        const x = board.x + 0.72 + (4.80 - w)/2;
        const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
        addRect(slide, x, y, w, 0.32, accent, accent, { fill:{color:accent, transparency:i===0?2:12}, line:{color:accent, transparency:100} });
        addText(slide, itemTitle(it, `阶段 ${i+1}`), { x:board.x+5.96, y:y+0.05, w:0.88, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
        addText(slide, `${val}${it.unit || '%'}`, { x:board.x+6.88, y:y+0.05, w:0.44, h:0.16, fontSize:8.8, color:accent, align:'right', fit:'shrink' });
      });
    } else {
      const items = coerceChartItems(s.items || s.cards, [
        { title:'对象', body:'行业材料对象' },
        { title:'证据', body:'可检查事实' },
        { title:'动作', body:'下一步行动' }
      ]).slice(0,4);
      items.forEach((it,i)=>{
        const y = board.y + 0.82 + i*0.68;
        const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
        addNumber(slide, String(i+1).padStart(2,'0'), { x:board.x+0.34, y:y+0.08, w:0.30, h:0.11, fontSize:6.8, color:accent });
        addText(slide, itemTitle(it, `证据 ${i+1}`), { x:board.x+0.82, y:y, w:1.30, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
        addText(slide, itemBody(it), { x:board.x+2.42, y:y, w:3.72, h:0.16, fontSize:8.8, color:C.body, fit:'shrink' });
        addHairline(slide, board.x+0.82, y+0.36, board.w-1.52, C.line, 18, 0.30);
      });
    }
    const logic = s.businessLogic || s.business_logic || s.diagnosticChain || s.diagnostic_chain;
    if (logic && typeof logic === 'object') {
      const logicItems = [
        { label:'现状', text:logic.currentState || logic.current_state || logic.problem || '' },
        { label:'原因', text:logic.cause || logic.root_cause || logic.driver || '' },
        { label:'动作', text:logic.action || logic.operating_action || logic.response || '' },
        { label:'衡量', text:logic.metric || logic.measure || logic.kpi || logic.expected_result || '' }
      ].filter(item => item.text);
      if (logicItems.length >= 2) {
        addHairline(slide, 0.94, 6.32, 10.70, C.line, 12, 0.55);
        const slotW = 10.44 / logicItems.length;
        logicItems.forEach((item, i) => {
          const x = 1.00 + i * slotW;
          const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
          addLabel(slide, item.label, { x, y:6.54, w:0.46, h:0.10, fontSize:5.8, color:accent, charSpace:0 });
          addText(slide, compactEvidenceCaption(item.text, 20), { x:x+0.54, y:6.50, w:slotW-0.66, h:0.14, fontSize:7.6, color:C.body, fit:'shrink' });
        });
      }
    }
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function metricComparison(slide, plan, s, idx) {
    const C = ctx.colors();
    const variant = ctx.variantOf(s, '');
    if (variant === 'brand-world-and-business-proof') return ctx.brandWorldBusinessProof(slide, plan, s, idx);
    if (variant === 'product-evidence-story') return ctx.productEvidenceStory(slide, plan, s, idx);
    if (variant === 'consumer-proof-photo-grid') return ctx.consumerProofPhotoGrid(slide, plan, s, idx);
    if (variant === 'sustainability-proof-spread') return ctx.sustainabilityProofSpread(slide, plan, s, idx);
    if (variant === 'financial-kpi-snapshot') return financialKpiSnapshot(slide, plan, s, idx);
    if (variant === 'chart-grid-with-commentary') return chartGridWithCommentary(slide, plan, s, idx);
    if (variant === 'quarterly-results-summary') return quarterlyResultsSummary(slide, plan, s, idx);
    if (variant === 'oee-board' || s.oee || s.oeeComponents) return manufacturingOeeBoard(slide, plan, s, idx);
    if (variant === 'patient-service-scorecard' || plan.industry === 'healthcare-operations') return healthcareServiceScorecard(slide, plan, s, idx);
    if (variant === 'member-growth-board' || isVisualIndustry(plan, 'brand-retail')) return retailMemberGrowthBoard(slide, plan, s, idx);
    if (variant === 'adoption-revenue-board' || plan.industry === 'saas-technology') return saasAdoptionRevenueBoard(slide, plan, s, idx);
    if (plan.industry === 'finance-investment' || /financial-kpi-snapshot|chart-grid-with-commentary|quarterly-results-summary/i.test(variant)) return financeMetricDashboard(slide, plan, s, idx);

    ctx.lightCanvas(slide);
    ctx.sectionKicker(slide, 'PERFORMANCE SIGNAL', 0.86, 0.72, false);
    ctx.addText(slide, s.title || '关键指标变化', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    const claim = s.claim || s.subtitle || s.intro || '以少量核心指标判断增长质量，并把变化原因收束到下一步经营动作。';
    ctx.addText(slide, claim, { x:0.86, y:1.54, w:6.8, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
    ctx.addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const metrics = (s.metrics || []).slice(0,4);
    const big = metrics[0] || {};
    const side = metrics.slice(1,3);
    const panel = { x:0.92, y:2.12, w:11.28, h:3.72 };
    ctx.addRect(slide, panel.x, panel.y, panel.w, panel.h, ctx.panelFill(), C.line, {
      fill:{color:ctx.panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.55}
    });
    ctx.addRect(slide, panel.x, panel.y, 0.06, panel.h, C.accent, C.accent, { line:{color:C.accent, transparency:100} });

    ctx.addLabel(slide, 'PRIMARY KPI', { x:1.34, y:2.50, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.9 });
    ctx.addText(slide, big.label || '核心指标', { x:1.34, y:2.82, w:2.20, h:0.20, fontSize:11.2, bold:true, color:C.text, fit:'shrink' });
    ctx.addNumber(slide, big.value || '—', { x:1.30, y:3.18, w:2.72, h:0.86, fontSize:50, color:C.accent, fit:'shrink' });
    const bigDelta = ctx.formatMetricDelta(big.delta || big.unit);
    if (bigDelta) {
      ctx.addRect(slide, 1.36, 4.18, 1.70, 0.28, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
      ctx.addText(slide, bigDelta, { x:1.50, y:4.25, w:1.42, h:0.11, fontSize:7.0, bold:true, color:C.onAccent || C.white, fit:'shrink' });
    }
    ctx.addText(slide, big.note || '核心增长信号已经形成，需要继续验证触达、组合与成交之间的贡献关系。', {
      x:1.36, y:4.74, w:3.00, h:0.42, fontSize:8.8, color:C.body, breakLine:true, fit:'shrink'
    });

    slide.addShape('line', { x:4.78, y:2.54, w:0, h:2.70, line:{color:C.line, transparency:10, width:0.55} });
    side.forEach((m,i)=>{
      const x = 5.28 + i*3.10;
      const accent = i === 0 ? C.cyan : C.tertiary || C.violet;
      ctx.addLabel(slide, `SUPPORT 0${i+1}`, { x, y:2.54, w:1.10, h:0.10, fontSize:5.8, color:accent, charSpace:0.9 });
      ctx.addText(slide, m.label || `指标 ${i+2}`, { x, y:2.86, w:1.72, h:0.17, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      ctx.addNumber(slide, m.value || '—', { x, y:3.22, w:1.74, h:0.42, fontSize:28, color:accent, fit:'shrink' });
      const delta = ctx.formatMetricDelta(m.delta || m.unit);
      if (delta) ctx.addText(slide, delta, { x, y:3.92, w:1.58, h:0.13, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
      ctx.addText(slide, m.note || '', { x, y:4.36, w:2.04, h:0.30, fontSize:7.8, color:C.body, breakLine:true, fit:'shrink' });
      ctx.addRect(slide, x, 5.18, 1.84, 0.04, C.line, C.line, { line:{color:C.line, transparency:100} });
      ctx.addRect(slide, x, 5.18, i === 0 ? 0.94 : 1.20, 0.04, accent, accent, { line:{color:accent, transparency:100} });
    });

    const foot = ctx.publicSlideNote(s.note);
    const logic = s.businessLogic || s.business_logic || s.diagnosticChain || s.diagnostic_chain;
    if (logic && typeof logic === 'object') {
      const logicItems = [
        { label:'现状', text:logic.currentState || logic.current_state || logic.problem || '' },
        { label:'原因', text:logic.cause || logic.root_cause || logic.driver || '' },
        { label:'动作', text:logic.action || logic.operating_action || logic.response || '' },
        { label:'衡量', text:logic.metric || logic.measure || logic.kpi || logic.expected_result || '' }
      ].filter(item => item.text);
      if (logicItems.length >= 2) {
        ctx.addHairline(slide, 0.94, 6.10, 10.90, C.line, 12, 0.55);
        const slotW = 10.64 / logicItems.length;
        logicItems.forEach((item, i) => {
          const x = 1.00 + i * slotW;
          const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
          ctx.addLabel(slide, item.label, { x, y:6.34, w:0.46, h:0.10, fontSize:5.8, color:accent, charSpace:0 });
          ctx.addText(slide, ctx.compactEvidenceCaption(item.text, 22), { x:x+0.54, y:6.30, w:slotW-0.66, h:0.14, fontSize:7.8, color:C.body, fit:'shrink' });
        });
      }
    } else if (foot) {
      ctx.addHairline(slide, 0.94, 6.28, 10.90, C.line, 12, 0.55);
      ctx.addLabel(slide, '管理信号', { x:0.96, y:6.54, w:1.52, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
      ctx.addText(slide, foot, { x:2.52, y:6.50, w:7.75, h:0.15, fontSize:8.4, color:C.body, fit:'shrink' });
    }
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  return {
    financeBridgeSlide,
    portfolioTableSlide,
    industryChartSlide,
    metricComparison,
    chartGridWithCommentary,
    financeMetricDashboard,
    financialKpiSnapshot,
    quarterlyResultsSummary
  };
}

function entries(renderers = {}) {
  return [
    { types:['metric-comparison'], render:renderers.metricComparison, source:`page-family:${family}` },
    { types:['industry-chart'], render:renderers.industryChartSlide, source:`page-family:${family}` },
    { types:['finance-bridge'], render:renderers.financeBridgeSlide, source:`page-family:${family}` },
    { types:['portfolio-table'], render:renderers.portfolioTableSlide, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createFinancialRenderers,
  entries
};
