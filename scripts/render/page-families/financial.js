const family = 'financial';

const types = [
  'metric-comparison',
  'industry-chart',
  'finance-bridge',
  'portfolio-table'
];

function createFinancialRenderers(ctx = {}) {
  function financeBridgeSlide(slide, plan, s, idx) {
    const C = ctx.colors();
    ctx.lightCanvas(slide);
    ctx.sectionKicker(slide, 'RETURN BRIDGE', 0.86, 0.72, false);
    ctx.addText(slide, s.title || '组合回报归因桥', { x:0.84, y:1.06, w:5.8, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.claim) ctx.addText(slide, s.subtitle || s.claim, { x:0.86, y:1.54, w:6.9, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
    ctx.PageNumber(slide, idx);

    const bridge = (s.bridge || []).slice(0,6);
    const chart = { x:0.92, y:2.08, w:7.28, h:4.00 };
    ctx.addRect(slide, chart.x, chart.y, chart.w, chart.h, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    ctx.addLabel(slide, 'IRR CONTRIBUTION', { x:chart.x+0.30, y:chart.y+0.32, w:1.52, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    ctx.addHairline(slide, chart.x+0.44, chart.y+3.22, chart.w-0.88, C.line, 10, 0.48);
    const barW = 0.62;
    const gap = bridge.length > 1 ? (chart.w - 1.24 - bridge.length*barW) / (bridge.length - 1) : 0.80;
    bridge.forEach((b,i)=>{
      const kind = b.kind || b.type || (i===0?'start':(i===bridge.length-1?'end':'up'));
      const h = Math.max(0.30, Math.min(2.20, Number(b.height) || (kind === 'down' ? 0.76 : (kind === 'end' ? 1.68 : 0.92))));
      const x = chart.x + 0.62 + i*(barW+gap);
      const y = chart.y + 3.22 - h;
      const color = kind === 'down' ? C.risk : (kind === 'end' || kind === 'start' ? C.accent : C.cyan);
      ctx.addRect(slide, x, y, barW, h, color, color, { fill:{color, transparency:kind === 'down' ? 12 : 0}, line:{color, transparency:100} });
      ctx.addText(slide, b.value || '', { x:x-0.22, y:y-0.26, w:1.06, h:0.12, fontSize:7.0, bold:true, color:kind === 'down' ? C.risk : C.text, align:'center', fit:'shrink' });
      ctx.addText(slide, b.label || `项目 ${i+1}`, { x:x-0.36, y:chart.y+3.46, w:1.32, h:0.24, fontSize:6.8, color:C.body, align:'center', fit:'shrink' });
      if (i < bridge.length - 1) ctx.addHairline(slide, x+barW, y, gap*0.72, C.line, 34, 0.30);
    });

    const actions = s.actions || s.items || [];
    const side = { x:8.66, y:2.08, w:3.06, h:4.00 };
    ctx.addRect(slide, side.x, side.y, side.w, side.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    ctx.addLabel(slide, 'CAPITAL ACTIONS', { x:side.x+0.28, y:side.y+0.34, w:1.44, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    ctx.addText(slide, s.decision || '把归因结果转化为加仓、维持、退出和风险隔离动作。', { x:side.x+0.28, y:side.y+0.80, w:2.14, h:0.40, fontSize:8.2, color:'CBD5E1', breakLine:true, fit:'shrink' });
    actions.slice(0,4).forEach((a,i)=>{
      const y = side.y + 1.66 + i*0.58;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.risk : '94A3B8'));
      ctx.addNumber(slide, String(i+1).padStart(2,'0'), { x:side.x+0.30, y:y+0.06, w:0.28, h:0.12, fontSize:6.8, color:accent });
      ctx.addText(slide, ctx.itemTitle(a, `动作 ${i+1}`), { x:side.x+0.70, y:y+0.01, w:1.78, h:0.12, fontSize:7.8, bold:true, color:C.white, fit:'shrink' });
      const body = ctx.compactEvidenceCaption(ctx.itemBody(a), 18);
      if (body) ctx.addText(slide, body, { x:side.x+0.70, y:y+0.27, w:1.76, h:0.12, fontSize:6.8, color:'A8B3C3', fit:'shrink' });
    });
    ctx.addText(slide, s.note || '桥图解释变化来源，让投委会同时看到结果和驱动因素。', { x:0.94, y:6.42, w:8.6, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function portfolioTableSlide(slide, plan, s, idx) {
    const C = ctx.colors();
    ctx.lightCanvas(slide);
    ctx.sectionKicker(slide, 'PORTFOLIO ACTION TABLE', 0.86, 0.72, false);
    ctx.addText(slide, s.title || '组合分层与行动清单', { x:0.84, y:1.06, w:5.9, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.claim) ctx.addText(slide, s.subtitle || s.claim, { x:0.86, y:1.54, w:7.0, h:0.20, fontSize:10.2, color:C.muted, fit:'shrink' });
    ctx.addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const rows = (s.portfolio || s.allocations || s.rows || []).slice(0,5);
    const summary = { x:0.92, y:2.10, w:2.72, h:3.94 };
    ctx.addRect(slide, summary.x, summary.y, summary.w, summary.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    ctx.addLabel(slide, 'ALLOCATION VIEW', { x:summary.x+0.28, y:summary.y+0.34, w:1.46, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    const total = rows.reduce((sum,r)=>sum+(Number(r.weight) || 0), 0) || 100;
    rows.slice(0,4).forEach((r,i)=>{
      const y = summary.y + 1.06 + i*0.58;
      const share = Math.max(0.18, Math.min(0.96, (Number(r.weight) || (25 - i*3)) / total * 2.4));
      const color = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      slide.addShape('ellipse', { x:summary.x+0.34, y:y+0.05, w:0.10, h:0.10, fill:{color}, line:{color, transparency:100} });
      ctx.addText(slide, r.theme || r.name || `组合 ${i+1}`, { x:summary.x+0.58, y:y, w:1.10, h:0.12, fontSize:6.8, bold:true, color:C.white, fit:'shrink' });
      ctx.addText(slide, `${r.weight || ''}%`, { x:summary.x+2.00, y:y, w:0.40, h:0.12, fontSize:6.8, color:'A8B3C3', align:'right', fit:'shrink' });
      ctx.addRect(slide, summary.x+0.58, y+0.28, 1.58, 0.035, '334155', '334155', { line:{color:'334155', transparency:100} });
      ctx.addRect(slide, summary.x+0.58, y+0.28, share, 0.035, color, color, { line:{color, transparency:100} });
    });
    ctx.addHairline(slide, summary.x+0.32, summary.y+3.42, 0.82, C.accent, 0, 0.56);
    ctx.addText(slide, s.summary || '按主题、风险和现金回收能力决定下一阶段配置动作。', { x:summary.x+0.32, y:summary.y+3.58, w:1.94, h:0.22, fontSize:6.8, color:'A8B3C3', fit:'shrink' });

    const table = { x:3.94, y:2.10, w:7.84, h:3.94 };
    ctx.addRect(slide, table.x, table.y, table.w, table.h, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    const headers = ['主题', '权重', 'IRR', 'DPI', '风险', '动作'];
    const col = [0, 1.62, 2.54, 3.38, 4.20, 5.10];
    const colW = [1.40, 0.70, 0.62, 0.62, 0.76, 1.92];
    headers.forEach((h,i)=>ctx.addText(slide, h, {
      x:table.x+0.28+col[i], y:table.y+0.30, w:colW[i], h:0.15,
      fontSize:7.7, bold:true, color:i===0?C.accent:C.muted, fit:false
    }));
    ctx.addHairline(slide, table.x+0.24, table.y+0.66, table.w-0.48, C.line, 12, 0.45);
    rows.forEach((r,i)=>{
      const y = table.y + 0.96 + i*0.54;
      const riskColor = r.risk === '高' ? C.risk : (r.risk === '低' ? C.cyan : C.accent);
      ctx.addNumber(slide, String(i+1).padStart(2,'0'), { x:table.x+0.28, y:y, w:0.28, h:0.14, fontSize:7.3, color:i===0?C.accent:C.muted });
      ctx.addText(slide, r.theme || r.name || `主题 ${i+1}`, { x:table.x+0.66, y:y, w:1.16, h:0.14, fontSize:7.8, bold:true, color:C.text, fit:false });
      ctx.addText(slide, `${r.weight || '—'}%`, { x:table.x+1.88, y:y, w:0.52, h:0.14, fontSize:7.6, color:C.body, align:'right', fit:false });
      ctx.addText(slide, r.irr || '—', { x:table.x+2.78, y:y, w:0.48, h:0.14, fontSize:7.6, color:C.body, align:'right', fit:false });
      ctx.addText(slide, r.dpi || '—', { x:table.x+3.60, y:y, w:0.48, h:0.14, fontSize:7.6, color:C.body, align:'right', fit:false });
      ctx.addRect(slide, table.x+4.46, y-0.02, 0.54, 0.24, riskColor, riskColor, { fill:{color:riskColor, transparency:8}, line:{color:riskColor, transparency:100} });
      ctx.addText(slide, r.risk || '中', {
        x:table.x+4.46, y:y+0.02, w:0.54, h:0.16,
        fontSize:7.2, bold:true, color:C.onAccent || C.white, align:'center', valign:'mid', fit:false
      });
      ctx.addText(slide, ctx.compactEvidenceCaption(r.action || '维持观察', 26), {
        x:table.x+5.34, y:y-0.01, w:1.88, h:0.24,
        fontSize:7.5, bold:true, color:C.text, fit:false, breakLine:true, valign:'mid'
      });
      ctx.addHairline(slide, table.x+0.24, y+0.34, table.w-0.48, C.line, 20, 0.30);
    });
    ctx.addText(slide, s.note || '配置比例、回收质量、风险等级和下一步动作放在同一坐标。', { x:0.94, y:6.42, w:8.6, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function industryChartSlide(slide, plan, s, idx) {
    const variant = ctx.variantOf(s, 'evidence-readout');
    if (variant === 'member-growth-board') return ctx.retailMemberGrowthBoard(slide, plan, s, idx);
    return ctx.industryChartSlideBase(slide, plan, s, idx);
  }

  function metricComparison(slide, plan, s, idx) {
    const C = ctx.colors();
    const variant = ctx.variantOf(s, '');
    if (variant === 'brand-world-and-business-proof') return ctx.brandWorldBusinessProof(slide, plan, s, idx);
    if (variant === 'product-evidence-story') return ctx.productEvidenceStory(slide, plan, s, idx);
    if (variant === 'consumer-proof-photo-grid') return ctx.consumerProofPhotoGrid(slide, plan, s, idx);
    if (variant === 'sustainability-proof-spread') return ctx.sustainabilityProofSpread(slide, plan, s, idx);
    if (variant === 'financial-kpi-snapshot') return ctx.financialKpiSnapshot(slide, plan, s, idx);
    if (variant === 'chart-grid-with-commentary') return ctx.chartGridWithCommentary(slide, plan, s, idx);
    if (variant === 'quarterly-results-summary') return ctx.quarterlyResultsSummary(slide, plan, s, idx);
    if (variant === 'oee-board' || s.oee || s.oeeComponents) return ctx.manufacturingOeeBoard(slide, plan, s, idx);
    if (variant === 'patient-service-scorecard' || plan.industry === 'healthcare-operations') return ctx.healthcareServiceScorecard(slide, plan, s, idx);
    if (variant === 'member-growth-board' || ctx.isVisualIndustry(plan, 'brand-retail')) return ctx.retailMemberGrowthBoard(slide, plan, s, idx);
    if (variant === 'adoption-revenue-board' || plan.industry === 'saas-technology') return ctx.saasAdoptionRevenueBoard(slide, plan, s, idx);
    if (plan.industry === 'finance-investment' || /financial-kpi-snapshot|chart-grid-with-commentary|quarterly-results-summary/i.test(variant)) return ctx.financeMetricDashboard(slide, plan, s, idx);

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
    metricComparison
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
