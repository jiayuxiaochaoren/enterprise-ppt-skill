const {
  createModuleMatrixCorePanel
} = require('./strategy-module-core-panel');
const {
  createModuleMatrixRadarField
} = require('./strategy-module-radar-field');

function createModuleMatrixRenderer(ctx = {}, deps = {}) {
  const W = ctx.canvasWidth();
  const H = ctx.canvasHeight();
  const {
    addRect,
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;
  const { drawModuleMatrixCorePanel } = createModuleMatrixCorePanel(ctx);
  const { drawModuleMatrixRadarField } = createModuleMatrixRadarField(ctx);

  return function moduleMatrix(slide, plan, s, idx) {
    slide.background = { color:'F7FAFD' };
    addRect(slide, 0, 0, W, H, 'F7FAFD', 'F7FAFD');
    addRect(slide, 0, 0, W, 0.92, 'FFFFFF', 'FFFFFF', { fill:{color:'FFFFFF', transparency:0}, line:{color:'FFFFFF', transparency:100} });
    drawLightPageHeader(slide, {
      canvas:false,
      kicker:'CAPABILITY MAP',
      title:s.title,
      titleW:4.8,
      titleFit:false,
      subtitle:s.intro,
      subtitleW:5.2,
      subtitleH:0.22,
      subtitleSize:10.8,
      subtitleFit:false,
      idx,
      pageNumberMethod:'text'
    });

    const cards = s.cards || [];
    drawModuleMatrixCorePanel(slide, plan, s);
    drawModuleMatrixRadarField(slide, cards);
    drawFooter(slide, plan, { color:'738297' });
  };
}

module.exports = {
  createModuleMatrixRenderer
};
