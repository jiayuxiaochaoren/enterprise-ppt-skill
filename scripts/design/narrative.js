const NARRATIVE_ORDER = {
  setup: 0,
  orientation: 1,
  diagnosis: 2,
  evidence: 3,
  proof: 4,
  solution: 5,
  'operating-model': 6,
  governance: 7,
  decision: 8
};

function createNarrativeHelpers({
  contentSignals = () => ({}),
  semanticFrame = () => ({}),
  semanticMeaning = () => ({}),
  highValuePageFamilies = new Set(),
  layoutVariantCompatibleWithType = () => false
} = {}) {
  function inferNarrativeRole(plan = {}, s = {}, index = 0, total = 1, semantic = semanticFrame(plan, s, contentSignals(plan, s, index, total))) {
    const type = s.type || '';
    const variant = s.layoutVariant || '';
    if (index === 0 || type === 'cover') return 'setup';
    if (index === total - 1 || type === 'closing') return 'decision';
    if (type === 'chapter-divider' || type === 'toc' || type === 'toc-clean') return 'orientation';
    if (['profile-proof', 'report-board', 'comparison'].includes(type)) return 'diagnosis';
    if (semantic.primaryIntent === 'caseEvidence' || type === 'case-gallery' || type === 'quote-proof') return 'evidence';
    if (semantic.primaryIntent === 'product' || type === 'product-showcase' || type === 'architecture') return 'solution';
    if (type === 'timeline' || variant.includes('loop')) return 'operating-model';
    if (type === 'risk-table') return 'governance';
    if (type === 'metric-comparison' || type === 'finance-bridge' || type === 'portfolio-table' || type === 'industry-chart') return 'proof';
    return semantic.primaryIntent || 'narrative';
  }

  function routeKey(s = {}) {
    return s.layoutVariant ? `${s.type}:${s.layoutVariant}` : String(s.type || '');
  }

  function routeMatches(key = '', expected = '') {
    if (!key || !expected) return false;
    if (key === expected) return true;
    return !expected.includes(':') && key.startsWith(`${expected}:`);
  }

  function highValueFamilyHas(value) {
    if (!value) return false;
    if (highValuePageFamilies && typeof highValuePageFamilies.has === 'function') return highValuePageFamilies.has(value);
    return Array.isArray(highValuePageFamilies) && highValuePageFamilies.includes(value);
  }

  function applyNarrativeMetadata(plan = {}, slides = []) {
    return slides.map((slide, i) => {
      const signals = contentSignals(plan, slide, i, slides.length);
      const semantic = semanticFrame(plan, slide, signals) || {};
      const meaning = semantic.semanticMeaning || semanticMeaning(plan, slide, signals) || {};
      const explicitProofObject = slide.proofObject || slide.proof_object;
      const variantProofObject = !explicitProofObject &&
        slide.layoutVariant &&
        highValueFamilyHas(slide.layoutVariant) &&
        layoutVariantCompatibleWithType(slide.type, slide.layoutVariant)
        ? slide.layoutVariant
        : '';
      const proofObject = explicitProofObject || variantProofObject || semantic.proofObject;
      const next = Object.assign({}, slide, {
        semanticIntent: slide.semanticIntent || semantic.primaryIntent,
        semanticConfidence: slide.semanticConfidence || semantic.confidence,
        proofObject,
        narrativeRole: slide.narrativeRole || inferNarrativeRole(plan, slide, i, slides.length, semantic),
        semanticPurpose: slide.semanticPurpose || meaning.materialPurpose,
        semanticRelations: slide.semanticRelations || Object.entries(meaning.relations || {}).filter(([, v]) => v).map(([k]) => k),
        industryEntities: slide.industryEntities || meaning.entities,
        semanticScores: slide.semanticScores || meaning.scores,
        candidateProofObjects: slide.candidateProofObjects || (meaning.proofCandidates || []).slice(0, 3).map(p => ({
          id: p.id,
          route: p.route,
          score: p.score
        }))
      });
      if (next.proof && next.proof.version === 'proof-object/v1' && /^slide-\d+$/i.test(String(next.proof.id || '')) && proofObject) {
        next.proof = Object.assign({}, next.proof, { id: proofObject });
      }
      return next;
    });
  }

  function sequenceSlidesByNarrative(plan = {}, slides = []) {
    if (slides.length <= 3) return slides;
    const first = slides[0];
    const last = slides[slides.length - 1];
    const middle = slides.slice(1, -1).map((slide, index) => ({ slide, index }));
    middle.sort((a, b) => {
      const ao = NARRATIVE_ORDER[a.slide.narrativeRole] ?? 4;
      const bo = NARRATIVE_ORDER[b.slide.narrativeRole] ?? 4;
      return ao === bo ? a.index - b.index : ao - bo;
    });
    return [first, ...middle.map(x => x.slide), last];
  }

  function deckNarrativeSummary(plan = {}, slides = []) {
    const roleCounts = slides.reduce((acc, slide) => {
      const role = slide.narrativeRole || 'narrative';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    const themeIntentCounts = slides.reduce((acc, slide) => {
      const intent = slide.themeIntent || (slide.compositionPlan && slide.compositionPlan.themeIntent) || 'unset';
      acc[intent] = (acc[intent] || 0) + 1;
      return acc;
    }, {});
    const routeCounts = slides.reduce((acc, slide) => {
      const key = routeKey(slide);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      industry: plan.industry || '',
      documentType: plan.documentType || '',
      roleCounts,
      themeIntentCounts,
      routeCounts,
      proofObjects: slides.map(s => s.proofObject).filter(Boolean)
    };
  }

  return {
    NARRATIVE_ORDER,
    inferNarrativeRole,
    routeKey,
    routeMatches,
    applyNarrativeMetadata,
    sequenceSlidesByNarrative,
    deckNarrativeSummary
  };
}

module.exports = {
  NARRATIVE_ORDER,
  createNarrativeHelpers
};
