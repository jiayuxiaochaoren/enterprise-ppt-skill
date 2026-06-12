function createSustainabilityImageEvidencePanels(ctx = {}) {
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

  function drawPrimaryEvidencePanels(slide, images, items, opts = {}) {
    const y = opts.y || 2.04;
    const panels = [
      { x:0.92, y, w:5.18, h:3.88, color:C.accent },
      { x:6.42, y, w:5.18, h:3.88, color:C.cyan }
    ];
    panels.forEach((panel, i) => {
      const item = items[i] || {};
      addRect(slide, panel.x, panel.y, panel.w, panel.h, panelFill(), i===0 ? panel.color : C.line, { fill:{ color:panelFill(), transparency:0 }, line:{ color:i===0?panel.color:C.line, transparency:i===0?20:16, width:0.46 } });
      if (images[i]) addSmartPhotoPanel(slide, images[i], panel.x+0.18, panel.y+0.18, panel.w-0.36, 2.18, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26 });
      else genericShowcaseField(slide, panel.x+0.18, panel.y+0.18, panel.w-0.36, 2.18, 'IMPACT EVIDENCE');
      addLabel(slide, i === 0 ? 'INITIATIVE / METRIC' : 'SOURCE / IMPACT', { x:panel.x+0.28, y:panel.y+2.62, w:1.38, h:0.09, fontSize:5.8, color:panel.color, charSpace:0.65 });
      addText(slide, itemTitle(item, i===0 ? '行动证明' : '影响证明'), { x:panel.x+0.28, y:panel.y+2.92, w:1.42, h:0.14, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(item, '把图片、指标和来源绑定到同一项可持续行动。'), { x:panel.x+2.08, y:panel.y+2.86, w:2.42, h:0.22, fontSize:7.2, color:C.body, fit:'shrink', breakLine:true });
    });
  }

  function drawSupplementalEvidenceRows(slide, items) {
    items.slice(2, 4).forEach((item, i) => {
      const x = 1.16 + i * 5.50;
      const accent = i === 0 ? C.violet : C.accent;
      addRect(slide, x, 6.16, 4.76, 0.44, C.panelAlt || C.softBlue, C.line, { fill:{ color:C.panelAlt || C.softBlue, transparency:12 }, line:{ color:C.line, transparency:100 } });
      addNumber(slide, String(i + 3).padStart(2, '0'), { x:x+0.20, y:6.30, w:0.28, h:0.09, fontSize:6.0, color:accent });
      addText(slide, itemTitle(item, `补充证据 ${i+3}`), { x:x+0.62, y:6.27, w:1.28, h:0.11, fontSize:7.6, bold:true, color:C.text, fit:'shrink' });
      addText(slide, compactEvidenceCaption(itemBody(item), 34), { x:x+2.10, y:6.27, w:1.92, h:0.11, fontSize:6.6, color:C.body, fit:'shrink' });
    });
  }

  function drawImageEvidenceSpread(slide, plan, s, opts = {}) {
    const images = galleryImages(plan, s);
    const items = (s.cards || s.items || []).slice(0, 4);
    drawPrimaryEvidencePanels(slide, images, items, opts);
    drawSupplementalEvidenceRows(slide, items);
  }

  return {
    drawImageEvidenceSpread
  };
}

module.exports = {
  createSustainabilityImageEvidencePanels
};
