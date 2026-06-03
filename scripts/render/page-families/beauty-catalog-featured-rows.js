function createCatalogFeaturedRows(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
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

  function drawFeaturedRows(slide, productList) {
    productList.slice(1).forEach((it,i)=>{
      const x = 6.14;
      const y = 2.04 + i*1.28;
      const accent = i===0 ? C.cyan : (i===1 ? C.violet : '94A3B8');
      const img = imagePathFromItem(it);
      addRect(slide, x, y, 5.42, 1.02, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.46}
      });
      if (img && fileExists(img)) {
        addSmartPhotoPanel(slide, img, x+0.16, y+0.16, 1.26, 0.70, {
          role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28
        });
      } else {
        addNumber(slide, String(i+2).padStart(2,'0'), { x:x+0.28, y:y+0.38, w:0.34, h:0.12, fontSize:7.2, color:accent });
        addHairline(slide, x+0.82, y+0.52, 0.52, accent, 20, 0.45);
      }
      addText(slide, itemTitle(it, `产品 ${i+2}`), { x:x+1.62, y:y+0.26, w:1.42, h:0.16, fontSize:10.4, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+3.20, y:y+0.23, w:1.62, h:0.22, fontSize:8.8, color:C.body, fit:'shrink' });
    });
  }

  return {
    drawFeaturedRows
  };
}

module.exports = {
  createCatalogFeaturedRows
};
