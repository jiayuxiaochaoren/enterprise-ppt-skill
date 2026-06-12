function createProfileProofCardsRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawProfileProofCards(slide, cards, opts = {}) {
    const { companyIntro, hasProofImage, proofIsPortrait } = opts;
    cards.forEach((m,i)=>{
      const cardW = proofIsPortrait ? 1.86 : 2.70;
      const x = proofIsPortrait ? (4.48 + (i%2)*2.18) : (4.64 + (i%2)*3.04);
      const y = proofIsPortrait ? (2.26 + Math.floor(i/2)*1.54) : ((hasProofImage ? 3.72 : 2.18) + Math.floor(i/2)*1.24);
      const cardH = proofIsPortrait ? 1.18 : (hasProofImage ? 1.00 : 1.16);
      const value = m.value || m.title || String(i+1).padStart(2,'0');
      const label = m.label || m.body || m.note || '';
      const accent = i===0?C.accent:(i===1?C.cyan:(i===2?C.tertiary || C.violet:C.muted));
      addRect(slide, x, y, cardW, cardH, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.5} });
      addRect(slide, x, y, cardW, 0.035, accent, accent, { line:{color:accent, transparency:100} });
      addLabel(slide, companyIntro ? `事实 ${String(i+1).padStart(2,'0')}` : `PROOF 0${i+1}`, { x:x+0.22, y:y+0.28, w:0.92, h:0.09, fontSize:5.4, color:accent, charSpace:companyIntro ? 0 : 0.75 });
      addNumber(slide, value, { x:x+0.22, y:y+0.48, w:cardW-0.42, h:0.28, fontSize:hasProofImage ? 21.5 : 24, color:accent, fit:'shrink' });
      addText(slide, label, { x:x+0.24, y:y+0.86, w:cardW-0.46, h:0.16, fontSize:8.2, color:C.body, fit:'shrink' });
    });
  }

  return {
    drawProfileProofCards
  };
}

module.exports = {
  createProfileProofCardsRenderer
};
