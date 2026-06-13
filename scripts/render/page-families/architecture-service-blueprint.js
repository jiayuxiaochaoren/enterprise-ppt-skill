const {
  createServiceBlueprintBoardRenderer
} = require('./architecture-service-blueprint-board');
const {
  serviceBlueprintColumns
} = require('./architecture-service-blueprint-data');
const {
  createServiceBlueprintRibbonRenderer
} = require('./architecture-service-blueprint-ribbon');

function createArchitectureServiceBlueprint(ctx = {}, deps = {}) {
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;
  const { drawServiceBlueprintBoard } = createServiceBlueprintBoardRenderer(ctx);
  const { drawServiceBlueprintRibbon } = createServiceBlueprintRibbonRenderer(ctx);

  return function architectureServiceBlueprint(slide, plan, s, idx) {
    const claim = s.claim || s.subtitle || '把患者触点、前台服务、后台协同和质量证据放在同一张服务蓝图里。';
    const header = drawLightPageHeader(slide, {
      kicker:'SERVICE BLUEPRINT',
      title:s.title || '医疗服务蓝图',
      titleW:5.8,
      titleSize:24,
      subtitle:claim,
      subtitleW:7.1,
      subtitleSize:10.0,
      idx
    });

    const { cols, fallback } = serviceBlueprintColumns(s);
    const contentY = Math.max(2.04, header.contentTop || 2.04);
    drawServiceBlueprintRibbon(slide, s, { y:contentY });
    const boardY = contentY + 0.82;
    drawServiceBlueprintBoard(slide, s, cols, fallback, {
      y:boardY,
      h:Math.max(3.08, 6.32 - boardY)
    });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createArchitectureServiceBlueprint
};
