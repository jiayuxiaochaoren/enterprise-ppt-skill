const {
  flywheelItems,
  flywheelLayout
} = require('./timeline-flywheel-data');
const {
  createFlywheelFrame
} = require('./timeline-flywheel-frame');
const {
  createFlywheelNodes
} = require('./timeline-flywheel-nodes');
const {
  createFlywheelSlots
} = require('./timeline-flywheel-slots');

function createTimelineFlywheelDiagram(ctx = {}) {
  const C = ctx.colors();
  const {
    addText
  } = ctx;
  const {
    drawFlywheelFrame
  } = createFlywheelFrame(ctx);
  const {
    drawFlywheelNodes
  } = createFlywheelNodes(ctx);
  const {
    flywheelSlots
  } = createFlywheelSlots(ctx);

  function drawTimelineFlywheelDiagram(slide, s) {
    const items = flywheelItems(s);
    const layout = flywheelLayout(items);
    drawFlywheelFrame(slide, s, layout);
    const slots = flywheelSlots(slide, items, layout);
    drawFlywheelNodes(slide, items, slots, layout);
    if (s.note) addText(slide, s.note, { x:0.94, y:6.46, w:8.40, h:0.14, fontSize:8.2, color:C.darkMuted || '94A3B8', fit:'shrink' });
  }

  return {
    drawTimelineFlywheelDiagram
  };
}

module.exports = {
  createTimelineFlywheelDiagram
};
