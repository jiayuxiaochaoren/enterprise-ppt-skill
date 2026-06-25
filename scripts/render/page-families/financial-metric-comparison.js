const {
  createGenericMetricComparisonRenderer
} = require('./financial-metric-generic-comparison');

function createMetricComparisonRenderer(ctx = {}, renderers = {}) {
  const {
    chartGridWithCommentary,
    financeMetricDashboard,
    financialKpiSnapshot,
    healthcareServiceScorecard,
    manufacturingOeeBoard,
    peopleCultureGrowthBoard,
    quarterlyResultsSummary,
    retailMemberGrowthBoard,
    saasAdoptionRevenueBoard,
    industryChartSlide
  } = renderers;
  const {
    isVisualIndustry
  } = ctx;
  const genericMetricComparison = createGenericMetricComparisonRenderer(ctx);
  const beautyChartVariants = new Set([
    'monthly-pulse-trend',
    'channel-efficiency-matrix',
    'member-cohort-ladder',
    'social-funnel',
    'review-sentiment-pareto',
    'waterfall-bridge'
  ]);

  function industryChartVariantFor(s = {}) {
    const proofObject = s.proofObject || s.proof_object || '';
    const chart = s.chartSpec || s.chart_spec || {};
    const componentId = chart.componentId || '';
    const kind = String(chart.kind || '').toLowerCase();
    const key = [proofObject, componentId].find(value => beautyChartVariants.has(value));
    if (key) return key;
    if (kind === 'funnel') return 'social-funnel';
    if (kind === 'pareto') return 'review-sentiment-pareto';
    return '';
  }

  return function metricComparison(slide, plan, s, idx) {
    const variant = ctx.variantOf(s, '');
    const industryChartVariant = industryChartVariantFor(s);
    const shouldUseIndustryChart = industryChartSlide && industryChartVariant && (
      plan.industry === 'beauty-consumer' ||
      plan.industry === 'manufacturing-operations' ||
      isVisualIndustry(plan, 'brand-retail') ||
      isVisualIndustry(plan, 'manufacturing-operations')
    );
    if (shouldUseIndustryChart) {
      return industryChartSlide(slide, plan, Object.assign({}, s, {
        layoutVariant: industryChartVariant,
        variant: industryChartVariant
      }), idx);
    }
    if (variant === 'brand-world-and-business-proof') return ctx.brandWorldBusinessProof(slide, plan, s, idx);
    if (variant === 'product-evidence-story') return ctx.productEvidenceStory(slide, plan, s, idx);
    if (variant === 'consumer-proof-photo-grid') return ctx.consumerProofPhotoGrid(slide, plan, s, idx);
    if (variant === 'sustainability-proof-spread') return ctx.sustainabilityProofSpread(slide, plan, s, idx);
    if (variant === 'financial-kpi-snapshot') return financialKpiSnapshot(slide, plan, s, idx);
    if (variant === 'chart-grid-with-commentary') return chartGridWithCommentary(slide, plan, s, idx);
    if (variant === 'quarterly-results-summary') return quarterlyResultsSummary(slide, plan, s, idx);
    if (variant === 'company-profile-proof' && peopleCultureGrowthBoard) return peopleCultureGrowthBoard(slide, plan, s, idx);
    if (variant === 'oee-board' || s.oee || s.oeeComponents) return manufacturingOeeBoard(slide, plan, s, idx);
    if (variant === 'patient-service-scorecard' || plan.industry === 'healthcare-operations') return healthcareServiceScorecard(slide, plan, s, idx);
    if (variant === 'member-growth-board' || isVisualIndustry(plan, 'brand-retail')) return retailMemberGrowthBoard(slide, plan, s, idx);
    if (variant === 'adoption-revenue-board' || plan.industry === 'saas-technology') return saasAdoptionRevenueBoard(slide, plan, s, idx);
    if (plan.industry === 'finance-investment' || /financial-kpi-snapshot|chart-grid-with-commentary|quarterly-results-summary/i.test(variant)) return financeMetricDashboard(slide, plan, s, idx);

    return genericMetricComparison(slide, plan, s, idx);
  };
}

module.exports = {
  createMetricComparisonRenderer
};
