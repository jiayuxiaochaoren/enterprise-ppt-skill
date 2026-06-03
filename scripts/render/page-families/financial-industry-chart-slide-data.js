const INDUSTRY_CHART_VARIANT_LABELS = {
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
