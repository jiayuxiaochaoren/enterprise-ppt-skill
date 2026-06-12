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
    const variant = String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || '');
    const governanceModel = /governance-operating-model|operating-model|治理模型/i.test(variant);
    const header = drawLightPageHeader(slide, {
      kicker:governanceModel ? 'GOVERNANCE MODEL' : 'VALUE CREATION MAP',
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

    const contentY = Math.min(2.68, Math.max(2.10, (header && header.contentTop ? header.contentTop : 2.02) + 0.08));
    const dy = contentY - 2.10;
    const left = governanceModel
      ? { x:0.92, y:2.06 + dy, w:3.12, h:Math.max(3.18, 3.94 - dy) }
      : { x:0.92, y:2.10 + dy, w:2.50, h:Math.max(3.18, 3.86 - dy) };
    const center = governanceModel
      ? { x:4.58, y:2.32 + dy, w:2.42, h:Math.max(2.92, 3.42 - dy) }
      : { x:4.16, y:1.96 + dy, w:4.02, h:Math.max(3.42, 4.14 - dy) };
    const right = governanceModel
      ? { x:7.54, y:2.06 + dy, w:4.02, h:Math.max(3.18, 3.94 - dy) }
      : { x:8.72, y:2.10 + dy, w:2.92, h:Math.max(3.18, 3.86 - dy) };
    addRect(slide, left.x, left.y, left.w, left.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addRect(slide, center.x, center.y, center.w, center.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addRect(slide, right.x, right.y, right.w, right.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    drawStrategyValueInputPanel(slide, s, drivers, left);
    drawStrategyValueOperatingPanel(slide, s, actions, center);
    drawStrategyValueOutcomePanel(slide, s, outcomes, right);
    addArrowLine(slide, left.x+left.w+0.24, (governanceModel ? 3.84 : 4.02) + dy, center.x-left.x-left.w-0.42, 0, C.accent, { transparency:14, width:0.72 });
    addArrowLine(slide, center.x+center.w+0.20, (governanceModel ? 3.84 : 4.02) + dy, right.x-center.x-center.w-0.28, 0, C.accent, { transparency:14, width:0.72 });
    if (governanceModel) {
      addRect(slide, 4.42, 2.00 + dy, 0.03, Math.max(3.34, 3.78 - dy), C.accent, C.accent, { fill:{color:C.accent, transparency:18}, line:{color:C.accent, transparency:100} });
      addRect(slide, 7.20, 2.00 + dy, 0.03, Math.max(3.34, 3.78 - dy), C.accent, C.accent, { fill:{color:C.accent, transparency:18}, line:{color:C.accent, transparency:100} });
    }
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
