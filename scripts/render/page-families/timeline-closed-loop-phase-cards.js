function createTimelineClosedLoopPhaseCardsRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addClockwiseLoopConnectors,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption
  } = ctx;

  function drawTimelineClosedLoopPhaseCards(slide, phases, pos, opts = {}) {
    const { cardW, cardH } = opts;
    phases.forEach((p,i)=>{
      const {x,y} = pos[i];
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addRect(slide, x, y, cardW, cardH, C.ink, '334155', { fill:{color:C.ink, transparency:i===0?6:20}, line:{color:accent, transparency:i===0?18:54, width:0.44} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.22, w:0.32, h:0.11, fontSize:6.8, color:accent });
      addText(slide, p.title, { x:x+0.66, y:y+0.14, w:1.42, h:0.16, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
      addText(slide, compactEvidenceCaption(p.body || '', 28), {
        x:x+0.66, y:y+0.50, w:1.54, h:0.28,
        fontSize:8.2, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true, valign:'mid'
      });
    });
    addClockwiseLoopConnectors(slide, pos.map(p => ({ x:p.x, y:p.y, w:cardW, h:cardH })), [C.accent, C.cyan, C.violet, C.accent], {
      gap:0.24,
      transparency:30,
      width:0.54
    });
  }

  return {
    drawTimelineClosedLoopPhaseCards
  };
}

module.exports = {
  createTimelineClosedLoopPhaseCardsRenderer
};
