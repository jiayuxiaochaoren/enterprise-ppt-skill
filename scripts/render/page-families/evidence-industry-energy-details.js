function createEnergySiteDetailSlotsRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    genericShowcaseField,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawEnergySiteDetailSlots(slide, slots) {
    slots.forEach((slot,i)=>{
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.42} });
      if (slot.image) addPhotoPanel(slide, slot.image, slot.x+0.14, slot.y+0.14, 1.54, slot.h-0.28, { tone:'light', transparency:82, stroke:C.line, strokeTransparency:28, fit:'cover' });
      else genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, 1.54, slot.h-0.28, slot.fallback);
      const item = slot.item || { title:slot.fallback, body:i===0 ? '检查设备状态对象。' : '进入区域化复盘。' };
      addNumber(slide, String(i+2).padStart(2,'0'), { x:slot.x+1.96, y:slot.y+0.30, w:0.28, h:0.10, typeRole:'number', fontSize:7.0, color:slot.color });
      addText(slide, itemTitle(item, slot.fallback), { x:slot.x+2.36, y:slot.y+0.26, w:1.18, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(item), { x:slot.x+3.70, y:slot.y+0.25, w:0.94, h:0.20, fontSize:7.4, color:C.body, fit:'shrink', breakLine:true });
    });
  }

  return {
    drawEnergySiteDetailSlots
  };
}

module.exports = {
  createEnergySiteDetailSlotsRenderer
};
