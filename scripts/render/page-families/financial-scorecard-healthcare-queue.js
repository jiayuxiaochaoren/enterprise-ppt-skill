const {
  metricPctWidth
} = require('./financial-scorecard-primitives');

function createHealthcareQueueRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect
  } = ctx;

  function drawHealthcareServiceQueue(slide, wait, satisfaction, closure, queue) {
    addRect(slide, queue.x, queue.y, queue.w, queue.h, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
    [
      ['等待响应', wait],
      ['满意度', satisfaction],
      ['反馈处理', closure]
    ].forEach((row,i)=>{
      const x = queue.x + 0.28 + i*2.04;
      const color = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addLabel(slide, row[0], { x, y:queue.y+0.16, w:0.90, h:0.08, fontSize:4.8, color, charSpace:0.4 });
      addRect(slide, x, queue.y+0.40, 1.36, 0.045, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, x, queue.y+0.40, metricPctWidth(row[1].value, 1.36, i===0?0.42:0.76), 0.045, color, color, { line:{color, transparency:100} });
    });
  }

  return {
    drawHealthcareServiceQueue
  };
}

module.exports = {
  createHealthcareQueueRenderer
};
