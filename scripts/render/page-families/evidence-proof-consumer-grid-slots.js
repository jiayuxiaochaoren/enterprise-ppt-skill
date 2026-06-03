function consumerProofGridSlots(C) {
  return [
    { x:0.92, y:2.04, w:2.54, h:3.94, label:'SCENE', color:C.accent, title:'Official campaign image', body:'Source-bound visual proof.' },
    { x:3.74, y:2.04, w:2.54, h:3.94, label:'REASON', color:C.cyan, title:'Next-generation engagement', body:'Campaign logic and audience role.' },
    { x:6.56, y:2.04, w:2.54, h:3.94, label:'CHANNEL', color:C.violet, title:'Instagram / TikTok films', body:'Social-format launch evidence.' },
    { x:9.38, y:2.04, w:2.54, h:3.94, label:'BOUNDARY', color:C.accent, title:'Official source wording', body:'Claims remain source-bound.' }
  ];
}

function createConsumerProofGridSlotRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addSmartPhotoPanel,
    addText,
    compactEvidenceCaption,
    itemBodyNoEllipsis,
    itemTitle,
    panelFill
  } = ctx;

  function drawConsumerProofGridSlot(slide, slot, item, slotImage, i) {
    addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? slot.color : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?slot.color:C.line, transparency:i===0?20:16, width:0.42} });
    if (slotImage) addSmartPhotoPanel(slide, slotImage, slot.x+0.14, slot.y+0.14, slot.w-0.28, 2.22, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26 });
    else {
      addRect(slide, slot.x+0.14, slot.y+0.14, slot.w-0.28, 2.22, C.panelAlt || C.softBlue, C.line, {
        fill:{color:C.panelAlt || C.softBlue, transparency:10},
        line:{color:C.line, transparency:28, width:0.36}
      });
      addNumber(slide, String(i + 1).padStart(2, '0'), {
        x:slot.x+0.36, y:slot.y+0.54, w:0.34, h:0.12,
        fontSize:7.0, color:slot.color, fit:'shrink'
      });
      addLabel(slide, slot.label, {
        x:slot.x+0.82, y:slot.y+0.56, w:0.88, h:0.09,
        fontSize:5.6, color:slot.color, charSpace:0.7
      });
      addHairline(slide, slot.x+0.36, slot.y+1.08, slot.w-0.72, slot.color, 22, 0.46);
      addText(slide, compactEvidenceCaption(itemTitle(item, slot.title), 18), {
        x:slot.x+0.36, y:slot.y+1.34, w:slot.w-0.72, h:0.24,
        fontSize:8.0, bold:true, color:C.text, fit:'shrink', align:'center', breakLine:true
      });
    }
    addLabel(slide, slot.label, { x:slot.x+0.20, y:slot.y+2.62, w:0.84, h:0.09, fontSize:5.8, color:slot.color, charSpace:0.7 });
    addText(slide, itemTitle(item, slot.title), {
      x:slot.x+0.20, y:slot.y+2.88, w:1.86, h:0.28,
      fontSize:8.8, bold:true, color:C.text, fit:false, breakLine:true
    });
    addText(slide, itemBodyNoEllipsis(item, slot.body), {
      x:slot.x+0.20, y:slot.y+3.34, w:1.86, h:0.34,
      fontSize:7.6, color:C.body, fit:false, breakLine:true, valign:'top'
    });
  }

  return {
    drawConsumerProofGridSlot
  };
}

module.exports = {
  consumerProofGridSlots,
  createConsumerProofGridSlotRenderer
};
