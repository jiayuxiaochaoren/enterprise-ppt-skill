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
    addLabel(slide, s.loopLabel || '事项 · 角色 · 动作', { x:board.x+0.28, y:board.y+0.28, w:3.20, h:0.12, fontSize:6.0, color:C.muted, charSpace:0 });

    const cx = board.x + board.w/2;
    const cardW = Math.min(2.52, Math.max(2.18, (board.w - 1.72) / 2));
    const cardH = Math.min(0.98, Math.max(0.78, (board.h - 1.60) / 2));
    const topY = board.y + 0.68;
    const bottomY = board.y + board.h - cardH - 0.42;
    const leftX = board.x + 0.48;
    const rightX = board.x + board.w - cardW - 0.48;
    const cy = (topY + cardH + bottomY) / 2;
    slide.addShape('ellipse', { x:cx-0.68, y:cy-0.34, w:1.36, h:0.68, fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:54, width:0.42} });
    addText(slide, s.centerTitle || '闭环机制', { x:cx-0.46, y:cy-0.11, w:0.92, h:0.13, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, s.centerLabel || '可追踪', { x:cx-0.56, y:cy+0.10, w:1.12, h:0.08, fontSize:4.7, color:'64748B', align:'center', charSpace:0 });

    const slots = [
      { x:leftX, y:topY, color:C.accent, defaultTitle:'对象定义' },
      { x:rightX, y:topY, color:C.cyan, defaultTitle:'执行动作' },
      { x:rightX, y:bottomY, color:C.violet, defaultTitle:'交付留痕' },
      { x:leftX, y:bottomY, color:'94A3B8', defaultTitle:'复盘更新' }
    ];
    slots.forEach((slot, i) => {
      const it = items[i] || {};
      addRect(slide, slot.x, slot.y, cardW, cardH, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:i===0?0:4},
        line:{color:i===0?slot.color:C.line, transparency:i===0?16:18, width:0.44}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.20, y:slot.y+0.24, w:0.30, h:0.10, fontSize:6.8, color:slot.color });
      addText(slide, itemTitle(it, slot.defaultTitle), { x:slot.x+0.64, y:slot.y+0.16, w:Math.max(0.86, cardW-1.48), h:0.15, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, it.owner || it.role || it.accountable || ['协同角色', '执行角色', '交付角色', '复盘角色'][i], {
        x:slot.x+cardW-0.94, y:slot.y+0.17, w:0.72, h:0.14, fontSize:8.2, color:slot.color, align:'right', fit:'shrink'
      });
      addText(slide, itemBody(it, ['明确对象边界。', '推进关键动作。', '沉淀交付记录。', '更新下轮动作。'][i]), {
        x:slot.x+0.20, y:slot.y+0.50, w:Math.max(1.70, cardW-0.40), h:Math.max(0.20, cardH-0.64), fontSize:7.6, color:C.body, fit:'shrink', breakLine:true, valign:'mid'
      });
    });
    addClockwiseLoopConnectors(slide, slots.map(slot => ({ x:slot.x, y:slot.y, w:cardW, h:cardH })), [C.accent, C.cyan, C.violet, '94A3B8'], {
      gap:0.10,
      transparency:30,
      width:0.42
    });
  };
}

module.exports = {
  createRiskResponsibilityBoardRenderer
};
