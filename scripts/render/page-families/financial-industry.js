const {
  chooseChannelLabelBox,
  coerceChartItems,
  computeChannelMatrixBubbles,
  computeMonthlyTrendPoints,
  computeWaterfallBars,
  firstChartItems
} = require('./financial-chart-utils');

function createFinancialIndustryRenderers(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const retailMemberGrowthBoard = helpers.retailMemberGrowthBoard || (() => false);
  const {
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
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    recordChartConsumption,
    renderChartSpec,
    routeChartSpec,
    sectionKicker,
    variantOf
  } = ctx;

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


  return {
    industryChartSlide
  };
}

module.exports = {
  createFinancialIndustryRenderers
};
