function createBeautyCatalogGridCardsRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addSmartPhotoPanel,
    addText,
    fileExists,
    imagePathFromItem,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawCatalogGridCards(slide, productList, layout) {
    const { cardH, cardW, slots } = layout;
    productList.forEach((it,i)=>{
      const [x,y] = slots[i];
      const img = imagePathFromItem(it);
      addRect(slide, x, y, cardW, cardH, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:C.line, transparency:14, width:0.45}
      });
      if (img && fileExists(img)) addSmartPhotoPanel(slide, img, x+0.12, y+0.12, cardW-0.24, 0.82, {
        role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:30
      });
      else addRect(slide, x+0.12, y+0.12, cardW-0.24, 0.82, C.panelAlt || C.softBlue, C.panelAlt || C.softBlue, {
        fill:{color:C.panelAlt || C.softBlue, transparency:4},
        line:{color:C.line, transparency:100}
      });
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addNumber(slide, String(i+1).padStart(2,'0'), {
        x:x+0.18, y:y+1.12, w:0.28, h:0.10, fontSize:6.4, color:accent
      });
      addText(slide, itemTitle(it, `产品 ${i+1}`), {
        x:x+0.58, y:y+1.07, w:cardW-1.02, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, itemBody(it), {
        x:x+0.58, y:y+1.36, w:cardW-1.00, h:0.12, fontSize:6.8, color:C.body, fit:'shrink'
      });
    });
  }

  return {
    drawCatalogGridCards
  };
}

module.exports = {
  createBeautyCatalogGridCardsRenderer
};
