function createChapterEditorialCopyRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addText,
    itemBody,
    itemTitle,
    profileFont
  } = ctx;

  function drawChapterEditorialCopy(slide, s, chapter, items) {
    addLabel(slide, s.label || 'EDITORIAL AGENDA', { x:0.86, y:0.94, w:1.64, h:0.13, typeRole:'kicker', fontSize:7.1, color:C.cyan, charSpace:0.9 });
    addText(slide, chapter, { x:0.82, y:1.45, w:0.92, h:0.34, typeRole:'metricMedium', fontSize:22.5, bold:true, color:C.accent, fit:'shrink', fontFace:profileFont('number') });
    addText(slide, s.title || '章节标题', { x:0.86, y:2.10, w:4.85, h:0.45, typeRole:'pageTitle', fontSize:22.5, bold:true, color:C.white, fit:'shrink', breakLine:true, fontFace:profileFont() });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.90, y:3.02, w:5.30, h:0.22, typeRole:'subtitle', fontSize:10.5, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 0.90, 3.56, 0.82, C.accent, 0, 0.72);
    items.forEach((it,i)=>{
      const y = 4.10 + i*0.78;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:0.92, y:y+0.03, w:0.30, h:0.12, typeRole:'caption', fontSize:7.5, color:accent });
      addText(slide, itemTitle(it), { x:1.42, y, w:2.45, h:0.17, typeRole:'cardTitle', fontSize:11.25, bold:true, color:C.white, fit:'shrink' });
      if (itemBody(it)) addText(slide, itemBody(it), { x:1.42, y:y+0.27, w:4.92, h:0.34, typeRole:'body', fontSize:9.2, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true });
    });
  }

  return {
    drawChapterEditorialCopy
  };
}

module.exports = {
  createChapterEditorialCopyRenderer
};
