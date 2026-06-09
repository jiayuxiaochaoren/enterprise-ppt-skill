const INDUSTRY_CHAIN_VERSION = 'industry-evidence-chain/v1';
const {
  TEXT_METADATA_OMIT_KEYS
} = require('./text-utils');

const CHAIN_TEXT_OMIT_KEYS = new Set(TEXT_METADATA_OMIT_KEYS);

function compactUnique(values = []) {
  return [...new Set((values || []).filter(value => value != null && String(value).trim() !== '').map(value => String(value)))];
}

function normalizeKey(value = '') {
  return String(value || '').trim().toLowerCase();
}

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(' ');
  if (typeof value === 'object') {
    return Object.keys(value)
      .filter(key => !CHAIN_TEXT_OMIT_KEYS.has(key))
      .map(key => flattenText(value[key]))
      .join(' ');
  }
  return '';
}

const COMMON_SOURCE_FIELDS = ['sourceNote', 'source_note', 'proof.sourceNote', 'proof.source'];
const COMMON_CAPTION_FIELDS = ['caption', 'subtitle', 'claim', 'proof.explanation', 'visual.caption'];
const {
  hasSourceEvidence,
  visibleSourceNotesEnabled
} = require('./source-evidence');
const {
  activateCoveragePolicyConditions,
  coveragePolicyShapeIssues,
  coverageRoleForComponent,
  coverageStatusForComponents,
  filterStageCoveragePolicy,
  normalizeStageCoveragePolicy
} = require('./industry-evidence-coverage');
const {
  hasFieldPath
} = require('./component-evidence-contracts');

const INDUSTRY_EVIDENCE_CHAINS = require('./industry-evidence-chain-definitions');

const INDUSTRY_ALIAS_TO_CHAIN = Object.entries(INDUSTRY_EVIDENCE_CHAINS).reduce((out, [id, chain]) => {
  out[id] = id;
  (chain.industryIds || []).forEach(industryId => { out[normalizeKey(industryId)] = id; });
  return out;
}, {});

function routeTextForSlide(slide = {}) {
  const proofObject = proofObjectIdForSlide(slide);
  return normalizeKey([
    slide.type,
    slide.layoutVariant,
    slide.variant,
    proofObject,
    slide.proof && slide.proof.id
  ].filter(Boolean).join(':'));
}

function proofObjectIdForSlide(slide = {}) {
  return String((slide.proof && slide.proof.id) || slide.proofObject || slide.proof_object || '').trim();
}

function normalizeIndustryEvidenceChainId(industry = '', slide = {}) {
  const raw = normalizeKey(industry);
  if (!raw) return 'neutral-general';
  if (raw === 'industrial-energy') {
    const text = normalizeKey(flattenText(slide));
    if (/储能|电站|调度|soc|pcs|bms|负荷|dispatch|energy|utility/.test(text)) return 'energy-infrastructure';
    return 'industrial-manufacturing';
  }
  return INDUSTRY_ALIAS_TO_CHAIN[raw] || 'neutral-general';
}

function industryEvidenceChainFor(industryOrPlan = {}, slide = {}) {
  const industry = typeof industryOrPlan === 'string' ? industryOrPlan : industryOrPlan.industry;
  const id = normalizeIndustryEvidenceChainId(industry, slide);
  return INDUSTRY_EVIDENCE_CHAINS[id] || null;
}

function scoreStage(stage = {}, slide = {}) {
  const proofObject = normalizeKey(proofObjectIdForSlide(slide));
  const route = routeTextForSlide(slide);
  const text = normalizeKey(flattenText({
    type: slide.type,
    layoutVariant: slide.layoutVariant || slide.variant,
    proofObject,
    title: slide.title,
    subtitle: slide.subtitle,
    claim: slide.claim,
    note: slide.note,
    visual: slide.visual,
    cards: slide.cards,
    items: slide.items,
    products: slide.products,
    productStory: slide.productStory,
    metrics: slide.metrics,
    rows: slide.rows,
    risks: slide.risks
  }));
  const matchedProofObjects = (stage.proofObjects || []).filter(item => proofObject && proofObject === normalizeKey(item));
  const matchedRoutes = (stage.routes || []).filter(item => route.includes(normalizeKey(item)));
  const matchedFields = (stage.fields || []).filter(field => hasFieldPath(slide, field));
  const matchedKeywords = (stage.keywords || []).filter(keyword => text.includes(normalizeKey(keyword)));
  const score = (matchedProofObjects.length * 8) +
    (matchedRoutes.length * 4) +
    (matchedFields.length * 5) +
    Math.min(matchedKeywords.length, 2);
  return {
    score,
    matchedProofObjects,
    matchedRoutes,
    matchedFields,
    matchedKeywords
  };
}

function confidenceForScore(score = 0) {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  if (score >= 2) return 'low';
  return 'neutral';
}

function neutralEvidenceChain(reason = 'industry evidence chain was not inferred') {
  return {
    version: INDUSTRY_CHAIN_VERSION,
    industry: 'neutral-general',
    chainId: 'neutral-general',
    chainLabel: '通用/中性',
    stage: 'neutral',
    stageId: 'neutral-general',
    stageLabel: 'neutral/general',
    position: 0,
    confidence: 'neutral',
    components: [],
    coveragePolicy: normalizeStageCoveragePolicy({ components: [] }),
    avoidComponents: [],
    matchedFields: [],
    matchedKeywords: [],
    matchedProofObjects: [],
    matchedRoutes: [],
    evidenceReasons: [reason],
    requiresCaption: false,
    requiresSource: false
  };
}

function normalizeIndustryEvidenceChainShape(chain = null) {
  if (!chain || typeof chain !== 'object' || Array.isArray(chain)) return null;
  const coveragePolicy = normalizeStageCoveragePolicy({
    coveragePolicy: chain.coveragePolicy || chain.coverage_policy,
    components: chain.components
  });
  return Object.assign({}, chain, {
    version: chain.version || INDUSTRY_CHAIN_VERSION,
    chainId: String(chain.chainId || '').trim(),
    chainLabel: chain.chainLabel || '',
    stageId: String(chain.stageId || '').trim(),
    stageLabel: chain.stageLabel || '',
    components: compactUnique(Array.isArray(chain.components) ? chain.components : coveragePolicy.components),
    coveragePolicy,
    avoidComponents: compactUnique(Array.isArray(chain.avoidComponents) ? chain.avoidComponents : []),
    matchedFields: compactUnique(Array.isArray(chain.matchedFields) ? chain.matchedFields : []),
    matchedKeywords: compactUnique(Array.isArray(chain.matchedKeywords) ? chain.matchedKeywords : []),
    matchedProofObjects: compactUnique(Array.isArray(chain.matchedProofObjects) ? chain.matchedProofObjects : []),
    matchedRoutes: compactUnique(Array.isArray(chain.matchedRoutes) ? chain.matchedRoutes : []),
    evidenceReasons: compactUnique(Array.isArray(chain.evidenceReasons) ? chain.evidenceReasons : [])
  });
}

function industryEvidenceChainShapeIssues(chain = null) {
  const issues = [];
  if (!chain || typeof chain !== 'object' || Array.isArray(chain)) {
    return ['industryEvidenceChain must be an object'];
  }
  if (!String(chain.chainId || '').trim()) issues.push('missing chainId');
  if (!String(chain.stageId || '').trim()) issues.push('missing stageId');
  ['components', 'matchedFields', 'matchedProofObjects'].forEach(field => {
    if (!Array.isArray(chain[field])) issues.push(`${field} must be an array`);
  });
  const coveragePolicy = chain.coveragePolicy != null ? chain.coveragePolicy : chain.coverage_policy;
  if (coveragePolicy != null && (typeof coveragePolicy !== 'object' || Array.isArray(coveragePolicy))) {
    issues.push('coveragePolicy must be an object when present');
  } else if (coveragePolicy) {
    issues.push(...coveragePolicyShapeIssues(coveragePolicy));
  }
  ['matchedKeywords', 'matchedRoutes', 'evidenceReasons'].forEach(field => {
    if (chain[field] != null && !Array.isArray(chain[field])) issues.push(`${field} must be an array when present`);
  });
  return issues;
}

function chainsShareIdentity(a = null, b = null) {
  return Boolean(a && b && a.chainId && b.chainId && a.stageId && b.stageId &&
    a.chainId === b.chainId &&
    a.stageId === b.stageId);
}

function inferIndustryEvidenceChain(plan = {}, slide = {}, opts = {}) {
  const chain = industryEvidenceChainFor(plan, slide);
  if (!chain) return neutralEvidenceChain('missing or unsupported industry; defaulted to neutral/general');
  const type = normalizeKey(slide.type);
  const explicitProofRoute = Boolean(slide.proofObject || slide.proof_object || slide.layoutVariant || slide.layout_variant);
  if (['cover', 'cover-dark', 'closing'].includes(type) && (!explicitProofRoute || slide.proofObjectInferred)) {
    return neutralEvidenceChain(`${type} slide has no explicit proof route; skipped industry evidence-chain inference`);
  }
  const scored = chain.stages.map(stage => Object.assign({ stage }, scoreStage(stage, slide)))
    .sort((a, b) => b.score - a.score || a.stage.position - b.stage.position);
  const best = scored[0] || {};
  if (!best.stage || best.score < 3) {
    return neutralEvidenceChain(`${chain.label} chain has insufficient route/proof/field evidence`);
  }
  const stage = best.stage;
  const rawCoveragePolicy = normalizeStageCoveragePolicy(stage);
  const visibleSources = visibleSourceNotesEnabled(plan, opts);
  const activeCoveragePolicy = activateCoveragePolicyConditions(rawCoveragePolicy, { visibleSources });
  const coveragePolicy = filterStageCoveragePolicy(activeCoveragePolicy, id => id !== 'source-note' || visibleSources);
  const rawComponents = rawCoveragePolicy.components;
  const components = coveragePolicy.components;
  const sourceEvidence = hasSourceEvidence(slide);
  const evidenceReasons = compactUnique([
    ...best.matchedProofObjects.map(value => `proofObject:${value}`),
    ...best.matchedRoutes.map(value => `route:${value}`),
    ...best.matchedFields.map(value => `field:${value}`),
    ...best.matchedKeywords.slice(0, 4).map(value => `keyword:${value}`)
  ]);
  return {
    version: INDUSTRY_CHAIN_VERSION,
    industry: normalizeKey(plan.industry),
    chainId: chain.id,
    chainLabel: chain.label,
    stage: stage.position === 1 ? 'claim' : (stage.position === 2 ? 'promise' : 'evidence'),
    stageId: stage.id,
    stageLabel: stage.label,
    position: stage.position,
    confidence: confidenceForScore(best.score),
    score: best.score,
    components,
    coveragePolicy,
    avoidComponents: compactUnique(chain.avoidComponents || []),
    matchedFields: best.matchedFields,
    matchedKeywords: best.matchedKeywords,
    matchedProofObjects: best.matchedProofObjects,
    matchedRoutes: best.matchedRoutes,
    evidenceReasons,
    structuredEvidenceBound: Boolean(best.matchedFields.length || best.matchedProofObjects.length),
    inferenceBasis: best.matchedProofObjects.length ? 'proofObject' : (best.matchedFields.length ? 'field' : (best.matchedRoutes.length ? 'route' : 'keyword')),
    requiresCaption: components.includes('caption-bar') || components.includes('proof-gallery') || components.includes('hero-image'),
    requiresSource: sourceEvidence || rawComponents.includes('source-note'),
    hasCaptionEvidence: COMMON_CAPTION_FIELDS.some(field => hasFieldPath(slide, field)),
    hasSourceEvidence: sourceEvidence,
    visibleSourceNotes: visibleSources,
    sourceNoteComponentSuppressed: rawComponents.includes('source-note') && !visibleSources,
    visualGrammar: opts.visualGrammar || null
  };
}

function canonicalIndustryEvidenceChainForSlide(plan = {}, slide = {}, opts = {}) {
  return normalizeIndustryEvidenceChainShape(inferIndustryEvidenceChain(plan, slide, opts));
}

function componentsForIndustryEvidenceChain(chainResult = {}) {
  if (!chainResult || chainResult.stageId === 'neutral-general') return [];
  return compactUnique(chainResult.components || []);
}

module.exports = {
  INDUSTRY_CHAIN_VERSION,
  INDUSTRY_EVIDENCE_CHAINS,
  COMMON_CAPTION_FIELDS,
  COMMON_SOURCE_FIELDS,
  CHAIN_TEXT_OMIT_KEYS,
  activateCoveragePolicyConditions,
  canonicalIndustryEvidenceChainForSlide,
  chainsShareIdentity,
  componentsForIndustryEvidenceChain,
  coverageRoleForComponent,
  coverageStatusForComponents,
  filterStageCoveragePolicy,
  industryEvidenceChainFor,
  industryEvidenceChainShapeIssues,
  inferIndustryEvidenceChain,
  normalizeIndustryEvidenceChainShape,
  normalizeIndustryEvidenceChainId,
  normalizeStageCoveragePolicy,
  neutralEvidenceChain
};
