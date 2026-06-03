function createRetailSignalCardsRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText
  } = ctx;

  function drawRetailSignalCards(slide, basket, conversion, right) {
    [basket, conversion].forEach((m,i)=>{
      const y = right.y + i*1.04;
      const color = i===0 ? C.cyan : C.violet;
      addRect(slide, right.x, y-0.02, 2.62, 0.84, 'FFFFFF', C.line, { fill:{color:'FFFFFF', transparency:0}, line:{color:C.line, transparency:18, width:0.34} });
      addLabel(slide, i===0 ? 'BASKET' : 'STORE CONVERSION', { x:right.x+0.18, y:y+0.18, w:1.34, h:0.09, fontSize:6.8, color, charSpace:0.4 });
      addText(slide, m.label || (i===0 ? '客单价' : '门店转化'), { x:right.x+0.18, y:y+0.44, w:1.12, h:0.13, fontSize:8.9, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '—', { x:right.x+1.60, y:y+0.34, w:0.76, h:0.18, fontSize:13.6, color, align:'right', fit:'shrink' });
    });
  }

  return {
    drawRetailSignalCards
  };
}

module.exports = {
  createRetailSignalCardsRenderer
};
