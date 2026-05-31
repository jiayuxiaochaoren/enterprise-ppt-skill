const family = 'financial';
const {
  createFinancialInvestmentRenderers
} = require('./financial-investment');
const {
  createFinancialIndustryRenderers
} = require('./financial-industry');
const {
  createFinancialResultsRenderers
} = require('./financial-results');
const {
  createFinancialScorecardRenderers
} = require('./financial-scorecards');

const types = [
  'metric-comparison',
  'industry-chart',
  'finance-bridge',
  'portfolio-table'
];

function createFinancialRenderers(ctx = {}) {
  const {
    isVisualIndustry
  } = ctx;
  const {
    financeBridgeSlide,
    portfolioTableSlide
  } = createFinancialInvestmentRenderers(ctx);
  const {
    chartGridWithCommentary,
    financeMetricDashboard,
    financialKpiSnapshot,
    quarterlyResultsSummary
  } = createFinancialResultsRenderers(ctx);
  const {
    healthcareServiceScorecard,
    manufacturingOeeBoard,
    retailMemberGrowthBoard,
    saasAdoptionRevenueBoard
  } = createFinancialScorecardRenderers(ctx);
  const {
    industryChartSlide
  } = createFinancialIndustryRenderers(ctx, { retailMemberGrowthBoard });

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
