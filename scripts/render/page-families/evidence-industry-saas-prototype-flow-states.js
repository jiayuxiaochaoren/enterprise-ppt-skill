function createSaasPrototypeStateRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addPhotoPanel,
    addText,
    genericShowcaseField,
    itemTitle
  } = ctx;

  function drawSaasScreenStates(slide, images, steps) {
    const screenSlots = [
      { x:6.86, y:4.54, w:2.16, h:1.18, image:images[1], title:'STATE 02', color:C.cyan },
      { x:9.42, y:4.54, w:2.16, h:1.18, image:images[2], title:'STATE 03', color:C.violet }
    ];
    screenSlots.forEach((slot,i)=>{
      if (slot.image) addPhotoPanel(slide, slot.image, slot.x, slot.y, slot.w, slot.h, {
        tone:'light', transparency:100, stroke:C.line, strokeTransparency:24, fit:'cover'
      });
      else genericShowcaseField(slide, slot.x, slot.y, slot.w, slot.h, slot.title);
      addLabel(slide, slot.title, {
        x:slot.x, y:slot.y+slot.h+0.18, w:0.82, h:0.09, fontSize:5.4, color:slot.color, charSpace:0.7
      });
      addText(slide, itemTitle(steps[i+1], i===0 ? '自动化状态' : '分析状态'), {
        x:slot.x+0.92, y:slot.y+slot.h+0.14, w:0.98, h:0.12, fontSize:7.8, bold:true, color:C.text, fit:'shrink'
      });
    });
  }

  return {
    drawSaasScreenStates
  };
}

module.exports = {
  createSaasPrototypeStateRenderer
};
