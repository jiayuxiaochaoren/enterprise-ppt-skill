function createCatalogFeaturedLead(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
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

  function drawFeaturedLead(slide, lead, design = {}) {
    const leadImg = imagePathFromItem(lead, design.imagePath || '');
    const leadBox = { x:0.92, y:2.04, w:4.70, h:3.96 };
    addRect(slide, leadBox.x, leadBox.y, leadBox.w, leadBox.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.accent, transparency:22, width:0.52}
    });
    if (leadImg && fileExists(leadImg)) {
      addSmartPhotoPanel(slide, leadImg, leadBox.x+0.18, leadBox.y+0.18, leadBox.w-0.36, 2.34, {
        role:'showcase', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24
      });
    } else {
      genericShowcaseField(slide, leadBox.x+0.18, leadBox.y+0.18, leadBox.w-0.36, 2.34, 'PRIMARY PRODUCT');
    }
    addLabel(slide, 'PRIMARY PRODUCT', { x:leadBox.x+0.28, y:leadBox.y+2.78, w:1.42, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, itemTitle(lead, '核心产品'), { x:leadBox.x+0.28, y:leadBox.y+3.08, w:1.82, h:0.18, fontSize:12.4, bold:true, color:C.text, fit:'shrink' });
    addText(slide, itemBody(lead), { x:leadBox.x+2.24, y:leadBox.y+3.06, w:1.86, h:0.22, fontSize:8.8, color:C.body, fit:'shrink' });
  }

  return {
    drawFeaturedLead
  };
}

module.exports = {
  createCatalogFeaturedLead
};
