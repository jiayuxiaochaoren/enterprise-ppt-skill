const {
  GENERIC_INDUSTRIES
} = require('./proof-taxonomy-data');

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
  if (/loss-pareto/.test(normalizedProof)) value = value.replace(/\bdowntime\b/gi, '停机');
  return value
    .replace(/\s+排序/g, '排序')
    .replace(/排序\s*排序/g, '排序')
    .replace(/[：:]\s*排序/g, '：排序')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[｜|]\s*[｜|]/g, '｜')
    .trim();
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

module.exports = {
  displayCopyFromClaim,
  normalizeVisibleCopyText,
  normalizedIndustryKey,
  pushRouteAudit,
  rawSemanticText,
  resolveIndustryPack,
  structuralArchetype
};
