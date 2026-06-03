function createPeopleProofMosaic(ctx = {}, deps = {}) {
  const {
    addLabel,
    addNumber,
    addRect,
    addSmartPhotoPanel,
    addText,
    compactEvidenceCaption,
    galleryImages,
    genericShowcaseField,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const C = ctx.colors();
  const {
    drawBrandStoryHeader,
    drawFooter
  } = deps;

  return function peopleProofMosaic(slide, plan, s, idx) {
    drawBrandStoryHeader(slide, s, idx, {
      kicker:'PEOPLE PROOF MOSAIC',
      title:'团队证据墙',
      titleW:6.0,
      subtitle:'每个成员场景都需要角色、场景和产出 caption。',
      subtitleW:7.0,
      pageNumber:'chrome'
    });
    const images = galleryImages(plan, s);
    const items = (s.cards || s.items || []).slice(0, 4);
    const hero = { x:0.92, y:2.04, w:4.86, h:3.92 };
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    if (images[0]) addSmartPhotoPanel(slide, images[0], hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.62, { role:'evidence', tone:'light', transparency:100, stroke:'334155', strokeTransparency:44 });
    else genericShowcaseField(slide, hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.62, 'PEOPLE SCENE');
    const lead = items[0] || { title:'团队角色', body:'用场景图证明协作方式和产出。' };
    addLabel(slide, 'ROLE / SCENE / OUTPUT', { x:hero.x+0.30, y:hero.y+3.06, w:1.58, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
    addText(slide, itemTitle(lead, '团队角色'), { x:hero.x+0.30, y:hero.y+3.36, w:1.42, h:0.15, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(lead, '证明协作方式和产出。'), { x:hero.x+2.08, y:hero.y+3.32, w:2.16, h:0.16, fontSize:7.0, color:C.captionOnImage, fit:'shrink' });

    const slots = [
      { x:6.24, y:2.04, w:2.36, h:1.72, color:C.cyan },
      { x:9.04, y:2.04, w:2.36, h:1.72, color:C.violet },
      { x:6.24, y:4.24, w:5.16, h:1.72, color:C.accent }
    ];
    slots.forEach((slot, i) => {
      const item = items[i + 1] || {};
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?slot.color:C.line, transparency:i===0?20:16, width:0.38} });
      const imgW = i === 2 ? 1.72 : slot.w - 0.28;
      if (images[i + 1]) addSmartPhotoPanel(slide, images[i + 1], slot.x+0.14, slot.y+0.14, imgW, 0.96, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28 });
      else genericShowcaseField(slide, slot.x+0.14, slot.y+0.14, imgW, 0.96, 'TEAM PROOF');
      const textX = i === 2 ? slot.x + 2.12 : slot.x + 0.20;
      const textY = i === 2 ? slot.y + 0.28 : slot.y + 1.24;
      addNumber(slide, String(i + 2).padStart(2, '0'), { x:textX, y:textY+0.02, w:0.28, h:0.09, fontSize:6.0, color:slot.color });
      addText(slide, itemTitle(item, `团队证据 ${i+2}`), { x:textX+0.40, y:textY, w:i===2?1.18:1.24, h:0.13, fontSize:8.2, bold:true, color:C.text, fit:'shrink' });
      if (i === 2) addText(slide, compactEvidenceCaption(itemBody(item), 22), { x:textX+1.76, y:textY, w:1.00, h:0.12, fontSize:6.6, color:C.body, fit:'shrink' });
      else addText(slide, compactEvidenceCaption(itemBody(item), 22), { x:slot.x+0.20, y:slot.y+1.48, w:1.64, h:0.10, fontSize:6.3, color:C.body, fit:'shrink' });
    });
    addText(slide, s.note || '人物图片必须证明角色、协作场景和产出，不做单纯氛围拼贴。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createPeopleProofMosaic
};
