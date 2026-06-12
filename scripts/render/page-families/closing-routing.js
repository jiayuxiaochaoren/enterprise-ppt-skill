const THANK_YOU_RE = /谢谢|感谢|联系|交流|观看|答疑|Q&A|thank|thanks/i;
const COMPANY_THANKS_VARIANTS = new Set(['company-thanks', 'thank-you', 'thanks', 'simple-end', 'end']);
const SIMPLE_END_VARIANTS = new Set(['simple-end', 'end']);
const THANK_YOU_VARIANTS = new Set(['thank-you', 'thanks']);

const CLOSING_VARIANT_RENDERER_KEYS = {
  'premium-closing-anchor': 'premiumClosingAnchor',
  'pilot-rollout': 'closingManufacturingPilotRollout',
  'investment-decision': 'closingFinanceInvestmentDecision',
  'quality-handoff': 'closingHealthcareQualityHandoff',
  'adoption-close': 'closingSaasAdoptionClose',
  'decision-summary': 'closingDecisionSummary'
};

function closingTextForSlide(slide = {}) {
  return [slide.title, slide.subtitle, slide.label, slide.note].filter(Boolean).join(' ');
}

function closingRendererKey(plan = {}, slide = {}, opts = {}) {
  const variant = opts.variant || slide.closingVariant || '';
  const rawClosingVariant = slide.closingVariant || '';
  const closingText = opts.closingText != null ? String(opts.closingText || '') : closingTextForSlide(slide);
  if (plan.industry === 'energy-utility' || rawClosingVariant === 'energy-stage') return 'closingDark';
  if (variant === 'premium-closing-anchor') return CLOSING_VARIANT_RENDERER_KEYS[variant];
  if (opts.isCompanyIntro && (COMPANY_THANKS_VARIANTS.has(variant) || THANK_YOU_RE.test(closingText))) return 'closingCompanyThanks';
  if (SIMPLE_END_VARIANTS.has(variant)) return 'closingSimpleEnd';
  if (THANK_YOU_VARIANTS.has(variant) || THANK_YOU_RE.test(closingText)) return 'closingThankYou';
  if (CLOSING_VARIANT_RENDERER_KEYS[variant]) return CLOSING_VARIANT_RENDERER_KEYS[variant];
  if (rawClosingVariant === 'image' || opts.hasImageStatement) return 'closingImageStatement';
  if (rawClosingVariant === 'editorial-light' || opts.coverTone === 'light' || opts.coverTone === 'split') return 'closingEditorialLight';
  return 'closingDecisionBoard';
}

module.exports = {
  CLOSING_VARIANT_RENDERER_KEYS,
  closingRendererKey,
  closingTextForSlide
};
