function createRetailLookbookSupportingScenes(ctx = {}) {
  const {
    addHairline,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    compactEvidenceCaption,
    itemBody,
    itemTitle
  } = ctx;
  const C = ctx.colors();

  function drawPlaceholderScene(slide, slot, item, i) {
    addRect(slide, slot.x, slot.y, slot.w, slot.h, C.panelAlt || C.softBlue, C.line, {
      fill:{color:C.panelAlt || C.softBlue, transparency:10},
      line:{color:C.line, transparency:18, width:0.40}
    });
    addNumber(slide, String(i+2).padStart(2, '0'), {
      x:slot.x+0.22, y:slot.y+0.34, w:0.30, h:0.10,
      fontSize:6.6, color:i === 0 ? C.cyan : C.violet
    });
    addHairline(slide, slot.x+0.22, slot.y+0.76, slot.w-0.44, i === 0 ? C.cyan : C.violet, 28, 0.34);
    addText(slide, compactEvidenceCaption(itemTitle(item, i === 0 ? '低压验证' : '退出条件'), 16), {
      x:slot.x+0.22, y:slot.y+0.98, w:slot.w-0.44, h:0.18,
      fontSize:7.4, bold:true, color:C.text, fit:'shrink', align:'center'
    });
    addText(slide, compactEvidenceCaption(itemBody(item), 22), {
      x:slot.x+0.22, y:slot.y+1.24, w:slot.w-0.44, h:0.22,
      fontSize:6.6, color:C.body, fit:'shrink', align:'center', breakLine:true
    });
  }

  function drawSupportingScenes(slide, images, storyItems) {
    [
      { x:6.70, y:2.04, w:2.12, h:1.66 },
      { x:9.24, y:2.04, w:2.12, h:1.66 }
    ].forEach((slot, i) => {
      const item = storyItems[i+1] || {};
      if (images[i+1]) {
        addPhotoPanel(slide, images[i+1], slot.x, slot.y, slot.w, slot.h, {
          tone:'light', transparency:100, stroke:'E4ECF5', strokeTransparency:14, fit:'cover'
        });
      } else {
        drawPlaceholderScene(slide, slot, item, i);
      }
      addText(slide, String(i+2).padStart(2, '0'), {
        x:slot.x, y:slot.y+slot.h+0.18, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i === 0 ? C.cyan : C.violet
      });
      addText(slide, itemTitle(item, i === 0 ? '搭配细节' : '空间触点'), {
        x:slot.x+0.44, y:slot.y+slot.h+0.12, w:1.24, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink'
      });
      if (itemBody(item)) addText(slide, itemBody(item), {
        x:slot.x+0.44, y:slot.y+slot.h+0.38, w:1.42, h:0.16, fontSize:8.8, color:C.body, fit:'shrink'
      });
    });
  }

  return {
    drawSupportingScenes
  };
}

module.exports = {
  createRetailLookbookSupportingScenes
};
