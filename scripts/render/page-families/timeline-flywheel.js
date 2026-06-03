const {
  createTimelineFlywheelDiagram
} = require('./timeline-flywheel-diagram');

function createTimelineFlywheel(ctx = {}, deps = {}) {
  const {
    drawDarkPageHeader,
    drawFooter
  } = deps;
  const {
    drawTimelineFlywheelDiagram
  } = createTimelineFlywheelDiagram(ctx);

  return function timelineFlywheel(slide, plan, s, idx) {
    drawDarkPageHeader(slide, {
      kicker:'OPERATING FLYWHEEL',
      title:s.title || '运营飞轮',
      titleW:6.9,
      titleH:0.38,
      subtitle:s.subtitle || s.claim,
      subtitleW:6.2,
      subtitleSize:10.2,
      idx
    });
    drawTimelineFlywheelDiagram(slide, s);
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createTimelineFlywheel
};
