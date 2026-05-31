const {
  assertRendererContext
} = require('../renderer-context');

function createFinancialScorecardRenderers(ctx = {}) {
  assertRendererContext(ctx, ['financialScorecard'], { label:'financial scorecard renderer context' });
  const C = ctx.colors();
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    footerText,
    formatMetricDelta,
    lightCanvas,
    panelFill,
    sectionKicker
  } = ctx;

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


  return {
    healthcareServiceScorecard,
    manufacturingOeeBoard,
    retailMemberGrowthBoard,
    saasAdoptionRevenueBoard
  };
}

module.exports = {
  createFinancialScorecardRenderers
};
