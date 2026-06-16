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
      const cardW = 1.86;
      const x = queue.x + 0.20 + i*2.10;
      const color = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, queue.y+0.12, cardW, queue.h-0.24, 'FFFFFF', color, {
        fill:{ color:'FFFFFF', transparency:0 },
        line:{ color:color, transparency:34, width:0.28 }
      });
      addLabel(slide, row[0], { x:x+0.12, y:queue.y+0.22, w:0.82, h:0.08, fontSize:4.8, color, charSpace:0 });
      addLabel(slide, row[1].value || '—', { x:x+1.12, y:queue.y+0.22, w:0.50, h:0.08, fontSize:5.0, color:C.text, charSpace:0, align:'right' });
      addRect(slide, x+0.12, queue.y+0.46, 1.22, 0.04, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, x+0.12, queue.y+0.46, metricPctWidth(row[1].value, 1.22, i===0?0.42:0.76), 0.04, color, color, { line:{color, transparency:100} });
      addLabel(slide, row[1].note || '服务节点持续复盘。', { x:x+0.12, y:queue.y+0.62, w:1.52, h:0.10, fontSize:4.6, color:C.muted, charSpace:0 });
    });
  }

  return {
    drawHealthcareServiceQueue
  };
}

module.exports = {
  createHealthcareQueueRenderer
};
