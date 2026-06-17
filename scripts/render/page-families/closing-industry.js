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
      titleY:opts.titleY == null ? 1.08 : opts.titleY,
      titleW:opts.titleW,
      titleH:opts.titleH == null ? 0.66 : opts.titleH,
      titleSize:opts.titleSize,
      titleMaxLines:opts.titleMaxLines,
      longTitleOffsetY:opts.longTitleOffsetY,
      titleBreakLine:true,
      subtitle:s.subtitle || copyFallback(plan, 'closingSubtitle'),
      subtitleY:opts.subtitleY,
      subtitleW:opts.subtitleW,
      subtitleH:opts.subtitleH == null ? 0.22 : opts.subtitleH,
      subtitleSize:opts.subtitleSize == null ? 10.6 : opts.subtitleSize,
      titleSubtitleGap:opts.titleSubtitleGap,
      headerContentGap:opts.headerContentGap,
      subtitleColor:C.body,
      canvasOpts:opts.canvasOpts || { motif:'none' },
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
