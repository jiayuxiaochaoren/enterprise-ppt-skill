const {
  CHART_CORE_TITLE_BY_PROOF,
  HEALTHCARE_INDUSTRIES,
  MANUFACTURING_INDUSTRIES,
  NORMALIZED_ACTION_LOOP_PROOFS,
  NORMALIZED_PROOF_OBJECTS,
  NORMALIZED_RANKING_PROOFS,
  SAAS_INDUSTRIES
} = require('./proof-taxonomy-data');
const {
  normalizedIndustryKey,
  pushRouteAudit,
  rawSemanticText
} = require('./proof-taxonomy-common');

function normalizeRankingProof(rawProof = '', options = {}) {
  const key = String(rawProof || '').toLowerCase();
  if (NORMALIZED_RANKING_PROOFS.has(key)) return key;
  const slide = options.slide || {};
  const text = rawSemanticText(options);
  const reviewSignal = slide.reviewSentiment ||
    /\breview\b|评论|评价|口碑|舆情|情绪|主题|sentiment|voice of customer/i.test(text);
  const customerSignal = /\bclient\b|\bcustomer\b|客户|调研|顾虑|痛点|反馈|认证|交付周期|售后|诉求|体验|频次|排行/i.test(text);
  const operationalSignal = slide.oeeLosses ||
    /\bOEE\b|停机|故障|稼动|节拍|MTTR|MTBF|维修|备件|设备损失|downtime|equipment loss|failure/i.test(text);
  if (reviewSignal) {
    pushRouteAudit(options, 'proofObject', 'ranking proof normalized to review-sentiment-ranking from review/commentary signals');
    return 'review-sentiment-ranking';
  }
  if (customerSignal && !operationalSignal) {
    pushRouteAudit(options, 'proofObject', 'ranking proof normalized to issue-frequency-ranking from customer/issue signals');
    return 'issue-frequency-ranking';
  }
  if (normalizedIndustryKey(options.industry) === 'manufacturing-operations' && customerSignal) {
    pushRouteAudit(options, 'proofObject', 'manufacturing issue-ranking preferred for customer-voice evidence');
    return 'issue-frequency-ranking';
  }
  if (normalizedIndustryKey(options.industry) === 'energy-utility' && customerSignal && !/\bOEE\b|停机|故障|维修/i.test(text)) {
    pushRouteAudit(options, 'proofObject', 'energy issue-ranking preferred for experience/problem evidence');
    return 'issue-frequency-ranking';
  }
  if (operationalSignal) {
    pushRouteAudit(options, 'proofObject', 'ranking proof normalized to loss-pareto from operational-loss signals');
    return 'loss-pareto';
  }
  if (customerSignal) {
    pushRouteAudit(options, 'proofObject', 'ranking proof normalized to issue-frequency-ranking from customer/issue fallback');
    return 'issue-frequency-ranking';
  }
  if (key === 'downtime-pareto') {
    pushRouteAudit(options, 'proofObject', 'legacy downtime-pareto normalized to loss-pareto by compatibility rule');
    return 'loss-pareto';
  }
  return key || '';
}

function normalizeActionLoopProof(rawProof = '', options = {}) {
  const key = String(rawProof || '').toLowerCase();
  if (NORMALIZED_ACTION_LOOP_PROOFS.has(key)) return key;
  const text = rawSemanticText(options);
  const industry = normalizedIndustryKey(options.industry);
  const proofIntent = String(options.proofIntent || '').toLowerCase();
  const displayCopy = options.displayCopy || {};
  const displayText = [
    displayCopy.title,
    displayCopy.subtitle,
    displayCopy.core_title,
    displayCopy.core_body,
    options.slide && options.slide.coreTitle,
    options.slide && options.slide.coreBody
  ].filter(Boolean).join(' ');
  const sourceText = [displayText, text].filter(Boolean).join(' ');
  const manufacturingStrongSignal = /\bOEE\b|产线|工站|工艺|设备|治具|维保|维修|点检|改造包|PLC|传感器|班组|良率|MTTR|MTBF/i.test(sourceText);
  const manufacturingWeakSignal = /交付|验收|认证|项目复盘|经营动作|制造交付|复盘机制/i.test(sourceText);
  const healthcareSignal = /患者|护理|病区|质控|院感|医嘱|随访|服务质量|临床|medical|clinical|handoff/i.test(sourceText);
  const saasSignal = /\bSSO\b|权限|审计|管理员|数据边界|审批流|admin|permission|audit|governance/i.test(sourceText);
  if (key === 'permission-governance') {
    pushRouteAudit(options, 'proofObject', 'legacy permission-governance normalized to saas-governance-loop by compatibility rule');
    return 'saas-governance-loop';
  }
  if (SAAS_INDUSTRIES.has(industry) || /permission|audit|governance/.test(proofIntent) || saasSignal) {
    pushRouteAudit(options, 'proofObject', 'action-loop normalized to saas-governance-loop from industry/proof intent/security signals');
    return 'saas-governance-loop';
  }
  if (HEALTHCARE_INDUSTRIES.has(industry) || /quality|handoff|clinical|patient/.test(proofIntent) || healthcareSignal) {
    pushRouteAudit(options, 'proofObject', 'action-loop normalized to healthcare-quality-loop from industry/proof intent/clinical signals');
    return 'healthcare-quality-loop';
  }
  if (MANUFACTURING_INDUSTRIES.has(industry)) {
    pushRouteAudit(options, 'proofObject', 'action-loop normalized to manufacturing-action-loop from identified manufacturing industry');
    return 'manufacturing-action-loop';
  }
  if (/manufacturing|factory|industrial|delivery|acceptance|retrofit|line-ops/.test(proofIntent) && (manufacturingStrongSignal || manufacturingWeakSignal)) {
    pushRouteAudit(options, 'proofObject', 'action-loop normalized to manufacturing-action-loop from manufacturing proof intent plus evidence signals');
    return 'manufacturing-action-loop';
  }
  if (manufacturingStrongSignal) {
    pushRouteAudit(options, 'proofObject', 'action-loop normalized to manufacturing-action-loop from strong manufacturing object signals');
    return 'manufacturing-action-loop';
  }
  pushRouteAudit(
    options,
    'proofObject',
    manufacturingWeakSignal
      ? 'action-loop downgraded to generic-action-loop because only weak delivery/acceptance signals were present'
      : 'action-loop fell back to generic-action-loop'
  );
  return 'generic-action-loop';
}

function normalizeProofObject(value = '', options = {}) {
  const raw = String(value || '').trim();
  const key = raw.toLowerCase();
  if (!key) return '';
  if (NORMALIZED_PROOF_OBJECTS.has(key)) return key;
  if (key === 'permission-governance') {
    pushRouteAudit(options, 'proofObject', 'legacy permission-governance normalized to saas-governance-loop');
    return 'saas-governance-loop';
  }
  if (key === 'responsibility-loop' || /responsibility-loop|permission-governance/.test(key)) {
    return normalizeActionLoopProof(key, options);
  }
  if (
    key === 'downtime-pareto' ||
    key === 'losspareto' ||
    key === 'loss-pareto' ||
    key === 'review-sentiment' ||
    key === 'review-sentiment-ranking' ||
    key === 'issue-frequency-ranking' ||
    /pareto|loss-pareto|review-sentiment|issue-frequency/.test(key)
  ) {
    return normalizeRankingProof(key, options);
  }
  return raw;
}

function chartFieldForNormalizedProof(proof = '') {
  const normalized = normalizeProofObject(proof);
  if (NORMALIZED_RANKING_PROOFS.has(normalized)) return 'downtimePareto';
  if (normalized.includes('valuation') || normalized.includes('sensitivity')) return 'valuationSensitivity';
  if (normalized.includes('quality') || normalized.includes('handoff')) return 'qualityHandoff';
  if (normalized.includes('member') || normalized.includes('cohort') || normalized.includes('rfm')) return 'memberCohorts';
  if (normalized.includes('channel') || normalized.includes('media') || normalized.includes('efficiency') || normalized.includes('scatter') || normalized.includes('bubble') || normalized.includes('roas') || normalized.includes('roi')) return 'channelEfficiency';
  if (normalized.includes('monthly') || normalized.includes('pulse') || normalized.includes('trend')) return 'monthlyPulse';
  if (normalized.includes('waterfall') || normalized.includes('target-bridge') || normalized.includes('target bridge')) return 'waterfallBridge';
  if (normalized.includes('dispatch') || normalized.includes('site')) return 'dispatchMap';
  if (normalized.includes('adoption') || normalized.includes('funnel') || normalized.includes('activation')) return 'adoptionFunnel';
  return '';
}

function chartCoreTitleForProof(proof = '') {
  return CHART_CORE_TITLE_BY_PROOF[normalizeProofObject(proof)] || '行业读数';
}

function isActionLoopProof(proof = '') {
  return NORMALIZED_ACTION_LOOP_PROOFS.has(normalizeProofObject(proof));
}

function renderFamilyForProof(proof = '') {
  const normalized = normalizeProofObject(proof);
  if (NORMALIZED_RANKING_PROOFS.has(normalized)) return `industry-chart:${normalized}`;
  if (NORMALIZED_ACTION_LOOP_PROOFS.has(normalized)) return `risk-table:${normalized}`;
  return '';
}

module.exports = {
  chartCoreTitleForProof,
  chartFieldForNormalizedProof,
  isActionLoopProof,
  normalizeActionLoopProof,
  normalizeProofObject,
  normalizeRankingProof,
  renderFamilyForProof
};
