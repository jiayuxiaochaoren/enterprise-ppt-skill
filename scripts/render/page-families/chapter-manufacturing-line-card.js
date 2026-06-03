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
    addRect(slide, x, y, w, 1.02, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:i === 0 ? 18 : 40},
      line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 18 : 52, width:i === 0 ? 0.72 : 0.52}
    });
    addNumber(slide, String(i+1).padStart(2, '0'), {
      x:x+0.24, y:y+0.30, w:0.30, h:0.10,
      fontSize:6.8, color:accent
    });
    addText(slide, itemTitle(it, `节点 ${i+1}`), {
      x:x+0.58, y:y+0.22, w:w-0.80, h:0.16,
      fontSize:9.8, bold:true, color:C.white, fit:'shrink', align:'center'
    });
    addText(slide, itemBody(it), {
      x:x+0.28, y:y+0.58, w:w-0.56, h:0.18,
      fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink', align:'center'
    });
  }

  return {
    drawManufacturingLineCard
  };
}

module.exports = {
  createChapterManufacturingLineCard
};
