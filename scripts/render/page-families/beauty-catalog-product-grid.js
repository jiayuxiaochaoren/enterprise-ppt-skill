const { createCatalogNote } = require('./beauty-catalog-note');

function createCatalogProductGrid(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addRect,
    addSmartPhotoPanel,
    addText,
    fileExists,
    genericShowcaseField,
    imagePathFromItem,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const { drawCatalogNote } = createCatalogNote(ctx);

  function renderProductGrid(slide, s, productList) {
    const slots = [
      { x:0.92, y:2.02, w:5.08, h:1.86 },
      { x:6.36, y:2.02, w:5.08, h:1.86 },
      { x:0.92, y:4.18, w:5.08, h:1.86 },
      { x:6.36, y:4.18, w:5.08, h:1.86 }
    ];
    productList.forEach((it,i)=>{
      const slot = slots[i];
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      const img = imagePathFromItem(it);
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i===0 ? accent : C.line, transparency:i===0 ? 18 : 16, width:0.46}
      });
      if (img && fileExists(img)) {
        addSmartPhotoPanel(slide, img, slot.x+0.14, slot.y+0.14, 2.18, slot.h-0.28, {
          role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26
        });
      } else {
        genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, 2.18, slot.h-0.28, `PRODUCT ${i+1}`);
      }
      addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+2.58, y:slot.y+0.36, w:0.30, h:0.10, fontSize:6.8, color:accent });
      addText(slide, itemTitle(it, `产品 ${i+1}`), { x:slot.x+3.00, y:slot.y+0.30, w:1.44, h:0.16, fontSize:10.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:slot.x+3.00, y:slot.y+0.78, w:1.52, h:0.28, fontSize:8.2, color:C.body, fit:'shrink', breakLine:true });
    });
    drawCatalogNote(slide, s);
  }

  return {
    renderProductGrid
  };
}

module.exports = {
  createCatalogProductGrid
};
