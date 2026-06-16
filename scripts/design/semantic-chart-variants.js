const {
  normalizeProofObject
} = require('./proof-taxonomy');

function createSemanticChartVariantHelpers(deps = {}) {
  const {
    contentSignals = () => ({}),
    flattenText,
    hasValueField,
    industryProofCandidates = () => [],
    visualIndustryId
  } = deps;

  function dataGrammarVariant(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    const industry = plan.industry || '';
    const visualIndustry = visualIndustryId(industry);
    const isRetail = industry === 'brand-retail' || industry === 'beauty-consumer' || visualIndustry === 'brand-retail';
    const text = flattenText(s);
    const dataComponent = String(s.dataComponent || s.data_component || s.proofObject || s.proof_object || '').toLowerCase();
    if (hasValueField(s, ['waterfallBridge', 'targetBridge']) || /waterfall|bridge|target-?bridge|目标桥|目标差额|缺口/.test(dataComponent)) return 'waterfall-bridge';
    if (hasValueField(s, ['monthlyPulse', 'monthlyTrend']) || /monthly|trend|pulse|line|月度|趋势|脉冲/.test(dataComponent)) return 'monthly-pulse-trend';
    if (hasValueField(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels']) || /scatter|bubble|efficiency|channel|media|roas|roi|渠道|投放/.test(dataComponent)) return 'channel-efficiency-matrix';
    if (isRetail && /投放|花费|ROAS|ROI|渠道|搜索|广告|抖音|小红书|KOC|KOL|通勤防晒|media efficiency/i.test(text)) return 'channel-efficiency-matrix';
    if (isRetail && /月度|月脉冲|低谷|1月|2月|3月|一月|二月|三月|环比|同比|趋势|拉回来|monthly|pulse/i.test(text)) return 'monthly-pulse-trend';
    if (isRetail && /目标差额|目标桥|增长桥|缺口|Q2目标|净销|GMV|退款|实收|导出GMV|财务净销|waterfall|bridge/i.test(text)) return 'waterfall-bridge';
    return '';
  }

  function industryChartVariant(plan = {}, s = {}, signals = contentSignals(plan, s)) {
    const industry = plan.industry || '';
    const visualIndustry = visualIndustryId(industry);
    const text = flattenText(s);
    const grammarVariant = dataGrammarVariant(plan, s, signals);
    if (grammarVariant) return grammarVariant;
    const chartProof = industryProofCandidates(plan, s, signals)
      .find(p => String(p.route || '').startsWith('industry-chart:') && p.score >= 3);
    if (chartProof) return String(chartProof.route).split(':')[1] || chartProof.id;
    if (hasValueField(s, ['reviewSentiment']) || /评论|评价|反馈主题|review sentiment|voice of customer/i.test(text)) {
      return 'review-sentiment-ranking';
    }
	    if (hasValueField(s, ['downtimePareto', 'pareto', 'lossPareto', 'oeeLosses']) || /停机.*(Pareto|帕累托|TOP|排行)|故障.*(Pareto|帕累托)|节拍损失|OEE.*损失/i.test(text)) {
	      return normalizeProofObject('loss-pareto', {
	        industry,
	        text,
        proofIntent: s.proofIntent || s.proof_intent,
        displayCopy: s.displayCopy || s.display_copy,
        slide: s,
        signals
      });
    }
    if (hasValueField(s, ['valuationSensitivity', 'sensitivity', 'exitScenarios', 'irrSensitivity']) || /敏感性|估值矩阵|退出情景|IRR.*DPI|valuation sensitivity|scenario/i.test(text)) return 'valuation-sensitivity';
    if (hasValueField(s, ['qualityHandoff', 'handoffs', 'handoffMap']) || /交接|handoff|护理交接|科室交接|质量交接/i.test(text)) return 'quality-handoff';
    if (hasValueField(s, ['patientBottlenecks', 'waitBottlenecks']) || /等待瓶颈|排队瓶颈|患者等待|候诊|bottleneck/i.test(text)) return 'patient-bottleneck';
    if (hasValueField(s, ['memberCohorts', 'cohorts', 'rfmLadder']) || /会员分层|RFM| cohort|复购阶梯|客群阶梯/i.test(text)) return 'member-cohort-ladder';
    if (hasValueField(s, ['channelEfficiency', 'mediaEfficiency', 'scatter', 'channels'])) return 'channel-efficiency-matrix';
    if (hasValueField(s, ['monthlyPulse', 'monthlyTrend', 'trend'])) return 'monthly-pulse-trend';
    if (hasValueField(s, ['waterfallBridge', 'targetBridge'])) return 'waterfall-bridge';
    if (hasValueField(s, ['dispatchMap', 'siteDispatch', 'loadStorageDispatch']) || /调度地图|站点调度|负荷.*储能|SOC|dispatch/i.test(text)) return 'dispatch-map';
    if (hasValueField(s, ['adoptionFunnel', 'activationFunnel', 'cohortFunnel']) || /采用漏斗|激活漏斗|扩展漏斗|activation funnel|adoption funnel/i.test(text)) return 'adoption-funnel';
    if (industry === 'manufacturing-operations' && signals.hasOeeBoard) return 'loss-pareto';
    if (industry === 'finance-investment' && signals.isNumberHeavy) return 'valuation-sensitivity';
    if (industry === 'healthcare-operations' && signals.hasServiceBlueprint) return 'quality-handoff';
    if ((industry === 'brand-retail' || industry === 'beauty-consumer' || visualIndustry === 'brand-retail') && /会员|复购|RFM|cohort/i.test(text)) return 'member-cohort-ladder';
    if (industry === 'energy-utility' && /站点|电站|储能|告警/i.test(text)) return 'dispatch-map';
    if (industry === 'saas-technology' && /采用|激活|留存|NRR|ARR/i.test(text)) return 'adoption-funnel';
    return 'evidence-readout';
  }

  return {
    dataGrammarVariant,
    industryChartVariant
  };
}

module.exports = {
  createSemanticChartVariantHelpers
};
