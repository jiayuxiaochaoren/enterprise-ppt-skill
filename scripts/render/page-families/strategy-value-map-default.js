const {
  createStrategyValueInputPanel
} = require('./strategy-value-map-input-panel');
const {
  createStrategyValueOperatingPanel
} = require('./strategy-value-map-operating-panel');
const {
  createStrategyValueOutcomePanel
} = require('./strategy-value-map-outcome-panel');

function createDefaultStrategyValueMapRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addArrowLine,
    addHairline,
    addRect,
    addText,
    panelFill
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;
  const { drawStrategyValueInputPanel } = createStrategyValueInputPanel(ctx);
  const { drawStrategyValueOperatingPanel } = createStrategyValueOperatingPanel(ctx);
  const { drawStrategyValueOutcomePanel } = createStrategyValueOutcomePanel(ctx);

  function drawDefaultStrategyValueMap(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'VALUE CREATION MAP',
      title:s.title || '价值创造路径',
      titleW:5.7,
      titleH:0.36,
      titleSize:24,
      subtitle:s.claim || s.subtitle,
      subtitleW:6.6,
      subtitleSize:10.0,
      idx
    });
    const drivers = s.drivers || s.inputs || (s.left || []).slice(0,3);
    const actions = s.actions || s.capabilities || (s.cards || []).slice(0,4).map(c=>c.title);
    const outcomes = s.outcomes || s.outputs || (s.right || []).slice(0,3);

    const left = { x:0.92, y:2.10, w:2.50, h:3.86 };
    const center = { x:4.16, y:1.96, w:4.02, h:4.14 };
    const right = { x:8.72, y:2.10, w:2.92, h:3.86 };
    addRect(slide, left.x, left.y, left.w, left.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addRect(slide, center.x, center.y, center.w, center.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addRect(slide, right.x, right.y, right.w, right.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    drawStrategyValueInputPanel(slide, s, drivers, left);
    drawStrategyValueOperatingPanel(slide, s, actions, center);
    drawStrategyValueOutcomePanel(slide, s, outcomes, right);
    addArrowLine(slide, left.x+left.w+0.24, 4.02, center.x-left.x-left.w-0.42, 0, C.accent, { transparency:14, width:0.72 });
    addArrowLine(slide, center.x+center.w+0.20, 4.02, right.x-center.x-center.w-0.28, 0, C.accent, { transparency:14, width:0.72 });
    addHairline(slide, 0.92, 6.34, 10.64, C.line, 14, 0.55);
    addText(slide, s.note || '价值流动、投入动作与经营结果保持在同一套链路中。', { x:0.96, y:6.54, w:8.90, h:0.13, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  }

  return {
    drawDefaultStrategyValueMap
  };
}

module.exports = {
  createDefaultStrategyValueMapRenderer
};
