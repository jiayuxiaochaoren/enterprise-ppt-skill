function createTimelineClosedLoopBoardRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawTimelineClosedLoopBoard(slide, plan, s, board) {
    addRect(slide, board.x, board.y, board.w, board.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:58},
      line:{color:'334155', transparency:74, width:0.36}
    });
    addLabel(slide, plan.industry === 'manufacturing-operations' ? 'FAULT · WORKORDER · SPARE PART · OEE' : 'ACTION · DATA · REVIEW', {
      x:board.x+0.30, y:board.y+0.28, w:2.92, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.75
    });

    const cx = 6.34;
    const cy = 4.05;
    slide.addShape('ellipse', { x:cx-1.34, y:cy-0.70, w:2.68, h:1.40, fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:46, width:0.46} });
    slide.addShape('ellipse', { x:cx-0.92, y:cy-0.42, w:1.84, h:0.84, fill:{color:C.ink2, transparency:30}, line:{color:'334155', transparency:62, width:0.28} });
    addText(slide, s.centerTitle || (plan.industry === 'manufacturing-operations' ? 'OEE复盘' : '闭环复盘'), { x:cx-0.74, y:cy-0.14, w:1.48, h:0.18, fontSize:12.8, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, 'DATA BACK TO ACTION', { x:cx-0.86, y:cy+0.20, w:1.72, h:0.09, fontSize:5.2, color:'64748B', align:'center', charSpace:0.62 });
    addLabel(slide, 'SEQUENCE 01 → 02 → 03 → 04 → 01', { x:board.x+0.30, y:board.y+0.48, w:2.92, h:0.09, fontSize:5.3, color:C.darkMuted || '64748B', charSpace:0.62 });
  }

  return {
    drawTimelineClosedLoopBoard
  };
}

module.exports = {
  createTimelineClosedLoopBoardRenderer
};
