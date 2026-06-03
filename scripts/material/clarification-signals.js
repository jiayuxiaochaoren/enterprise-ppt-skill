const {
  compactUnique,
  hasAny,
  textBlob
} = require('./common');

function sourceInventoryValues(sourceAudit = {}, field) {
  return (sourceAudit.source_inventory || [])
    .flatMap(src => Array.isArray(src && src[field]) ? src[field] : [])
    .filter(Boolean);
}

function modelClarificationCandidates(storyPlan = {}) {
  const raw = storyPlan.clarification_candidates || storyPlan.clarificationCandidates || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => ({
    id: item.id || `model_candidate_${String(i + 1).padStart(2, '0')}`,
    priority: item.priority || 'recommended',
    category: item.category || 'story-architecture',
    question: item.question || item.missing_input || item.missingInput || `请补充：${item.title || item.label || `信息 ${i + 1}`}`,
    why: item.why || item.reason || textBlob(item.affects) || '',
    affects: Array.isArray(item.affects) ? item.affects : compactUnique([item.section, item.slide, item.proof_object]),
    options: item.options,
    fallbackChoice: item.fallback_strategy || item.fallbackChoice || 'conservative',
    source: 'story-architecture'
  }));
}

function looksExternalUse(storyPlan = {}, sourceAudit = {}, bundle = {}) {
  const text = textBlob({
    pptType: storyPlan.ppt_type,
    audience: storyPlan.audience,
    decisionGoal: storyPlan.decision_goal,
    risks: storyPlan.external_delivery_risks,
    auditRisks: sourceAudit.global_risks,
    sourceText: (bundle.sources || []).map(s => s.text || s.name || '').join('\n')
  });
  return hasAny(text, [/对外|外发|客户|销售|投标|招商|展会|官网|宣传|公司介绍|企业介绍|能力介绍|采购|合作/i]);
}

function hasActualContact(bundle = {}, storyPlan = {}) {
  const text = textBlob({
    contacts: storyPlan.contacts,
    sourceText: (bundle.sources || []).map(s => s.text || '').join('\n')
  });
  return hasAny(text, [
    /[\w.+-]+@[\w.-]+\.\w+/i,
    /(?:电话|手机|Tel|Phone)[:：]?\s*[+\d][\d\s-]{5,}/i,
    /(?:https?:\/\/|www\.)[^\s，。；]+/i,
    /(?:官网|地址|联系人)[:：]\s*[^，。；\n]{3,}/i
  ]);
}

module.exports = {
  hasActualContact,
  looksExternalUse,
  modelClarificationCandidates,
  sourceInventoryValues
};
