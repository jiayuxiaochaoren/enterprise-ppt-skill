const {
  assertRendererContext
} = require('../renderer-context');
const { createPageFamilyPrimitives } = require('./primitives');
const {
  createPremiumClosingAnchor
} = require('./closing-premium-anchor');
const {
  createClosingCompanyThanksRenderer
} = require('./closing-company-thanks');
const {
  createClosingDecisionSummaryRenderer
} = require('./closing-decision-summary');

function createClosingExecutiveRenderers(ctx = {}, options = {}) {
  assertRendererContext(ctx, ['closing'], { label:'closing executive renderer context' });
  const { closingActions, closingMeta } = options;
  const { drawDarkStageShell, drawFooter } = createPageFamilyPrimitives(ctx);

  function contactItemsForClosing(plan = {}, s = {}) {
    const raw = s.contacts || s.contact || plan.contacts || plan.contact || [];
    if (Array.isArray(raw)) {
      return raw
        .map(v => typeof v === 'string' ? v : [v.label, v.value || v.text].filter(Boolean).join('：'))
        .filter(Boolean);
    }
    return String(raw || '').split(/[｜|/]/).map(v => v.trim()).filter(Boolean);
  }
  const premiumClosingAnchor = createPremiumClosingAnchor(ctx, {
    closingActions,
    contactItemsForClosing,
    drawDarkStageShell,
    drawFooter
  });
  const closingCompanyThanks = createClosingCompanyThanksRenderer(ctx, {
    contactItemsForClosing
  });
  const closingDecisionSummary = createClosingDecisionSummaryRenderer(ctx, {
    closingActions,
    closingMeta
  });

  return {
    closingCompanyThanks,
    closingDecisionSummary,
    premiumClosingAnchor
  };
}

module.exports = {
  createClosingExecutiveRenderers
};
