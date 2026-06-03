const DEFAULT_FINANCE_PROFILE_CARDS = [
  { value:'6', label:'覆盖赛道' },
  { value:'42', label:'在管项目' },
  { value:'18轮', label:'投后复盘' },
  { value:'9', label:'退出案例' }
];

function financeProfileProofCards(s = {}) {
  const metrics = (s.metrics || s.cards || []).slice(0,4);
  return metrics.length ? metrics : DEFAULT_FINANCE_PROFILE_CARDS;
}

function createFinanceProfileTrackRecordRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    publicSlideNote
  } = ctx;

  function drawFinanceTrackRecordSignals(slide, s, grid) {
    addLabel(slide, 'TRACK RECORD SIGNALS', {
      x:grid.x, y:grid.y+0.10, w:1.86, h:0.11, fontSize:6.2, color:'64748B', charSpace:0.85
    });
    financeProfileProofCards(s).forEach((m,i)=>{
      const x = grid.x + (i%2)*3.02;
      const y = grid.y + 0.48 + Math.floor(i/2)*1.62;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addRect(slide, x, y, 2.62, 1.20, C.ink, '334155', {
        fill:{color:C.ink, transparency:i===0?0:18},
        line:{color:accent, transparency:i===0?24:62, width:0.46}
      });
      addLabel(slide, `PROOF 0${i+1}`, {
        x:x+0.24, y:y+0.22, w:0.86, h:0.09, fontSize:5.4, color:accent, charSpace:0.75
      });
      addNumber(slide, m.value || m.title || String(i+1).padStart(2,'0'), {
        x:x+0.24, y:y+0.48, w:1.26, h:0.30, fontSize:22, color:accent, fit:'shrink'
      });
      addText(slide, m.label || m.body || m.note || '', {
        x:x+1.36, y:y+0.56, w:0.86, h:0.16, fontSize:8.0, bold:true, color:C.white, fit:'shrink'
      });
    });
    addRect(slide, grid.x, 6.34, 4.98, 0.34, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:36},
      line:{color:'334155', transparency:70, width:0.34}
    });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, {
      x:grid.x+0.24, y:6.44, w:4.46, h:0.10, fontSize:6.8, color:C.darkMuted || '94A3B8', fit:'shrink'
    });
  }

  return {
    drawFinanceTrackRecordSignals
  };
}

module.exports = {
  createFinanceProfileTrackRecordRenderer,
  financeProfileProofCards
};
