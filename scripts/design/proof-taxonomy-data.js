const NORMALIZED_RANKING_PROOFS = new Set([
  'loss-pareto',
  'issue-frequency-ranking',
  'review-sentiment-ranking'
]);

const NORMALIZED_ACTION_LOOP_PROOFS = new Set([
  'manufacturing-action-loop',
  'healthcare-quality-loop',
  'saas-governance-loop',
  'generic-action-loop'
]);

const NORMALIZED_PROOF_OBJECTS = new Set([
  ...NORMALIZED_RANKING_PROOFS,
  ...NORMALIZED_ACTION_LOOP_PROOFS
]);

const CHART_CORE_TITLE_BY_PROOF = {
  'loss-pareto': '停机损失排序',
  'issue-frequency-ranking': '高频问题排序',
  'review-sentiment-ranking': '反馈主题排序',
  'valuation-sensitivity': '估值敏感性',
  'quality-handoff': '质量交接',
  'patient-bottleneck': '服务瓶颈',
  'member-cohort-ladder': '会员分层',
  'channel-efficiency-matrix': '渠道效率',
  'monthly-pulse-trend': '月度趋势',
  'waterfall-bridge': '目标桥',
  'dispatch-map': '调度地图',
  'adoption-funnel': '采用漏斗',
  'evidence-readout': '行业读数'
};

const VISIBLE_COPY_JARGON_PATTERNS = [
  /\bdowntime-pareto\b/i,
  /\bresponsibility-loop\b/i,
  /\bpermission-governance\b/i,
  /\bproof object\b/i,
  /\bpage family\b/i,
  /\blayout variant\b/i,
  /\brender family\b/i,
  /\bDOWNTIME PARETO\b/i,
  /\bRESPONSIBILITY LOOP\b/i
];

const MANUFACTURING_INDUSTRIES = new Set(['manufacturing-operations', 'industrial-energy']);
const HEALTHCARE_INDUSTRIES = new Set(['healthcare-operations', 'healthcare-wellness']);
const SAAS_INDUSTRIES = new Set(['saas-technology', 'saas-ai-technology']);
const GENERIC_INDUSTRIES = new Set(['brand-retail', 'general-operations']);
const STICKY_CLOSING_VARIANTS = new Set(['simple-end', 'end', 'thank-you', 'thanks', 'company-thanks', 'contact-closing', 'image-statement', 'energy-stage']);
const THANK_YOU_VARIANT_TEXT_RE = /谢谢|感谢|联系|交流|观看|答疑|Q&A|thank|thanks/i;
const COMPANY_INTRO_PLAN_RE = /company-intro|公司介绍|能力介绍|企业介绍|企业简介|宣传册/i;

module.exports = {
  CHART_CORE_TITLE_BY_PROOF,
  COMPANY_INTRO_PLAN_RE,
  GENERIC_INDUSTRIES,
  HEALTHCARE_INDUSTRIES,
  MANUFACTURING_INDUSTRIES,
  NORMALIZED_ACTION_LOOP_PROOFS,
  NORMALIZED_PROOF_OBJECTS,
  NORMALIZED_RANKING_PROOFS,
  SAAS_INDUSTRIES,
  STICKY_CLOSING_VARIANTS,
  THANK_YOU_VARIANT_TEXT_RE,
  VISIBLE_COPY_JARGON_PATTERNS
};
