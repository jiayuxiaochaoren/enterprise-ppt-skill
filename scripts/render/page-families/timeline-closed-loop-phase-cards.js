function createTimelineClosedLoopPhaseCardsRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addClockwiseLoopConnectors,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption
  } = ctx;
  const {
    centeredStackY
  } = require('../layout/card-layout');

  function drawTimelineClosedLoopPhaseCards(slide, phases, pos, opts = {}) {
    const { cardW, cardH } = opts;
    phases.forEach((p,i)=>{
      const {x,y} = pos[i];
      const accent = i===0 ? (C.softBlue || '60A5FA') : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addRect(slide, x, y, cardW, cardH, C.ink, '334155', { fill:{color:C.ink, transparency:i===0?6:20}, line:{color:accent, transparency:i===0?18:54, width:0.44} });
      const [titleY, bodyY] = centeredStackY(y + 0.16, cardH - 0.26, [0.18, 0.30], 0.12);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:titleY+0.03, w:0.32, h:0.11, fontSize:6.8, color:accent });
      addText(slide, p.title, {
        x:x+0.66, y:titleY, w:1.42, h:0.18,
        fontSize:9.6, bold:true, color:C.white, fit:'shrink', valign:'mid'
      });
      addText(slide, compactEvidenceCaption(p.body || '', 28), {
        x:x+0.66, y:bodyY, w:1.54, h:0.30,
        fontSize:8.2, color:C.captionOnImage || 'CBD5E1', fit:'shrink', breakLine:true, valign:'mid'
      });
    });

    const [tl, tr, br, bl] = pos.map(p => ({ x:p.x, y:p.y, w:cardW, h:cardH }));
    const topY = tl.y + cardH / 2;
    const bottomY = bl.y + cardH / 2;
    const leftX = tl.x + cardW / 2;
    const rightX = tr.x + cardW / 2;
    const lineOpts = { transparency:30, width:0.54 };
    const arrowBack = Object.assign({}, lineOpts, { beginArrowType:'triangle', endArrowType:null });
    if (typeof ctx.addArrowLine === 'function') {
      const topLeftStart = tl.x + cardW + 0.28;
      const topRightEnd = tr.x - 0.28;
      const bottomLeftStart = bl.x + cardW + 0.28;
      const bottomRightEnd = br.x - 0.28;
      const rightTopStart = tr.y + cardH + 0.28;
      const rightBottomEnd = br.y - 0.28;
      const leftTopStart = tl.y + cardH + 0.28;
      const leftBottomEnd = bl.y - 0.28;

      if (topRightEnd > topLeftStart) ctx.addArrowLine(slide, topLeftStart, topY, topRightEnd - topLeftStart, 0, C.accent, lineOpts);
      if (rightBottomEnd > rightTopStart) ctx.addArrowLine(slide, rightX, rightTopStart, 0, rightBottomEnd - rightTopStart, C.cyan, lineOpts);
      if (bottomRightEnd > bottomLeftStart) ctx.addArrowLine(slide, bottomLeftStart, bottomY, bottomRightEnd - bottomLeftStart, 0, C.violet, arrowBack);
      if (leftBottomEnd > leftTopStart) ctx.addArrowLine(slide, leftX, leftTopStart, 0, leftBottomEnd - leftTopStart, C.accent, arrowBack);
    } else {
      addClockwiseLoopConnectors(slide, pos.map(p => ({ x:p.x, y:p.y, w:cardW, h:cardH })), [C.accent, C.cyan, C.violet, C.accent], {
        gap:0.24,
        transparency:30,
        width:0.54
      });
    }
  }

  return {
    drawTimelineClosedLoopPhaseCards
  };
}

module.exports = {
  createTimelineClosedLoopPhaseCardsRenderer
};
