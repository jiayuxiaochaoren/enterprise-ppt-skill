function createChapterManufacturingLineCard(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function drawManufacturingLineCard(slide, it, i, card) {
    const { x, y, w, accent } = card;
    addRect(slide, x, y, w, 1.18, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:i === 0 ? 18 : 40},
      line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 18 : 52, width:i === 0 ? 0.72 : 0.52}
    });
    addNumber(slide, String(i+1).padStart(2, '0'), {
      x:x+0.24, y:y+0.30, w:0.30, h:0.10,
      fontSize:6.8, color:accent
    });
    addText(slide, itemTitle(it, `节点 ${i+1}`), {
      x:x+0.56, y:y+0.20, w:w-0.72, h:0.20,
      fontSize:9.4, bold:true, color:C.white, fit:'shrink', align:'center'
    });
    addText(slide, itemBody(it), {
      x:x+0.22, y:y+0.56, w:w-0.44, h:0.38,
      fontSize:6.8, color:C.darkMuted || 'A8B3C3', fit:'shrink', align:'center', breakLine:true
    });
  }

  return {
    drawManufacturingLineCard
  };
}

module.exports = {
  createChapterManufacturingLineCard
};
