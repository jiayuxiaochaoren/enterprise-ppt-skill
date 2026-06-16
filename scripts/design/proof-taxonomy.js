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

function normalizedIndustryKey(industry = '') {
  return String(industry || '').trim().toLowerCase();
}

function pushRouteAudit(options = {}, field = '', reason = '') {
  const routeAudit = options && Array.isArray(options.routeAudit) ? options.routeAudit : null;
  if (!routeAudit || !field || !reason) return;
  routeAudit.push({ field, reason });
}

function displayCopyFromClaim(claim = {}) {
  const raw = claim.display_copy || claim.displayCopy || {};
  return {
    title: raw.title || '',
    subtitle: raw.subtitle || '',
    core_title: raw.core_title || raw.coreTitle || '',
    core_body: raw.core_body || raw.coreBody || '',
    kicker: raw.kicker || '',
    note: raw.note || ''
  };
}

function normalizeVisibleCopyText(text = '', options = {}) {
  const raw = String(text || '').trim();
  const normalizedProof = String(options.proof || '').toLowerCase();
  if (!raw) return '';
  const replacements = [
    [/\bdowntime-pareto\b/gi, '停机损失排序'],
    [/\bDOWNTIME PARETO\b/gi, '停机损失排序'],
    [/\bresponsibility-loop\b/gi, '动作闭环'],
    [/\bRESPONSIBILITY LOOP\b/gi, '动作闭环'],
    [/\bpermission-governance\b/gi, '流程治理'],
    [/\bproof object\b/gi, ''],
    [/\bpage family\b/gi, ''],
    [/\blayout variant\b/gi, ''],
    [/\brender family\b/gi, ''],
    [/\bPareto\b/gi, '排序'],
    [/帕累托图/gi, '排序'],
    [/呈现\s*帕累托/gi, '排序'],
    [/帕累托/gi, '排序']
  ];
  let value = replacements.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), raw);
  if (/loss-pareto/.test(normalizedProof)) {
    value = value.replace(/\bdowntime\b/gi, '停机');
  }
  value = value
    .replace(/\s+排序/g, '排序')
    .replace(/排序\s*排序/g, '排序')
    .replace(/[：:]\s*排序/g, '：排序')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[｜|]\s*[｜|]/g, '｜')
    .trim();
  return value;
}

function rawSemanticText(options = {}) {
  return [
    options.text,
    options.proofIntent,
    options.industry,
    options.displayCopy && options.displayCopy.title,
    options.displayCopy && options.displayCopy.subtitle,
    options.displayCopy && options.displayCopy.core_title,
    options.displayCopy && options.displayCopy.core_body,
    options.slide && options.slide.title,
    options.slide && options.slide.subtitle,
    options.slide && options.slide.claim,
    options.slide && options.slide.note
  ].filter(Boolean).join(' ');
}

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
  if (manufacturingWeakSignal) {
    pushRouteAudit(options, 'proofObject', 'action-loop downgraded to generic-action-loop because only weak delivery/acceptance signals were present');
  } else {
    pushRouteAudit(options, 'proofObject', 'action-loop fell back to generic-action-loop');
  }
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

function resolveIndustryPack(options = {}) {
  const industryPackFor = typeof options.industryPackFor === 'function' ? options.industryPackFor : null;
  if (!industryPackFor) return null;
  const plan = options.plan || {};
  const industry = normalizedIndustryKey(options.industry || plan.industry || '');
  if (!industry || GENERIC_INDUSTRIES.has(industry)) return null;
  return industryPackFor(plan) || null;
}

function structuralArchetype(options = {}, role = 'cover') {
  const slide = options.slide || {};
  const plan = options.plan || {};
  const pack = resolveIndustryPack(options) || {};
  const camel = `${role}Archetype`;
  const snake = `${role}_archetype`;
  return String(
    slide[camel] ||
    slide[snake] ||
    plan[camel] ||
    plan[snake] ||
    pack[camel] ||
    ''
  ).trim().toLowerCase();
}

function normalizeLayoutVariant(value = '', options = {}) {
  const raw = String(value || '').trim();
  const key = String(value || '').trim().toLowerCase();
  if (!key) return '';
  if (
    key === 'downtime-pareto' ||
    key === 'responsibility-loop' ||
    key === 'permission-governance' ||
    NORMALIZED_PROOF_OBJECTS.has(key)
  ) {
    return normalizeProofObject(key, options);
  }
  const slide = options.slide || {};
  const plan = options.plan || {};
  const industry = normalizedIndustryKey(options.industry || plan.industry || '');
  const slideType = String(slide.type || options.type || '').toLowerCase();
  if (slideType === 'cover' || slideType === 'cover-dark') {
    const coverArchetype = structuralArchetype(options, 'cover');
    let normalizedCoverVariant = '';
    switch (coverArchetype) {
      case 'native-industrial-structure-cover':
        normalizedCoverVariant = '';
        break;
      case 'boardroom-proof-cover':
        normalizedCoverVariant = 'editorial-cover';
        break;
      case 'platform-system-cover':
        normalizedCoverVariant = 'airy-concept-opening';
        break;
      case 'editorial-brand-cover':
        normalizedCoverVariant = 'beauty-brand-editorial-cover';
        break;
      case 'clinical-quality-cover':
        normalizedCoverVariant = 'editorial-cover';
        break;
      case 'lifestyle-editorial-cover':
        normalizedCoverVariant = 'airy-concept-opening';
        break;
      case 'civic-executive-cover':
        normalizedCoverVariant = 'editorial-cover';
        break;
      case 'culture-soft-cover':
        normalizedCoverVariant = 'culture-cover-with-soft-geometry';
        break;
      default:
        break;
    }
    if (normalizedCoverVariant !== '' || coverArchetype === 'native-industrial-structure-cover') {
      if (normalizedCoverVariant !== key) {
        pushRouteAudit(
          options,
          'layoutVariant',
          `cover layout variant normalized to ${normalizedCoverVariant || '[empty]'} from ${coverArchetype}`
        );
        return normalizedCoverVariant;
      }
    }
  }
  if (slideType === 'chapter-divider' || slideType === 'toc' || slideType === 'toc-clean') {
    if (industry === 'energy-utility') {
      if (key !== 'energy-sequence') {
        pushRouteAudit(options, 'layoutVariant', 'divider layout variant normalized to energy-sequence from energy utility precedence');
        return 'energy-sequence';
      }
      return raw;
    }
    const dividerArchetype = structuralArchetype(options, 'divider');
    let normalizedDividerVariant = '';
    switch (dividerArchetype) {
      case 'board-briefing-divider':
        normalizedDividerVariant = 'agenda-board';
        break;
      case 'governance-briefing-divider':
        normalizedDividerVariant = 'board-briefing';
        break;
      case 'industrial-structure-divider':
        normalizedDividerVariant = 'line-agenda';
        break;
      case 'adoption-briefing-divider':
        normalizedDividerVariant = 'adoption-agenda';
        break;
      case 'editorial-agenda-divider':
        normalizedDividerVariant = 'editorial-agenda';
        break;
      case 'pathway-map-divider':
      case 'experience-journey-divider':
        normalizedDividerVariant = 'pathway-map';
        break;
      case 'culture-sequence-divider':
        normalizedDividerVariant = 'chapter-hero';
        break;
      default:
        break;
    }
    if (normalizedDividerVariant && normalizedDividerVariant !== key) {
      pushRouteAudit(
        options,
        'layoutVariant',
        `divider layout variant normalized to ${normalizedDividerVariant} from ${dividerArchetype}`
      );
      return normalizedDividerVariant;
    }
  }
  if (slideType === 'closing' || slideType === 'closing-dark') {
    if (STICKY_CLOSING_VARIANTS.has(key)) return raw;
    if (industry === 'energy-utility') {
      if (key !== 'energy-stage') {
        pushRouteAudit(options, 'layoutVariant', 'closing layout variant normalized to energy-stage from energy utility precedence');
        return 'energy-stage';
      }
      return raw;
    }
    const closingArchetype = structuralArchetype(options, 'closing');
    if (closingArchetype) {
      const planContextText = [
        rawSemanticText(options),
        plan.title,
        plan.subtitle,
        plan.documentType,
        plan.document_type,
        plan.pptType,
        plan.ppt_type,
        plan.materialIntelligence && plan.materialIntelligence.pptType
      ].filter(Boolean).join(' ');
      const isCompanyIntro = COMPANY_INTRO_PLAN_RE.test(planContextText);
      const isThankYou = THANK_YOU_VARIANT_TEXT_RE.test(planContextText);
      let normalizedClosingVariant = '';
      switch (closingArchetype) {
        case 'decision-rollout-close':
          normalizedClosingVariant = (isCompanyIntro && isThankYou) ? 'company-thanks' : 'pilot-rollout';
          break;
        case 'investment-decision-close':
          normalizedClosingVariant = 'investment-decision';
          break;
        case 'quality-handoff-close':
          normalizedClosingVariant = 'quality-handoff';
          break;
        case 'adoption-rollout-close':
          normalizedClosingVariant = 'adoption-close';
          break;
        case 'premium-editorial-close':
          normalizedClosingVariant = 'premium-closing-anchor';
          break;
        case 'experience-rollout-close':
          normalizedClosingVariant = 'experience-rollout';
          break;
        case 'governance-next-step-close':
          normalizedClosingVariant = 'governance-next-step';
          break;
        case 'contact-closing-close':
          normalizedClosingVariant = isCompanyIntro ? 'company-thanks' : 'contact-closing';
          break;
        default:
          break;
      }
      if (normalizedClosingVariant && normalizedClosingVariant !== key) {
        pushRouteAudit(
          options,
          'layoutVariant',
          `closing layout variant normalized to ${normalizedClosingVariant} from ${closingArchetype}`
        );
        return normalizedClosingVariant;
      }
    }
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
  const normalized = normalizeProofObject(proof);
  return CHART_CORE_TITLE_BY_PROOF[normalized] || '行业读数';
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
  CHART_CORE_TITLE_BY_PROOF,
  GENERIC_INDUSTRIES,
  NORMALIZED_ACTION_LOOP_PROOFS,
  NORMALIZED_PROOF_OBJECTS,
  NORMALIZED_RANKING_PROOFS,
  VISIBLE_COPY_JARGON_PATTERNS,
  chartCoreTitleForProof,
  chartFieldForNormalizedProof,
  displayCopyFromClaim,
  isActionLoopProof,
  normalizeActionLoopProof,
  normalizeLayoutVariant,
  normalizeProofObject,
  normalizeRankingProof,
  normalizeVisibleCopyText,
  renderFamilyForProof
};
