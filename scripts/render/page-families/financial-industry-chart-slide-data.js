const INDUSTRY_CHART_VARIANT_LABELS = {
  'downtime-pareto': '停机帕累托',
  'valuation-sensitivity': '估值敏感性',
  'quality-handoff': '质量交接',
  'patient-bottleneck': '服务瓶颈',
  'member-cohort-ladder': '会员分层',
  'channel-efficiency-matrix': '渠道效率',
  'monthly-pulse-trend': '月度趋势',
  'waterfall-bridge': '目标桥',
  'fact-metrics': '指标读数',
  'dispatch-map': '调度地图',
  'adoption-funnel': '采用漏斗',
  'evidence-readout': '行业读数'
};

function industryChartVariantLabel(variant) {
  return INDUSTRY_CHART_VARIANT_LABELS[variant] || INDUSTRY_CHART_VARIANT_LABELS['evidence-readout'];
}

function industryBusinessLogicItems(s = {}) {
  const logic = s.businessLogic || s.business_logic || s.diagnosticChain || s.diagnostic_chain;
  if (!logic || typeof logic !== 'object') return [];
  return [
    { label:'现状', text:logic.currentState || logic.current_state || logic.problem || '' },
    { label:'原因', text:logic.cause || logic.root_cause || logic.driver || '' },
    { label:'动作', text:logic.action || logic.operating_action || logic.response || '' },
    { label:'衡量', text:logic.metric || logic.measure || logic.kpi || logic.expected_result || '' }
  ].filter(item => item.text);
}

module.exports = {
  INDUSTRY_CHART_VARIANT_LABELS,
  industryBusinessLogicItems,
  industryChartVariantLabel
};
