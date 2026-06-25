const {
  COMPANY_INTRO_PLAN_RE,
  NORMALIZED_PROOF_OBJECTS,
  STICKY_CLOSING_VARIANTS,
  THANK_YOU_VARIANT_TEXT_RE
} = require('./proof-taxonomy-data');
const {
  normalizedIndustryKey,
  pushRouteAudit,
  rawSemanticText,
  structuralArchetype
} = require('./proof-taxonomy-common');
const {
  normalizeProofObject
} = require('./proof-taxonomy-proof');

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
      case 'native-industrial-structure-cover': normalizedCoverVariant = ''; break;
      case 'boardroom-proof-cover': normalizedCoverVariant = 'editorial-cover'; break;
      case 'platform-system-cover': normalizedCoverVariant = 'airy-concept-opening'; break;
      case 'editorial-brand-cover': normalizedCoverVariant = 'beauty-brand-editorial-cover'; break;
      case 'clinical-quality-cover': normalizedCoverVariant = 'editorial-cover'; break;
      case 'lifestyle-editorial-cover': normalizedCoverVariant = 'airy-concept-opening'; break;
      case 'civic-executive-cover': normalizedCoverVariant = 'editorial-cover'; break;
      case 'culture-soft-cover': normalizedCoverVariant = 'culture-cover-with-soft-geometry'; break;
      default: break;
    }
    if (normalizedCoverVariant !== '' || coverArchetype === 'native-industrial-structure-cover') {
      if (normalizedCoverVariant !== key) {
        pushRouteAudit(options, 'layoutVariant', `cover layout variant normalized to ${normalizedCoverVariant || '[empty]'} from ${coverArchetype}`);
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
      case 'board-briefing-divider': normalizedDividerVariant = 'agenda-board'; break;
      case 'governance-briefing-divider': normalizedDividerVariant = 'board-briefing'; break;
      case 'industrial-structure-divider': normalizedDividerVariant = 'line-agenda'; break;
      case 'adoption-briefing-divider': normalizedDividerVariant = 'adoption-agenda'; break;
      case 'editorial-agenda-divider': normalizedDividerVariant = 'editorial-agenda'; break;
      case 'pathway-map-divider':
      case 'experience-journey-divider': normalizedDividerVariant = 'pathway-map'; break;
      case 'culture-sequence-divider': normalizedDividerVariant = 'chapter-hero'; break;
      default: break;
    }
    if (normalizedDividerVariant && normalizedDividerVariant !== key) {
      pushRouteAudit(options, 'layoutVariant', `divider layout variant normalized to ${normalizedDividerVariant} from ${dividerArchetype}`);
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
        case 'decision-rollout-close': normalizedClosingVariant = (isCompanyIntro && isThankYou) ? 'company-thanks' : 'pilot-rollout'; break;
        case 'investment-decision-close': normalizedClosingVariant = 'investment-decision'; break;
        case 'quality-handoff-close': normalizedClosingVariant = 'quality-handoff'; break;
        case 'adoption-rollout-close': normalizedClosingVariant = 'adoption-close'; break;
        case 'premium-editorial-close': normalizedClosingVariant = 'premium-closing-anchor'; break;
        case 'experience-rollout-close': normalizedClosingVariant = 'experience-rollout'; break;
        case 'governance-next-step-close': normalizedClosingVariant = 'governance-next-step'; break;
        case 'contact-closing-close': normalizedClosingVariant = isCompanyIntro ? 'company-thanks' : 'contact-closing'; break;
        default: break;
      }
      if (normalizedClosingVariant && normalizedClosingVariant !== key) {
        pushRouteAudit(options, 'layoutVariant', `closing layout variant normalized to ${normalizedClosingVariant} from ${closingArchetype}`);
        return normalizedClosingVariant;
      }
    }
  }
  return raw;
}

module.exports = {
  normalizeLayoutVariant
};
