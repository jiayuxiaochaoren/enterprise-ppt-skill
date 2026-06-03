function createConsumerProofSlots(ctx = {}) {
  const {
    addLabel,
    addNumber,
    addRect,
    addSmartPhotoPanel,
    addText,
    compactEvidenceCaption,
    genericShowcaseField,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const C = ctx.colors();

  function drawConsumerProofSlots(slide, items, images, slots) {
    slots.forEach((slot, i) => {
      const item = items[i] || {};
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i === 0 ? slot.color : C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i === 0 ? slot.color : C.line, transparency:i === 0 ? 18 : 16, width:0.44}
      });
      if (images[i]) {
        addSmartPhotoPanel(slide, images[i], slot.x+0.14, slot.y+0.14, slot.w-0.28, 1.92, {
          role:'evidence',
          tone:'light',
          transparency:100,
          stroke:C.line,
          strokeTransparency:24
        });
      } else {
        genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, slot.w-0.28, 1.92, slot.label);
      }
      addLabel(slide, slot.label, {
        x:slot.x+0.22, y:slot.y+2.34, w:0.54, h:0.09,
        fontSize:6.8, color:slot.color, charSpace:0
      });
      addNumber(slide, String(i+1).padStart(2, '0'), {
        x:slot.x+1.42, y:slot.y+2.28, w:0.30, h:0.10,
        fontSize:6.8, color:slot.color, align:'right'
      });
      addText(slide, itemTitle(item, `消费者证据 ${i+1}`), {
        x:slot.x+0.22, y:slot.y+2.70, w:1.36, h:0.15,
        fontSize:9.0, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, compactEvidenceCaption(itemBody(item), 24), {
        x:slot.x+0.22, y:slot.y+3.12, w:1.44, h:0.24,
        fontSize:7.3, color:C.body, fit:'shrink', breakLine:true
      });
    });
  }

  return {
    drawConsumerProofSlots
  };
}

module.exports = {
  createConsumerProofSlots
};
