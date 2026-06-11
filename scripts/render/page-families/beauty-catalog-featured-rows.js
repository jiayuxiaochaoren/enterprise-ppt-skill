function createCatalogFeaturedRows(ctx = {}) {
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

  function drawFeaturedRows(slide, productList) {
    productList.slice(1).forEach((it,i)=>{
      const x = 6.14;
      const y = 2.04 + i*1.36;
      const accent = i===0 ? C.cyan : (i===1 ? C.violet : '94A3B8');
      const img = imagePathFromItem(it);
      addRect(slide, x, y, 5.42, 1.10, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.46}
      });
      if (img && fileExists(img)) {
        addSmartPhotoPanel(slide, img, x+0.16, y+0.16, 1.26, 0.78, {
          role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28
        });
      } else {
        addRect(slide, x+0.24, y+0.30, 0.46, 0.46, accent, accent, {
          fill:{color:accent, transparency:86},
          line:{color:accent, transparency:36, width:0.40}
        });
        addNumber(slide, String(i+2).padStart(2,'0'), {
          x:x+0.24, y:y+0.30, w:0.46, h:0.46, fontSize:6.8, color:accent,
          align:'center', valign:'mid', margin:0, fit:'shrink', allowTiny:true
        });
      }
      addText(slide, itemTitle(it, `产品 ${i+2}`), {
        x:x+0.92, y:y+0.25, w:1.42, h:0.18, fontSize:10.3, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, itemBody(it), {
        x:x+2.58, y:y+0.22, w:2.28, h:0.36, fontSize:8.4, color:C.body, fit:'shrink', breakLine:true, valign:'mid'
      });
    });
  }

  return {
    drawFeaturedRows
  };
}

module.exports = {
  createCatalogFeaturedRows
};
