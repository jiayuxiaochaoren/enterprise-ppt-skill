const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createClosingManufacturingRolloutRenderer
} = require('./closing-manufacturing-rollout');
const {
  createClosingIndustryOutcomeRenderers
} = require('./closing-industry-outcomes');

function createClosingIndustryRenderers(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const closingActions = helpers.closingActions || (() => []);
  const closingMeta = helpers.closingMeta || (plan => ctx.footerText(plan));
  const {
    copyFallback
  } = ctx;

  function drawClosingHeader(slide, plan, s, idx, opts = {}) {
    drawLightPageHeader(slide, {
      kicker:s.label || opts.kicker,
      title:s.title || copyFallback(plan, 'closingTitle'),
      titleY:1.08,
      titleW:opts.titleW,
      titleH:0.66,
      titleSize:opts.titleSize,
      titleBreakLine:true,
      subtitle:s.subtitle || copyFallback(plan, 'closingSubtitle'),
      subtitleY:opts.subtitleY,
      subtitleW:opts.subtitleW,
      subtitleH:0.22,
      subtitleSize:10.6,
      subtitleColor:C.body,
      idx:idx || ''
    });
  }

  const closingManufacturingPilotRollout = createClosingManufacturingRolloutRenderer(ctx, {
    closingActions,
    closingMeta,
    drawClosingHeader,
    drawFooter
  });
  const {
    closingFinanceInvestmentDecision,
    closingHealthcareQualityHandoff,
    closingSaasAdoptionClose
  } = createClosingIndustryOutcomeRenderers(ctx, {
    closingActions,
    closingMeta,
    drawClosingHeader,
    drawFooter
  });

  return {
    closingFinanceInvestmentDecision,
    closingHealthcareQualityHandoff,
    closingManufacturingPilotRollout,
    closingSaasAdoptionClose
  };
}

module.exports = {
  createClosingIndustryRenderers
};
