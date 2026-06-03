function createRiskResponsibilityBoardRenderer(ctx = {}, C = ctx.colors()) {
  const {
    addClockwiseLoopConnectors,
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  return function drawRiskResponsibilityBoard(slide, s, items = [], board) {
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.50}
    });
    addLabel(slide, s.loopLabel || 'RISK · OWNER · ACTION · EVIDENCE · REVIEW', { x:board.x+0.28, y:board.y+0.28, w:2.92, h:0.10, fontSize:6.0, color:C.muted, charSpace:0.72 });

    const cx = board.x + board.w/2;
    const cy = board.y + board.h/2 + 0.10;
    slide.addShape('ellipse', { x:cx-0.68, y:cy-0.34, w:1.36, h:0.68, fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:54, width:0.42} });
    addText(slide, s.centerTitle || '责任闭环', { x:cx-0.46, y:cy-0.11, w:0.92, h:0.13, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, s.centerLabel || 'NO ORPHAN RISK', { x:cx-0.56, y:cy+0.10, w:1.12, h:0.08, fontSize:4.7, color:'64748B', align:'center', charSpace:0.42 });

    const slots = [
      { x:board.x+0.48, y:board.y+0.86, color:C.accent, defaultTitle:'定责' },
      { x:board.x+4.28, y:board.y+0.86, color:C.cyan, defaultTitle:'处置' },
      { x:board.x+4.28, y:board.y+2.92, color:C.violet, defaultTitle:'留痕' },
      { x:board.x+0.48, y:board.y+2.92, color:'94A3B8', defaultTitle:'复盘' }
    ];
    const cardW = 2.52;
    const cardH = 1.02;
    slots.forEach((slot, i) => {
      const it = items[i] || {};
      addRect(slide, slot.x, slot.y, cardW, cardH, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:i===0?0:4},
        line:{color:i===0?slot.color:C.line, transparency:i===0?16:18, width:0.44}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.20, y:slot.y+0.24, w:0.30, h:0.10, fontSize:6.8, color:slot.color });
      addText(slide, itemTitle(it, slot.defaultTitle), { x:slot.x+0.64, y:slot.y+0.18, w:1.02, h:0.15, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
      addText(slide, it.owner || it.role || it.accountable || ['责任人', '处置人', '证据人', '复盘人'][i], {
        x:slot.x+1.58, y:slot.y+0.19, w:0.72, h:0.14, fontSize:8.8, color:slot.color, align:'right', fit:'shrink'
      });
      addText(slide, itemBody(it, ['明确责任与边界。', '推进处置动作。', '沉淀过程证据。', '更新治理机制。'][i]), {
        x:slot.x+0.20, y:slot.y+0.56, w:2.02, h:0.20, fontSize:8.8, color:C.body, fit:'shrink'
      });
    });
    addClockwiseLoopConnectors(slide, slots.map(slot => ({ x:slot.x, y:slot.y, w:cardW, h:cardH })), [C.accent, C.cyan, C.violet, '94A3B8'], {
      gap:0.18,
      transparency:30,
      width:0.42
    });
  };
}

module.exports = {
  createRiskResponsibilityBoardRenderer
};
