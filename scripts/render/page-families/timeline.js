const family = "timeline";

const { createPageFamilyPrimitives } = require('./primitives');
const {
  createTimelineClosedLoop
} = require('./timeline-closed-loop');
const {
  createTimelineFlywheel
} = require('./timeline-flywheel');
const {
  createTimelineProcessBoard
} = require('./timeline-process-board');
const {
  createTimelineDarkPathway
} = require('./timeline-dark-pathway');

const types = ["timeline", "timeline-dark"];

function createTimelineRenderers(ctx = {}) {
  const {
    variantOf
  } = ctx;
  const { drawDarkPageHeader, drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const timelineClosedLoop = createTimelineClosedLoop(ctx, {
    drawDarkPageHeader,
    drawFooter
  });
  const timelineFlywheel = createTimelineFlywheel(ctx, {
    drawDarkPageHeader,
    drawFooter
  });
  const timelineProcessBoard = createTimelineProcessBoard(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const timelineDark = createTimelineDarkPathway(ctx, {
    drawDarkPageHeader,
    drawFooter
  });

function timelineAdaptive(slide, plan, s, idx) {
  const variant = variantOf(s, 'pathway-rail');
  if (variant === 'flywheel' || variant === 'operating-loop') return timelineFlywheel(slide, plan, s, idx);
  if (variant === 'closed-loop') return timelineClosedLoop(slide, plan, s, idx);
  if (variant === 'process-board') return timelineProcessBoard(slide, plan, s, idx);
  return timelineDark(slide, plan, s, idx);
}

  return {
    timelineAdaptive,
    timelineClosedLoop,
    timelineDark,
    timelineFlywheel,
    timelineProcessBoard
  };
}

function entries(renderers = {}) {
  return [
    { types, render:renderers.timelineAdaptive, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createTimelineRenderers,
  entries
};
