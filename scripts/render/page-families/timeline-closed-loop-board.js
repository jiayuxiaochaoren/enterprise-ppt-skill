function createTimelineClosedLoopBoardRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;
  const { centeredStackY } = require('../layout/card-layout');

  function drawTimelineClosedLoopBoard(slide, plan, s, board) {
    const manufacturing = plan.industry === 'manufacturing-operations';
    addRect(slide, board.x, board.y, board.w, board.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:58},
      line:{color:'334155', transparency:74, width:0.36}
    });
    addLabel(slide, manufacturing ? '对象 · 交付 · 验收 · 维保' : '动作 · 数据 · 复盘', {
      x:board.x+0.30, y:board.y+0.28, w:3.10, h:0.10, fontSize:5.8, color:'64748B', charSpace:0
    });
    addLabel(slide, manufacturing ? '闭环顺序 01 → 02 → 03 → 04 → 01' : '动作顺序 01 → 02 → 03 → 04 → 01', {
      x:board.x+board.w-3.36, y:board.y+0.28, w:3.06, h:0.10, fontSize:5.3, color:C.darkMuted || '64748B', align:'right', charSpace:0
    });

    const cx = board.x + board.w / 2;
    const cy = board.y + board.h / 2 + 0.06;
    slide.addShape('ellipse', { x:cx-1.34, y:cy-0.70, w:2.68, h:1.40, fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:46, width:0.46} });
    slide.addShape('ellipse', { x:cx-0.92, y:cy-0.42, w:1.84, h:0.84, fill:{color:C.ink2, transparency:30}, line:{color:'334155', transparency:62, width:0.28} });
    const titleH = 0.18;
    const labelH = 0.09;
    const [titleY, labelY] = centeredStackY(cy - 0.42, 0.84, [titleH, labelH], 0.12);
    addText(slide, s.centerTitle || (manufacturing ? '交付复盘' : '闭环复盘'), { x:cx-0.78, y:titleY, w:1.56, h:titleH, fontSize:12.4, bold:true, color:C.white, align:'center', fit:'shrink', valign:'mid' });
    addLabel(slide, manufacturing ? '资料回到下一轮动作' : '复盘回到下一轮动作', { x:cx-1.06, y:labelY, w:2.12, h:labelH, fontSize:5.2, color:'64748B', align:'center', charSpace:0 });
  }

  return {
    drawTimelineClosedLoopBoard
  };
}

module.exports = {
  createTimelineClosedLoopBoardRenderer
};
