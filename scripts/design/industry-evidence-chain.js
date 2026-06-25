const INDUSTRY_CHAIN_VERSION = 'industry-evidence-chain/v1';
const {
  CHAIN_TEXT_OMIT_KEYS,
  compactUnique,
  flattenText,
  genericCardJudgmentWithoutEvidence,
  normalizeKey,
  proofObjectIdForSlide,
  routeTextForSlide
} = require('./industry-evidence-chain-text');

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
const {
  createRiskGovernanceFallbackHelpers
} = require('./industry-evidence-chain-risk-governance');
const {
  createIndustryEvidenceChainShapeHelpers
} = require('./industry-evidence-chain-shape');

const INDUSTRY_EVIDENCE_CHAINS = require('./industry-evidence-chain-definitions');

const INDUSTRY_ALIAS_TO_CHAIN = Object.entries(INDUSTRY_EVIDENCE_CHAINS).reduce((out, [id, chain]) => {
  out[id] = id;
  (chain.industryIds || []).forEach(industryId => { out[normalizeKey(industryId)] = id; });
  return out;
}, {});

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
    businessDomain: slide.businessDomain || slide.business_domain,
    chainStage: slide.chainStage || slide.chain_stage,
    depthDomain: slide.depthDomain || slide.depth_domain,
    proofIntent: slide.proofIntent || slide.proof_intent,
    industryObjects: slide.industryObjects || slide.industry_objects,
    title: slide.title,
    subtitle: slide.subtitle,
    claim: slide.claim,
    note: slide.note,
    visual: slide.visual,
    cards: slide.cards,
    items: slide.items,
    products: slide.products,
    productStory: slide.productStory,
    productItems: slide.productItems || slide.product_items,
    skuMatrix: slide.skuMatrix || slide.sku_matrix,
    editorialProof: slide.editorialProof || slide.editorial_proof,
    informationGap: slide.informationGap || slide.information_gap,
    reviews: slide.reviews,
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

function stageVariantForMatch(stage = {}, best = {}, slide = {}) {
  const variants = stage.variantsByProofObject || stage.variants_by_proof_object || {};
  if (!variants || typeof variants !== 'object' || Array.isArray(variants)) return stage;
  const proofObject = normalizeKey(proofObjectIdForSlide(slide));
  const keys = compactUnique([proofObject, ...(best.matchedProofObjects || [])].map(normalizeKey).filter(Boolean));
  const variant = keys.map(key => variants[key]).find(value => value && typeof value === 'object' && !Array.isArray(value));
  if (!variant) return stage;
  return Object.assign({}, stage, variant, {
    position: variant.position || stage.position,
    variantsByProofObject: stage.variantsByProofObject,
    variants_by_proof_object: stage.variants_by_proof_object
  });
}

function confidenceForScore(score = 0) {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  if (score >= 2) return 'low';
  return 'neutral';
}

const {
  isNativeRiskGovernanceSlide,
  nativeRiskGovernanceChain,
  nativeRiskGovernanceFields,
  nativeRiskRouteOutranksMetricOnlyStage
} = createRiskGovernanceFallbackHelpers({
  compactUnique,
  commonCaptionFields: COMMON_CAPTION_FIELDS,
  hasFieldPath,
  hasSourceEvidence,
  normalizeKey,
  normalizeStageCoveragePolicy,
  proofObjectIdForSlide,
  version: INDUSTRY_CHAIN_VERSION
});

const {
  chainsShareIdentity,
  industryEvidenceChainShapeIssues,
  nativeProcessOrTimelineSlide,
  neutralEvidenceChain,
  normalizeIndustryEvidenceChainShape
} = createIndustryEvidenceChainShapeHelpers({
  compactUnique,
  coveragePolicyShapeIssues,
  hasFieldPath,
  normalizeKey,
  normalizeStageCoveragePolicy,
  proofObjectIdForSlide,
  version: INDUSTRY_CHAIN_VERSION
});

function inferIndustryEvidenceChain(plan = {}, slide = {}, opts = {}) {
  const chain = industryEvidenceChainFor(plan, slide);
  if (!chain) return neutralEvidenceChain('missing or unsupported industry; defaulted to neutral/general');
  const type = normalizeKey(slide.type);
  const chainMode = normalizeKey(slide.industryEvidenceChainMode || slide.industry_evidence_chain_mode || slide.industryEvidenceMode || slide.industry_evidence_mode);
  if (slide.disableIndustryEvidenceChain === true || slide.disable_industry_evidence_chain === true || ['neutral', 'none', 'off', 'native-only', 'native'].includes(chainMode)) {
    return neutralEvidenceChain(`${type || 'slide'} requested native-only industry evidence-chain mode`);
  }
  const explicitProofRoute = Boolean(slide.proofObject || slide.proof_object || slide.layoutVariant || slide.layout_variant);
  if (['toc', 'toc-clean', 'chapter-divider'].includes(type)) {
    return neutralEvidenceChain(`${type} slide is owned by the native navigation renderer`);
  }
  if (['closing', 'closing-dark'].includes(type)) {
    return neutralEvidenceChain(`${type} slide is owned by the native closing renderer`);
  }
  if (['cover', 'cover-dark'].includes(type) && (!explicitProofRoute || slide.proofObjectInferred)) {
    return neutralEvidenceChain(`${type} slide has no explicit proof route; skipped industry evidence-chain inference`);
  }
  const layoutVariant = normalizeKey(slide.layoutVariant || slide.layout_variant || slide.variant);
  if (type === 'strategy-map' && /value-creation-process-map/.test(layoutVariant)) {
    return neutralEvidenceChain('value-creation-process-map is owned by the native strategy/value-chain renderer');
  }
  if (genericCardJudgmentWithoutEvidence(slide, hasFieldPath)) {
    return neutralEvidenceChain(`${type} slide is a judgment/card page without structured evidence fields; skipped industry evidence-chain inference`);
  }
  const scored = chain.stages.map(stage => Object.assign({ stage }, scoreStage(stage, slide)))
    .sort((a, b) => b.score - a.score || a.stage.position - b.stage.position);
  const best = scored[0] || {};
  const genericProcessFields = new Set(['phases', 'actions', 'steps', 'timeline', 'milestones', 'loopItems', 'workflows', 'workflow']);
  const substantiveProcessFields = (best.matchedFields || []).filter(field => !genericProcessFields.has(field));
  if (
    best.stage &&
    nativeProcessOrTimelineSlide(slide) &&
    !best.matchedProofObjects.length &&
    !substantiveProcessFields.length
  ) {
    return neutralEvidenceChain(`${type || 'process'} slide is owned by the native process/timeline renderer`);
  }
  if (best.stage && nativeRiskRouteOutranksMetricOnlyStage(best.stage, slide)) {
    return nativeRiskGovernanceChain(chain, slide, `${type || 'slide'} has native risk/governance evidence but no metric/chart evidence; skipped metric-only industry evidence-chain stage`);
  }
  if (!best.stage || best.score < 3) {
    if (isNativeRiskGovernanceSlide(slide) && nativeRiskGovernanceFields(slide).length) {
      return nativeRiskGovernanceChain(chain, slide, `${type || 'slide'} provided native risk/governance evidence without a precise chain-stage match`);
    }
    return neutralEvidenceChain(`${chain.label} chain has insufficient route/proof/field evidence`);
  }
  const stage = stageVariantForMatch(best.stage, best, slide);
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
