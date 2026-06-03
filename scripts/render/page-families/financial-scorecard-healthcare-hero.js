function createHealthcareExperienceHeroRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText
  } = ctx;

  function drawHealthcareExperienceHero(slide, satisfaction, hero) {
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'PRIMARY EXPERIENCE', { x:hero.x+0.28, y:hero.y+0.30, w:1.40, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
    addText(slide, satisfaction.label || '满意度', { x:hero.x+0.28, y:hero.y+0.78, w:1.10, h:0.15, fontSize:8.6, bold:true, color:'CBD5E1', fit:'shrink' });
    addNumber(slide, satisfaction.value || '—', { x:hero.x+0.26, y:hero.y+1.12, w:1.74, h:0.54, fontSize:35, color:C.white, fit:'shrink' });
    addHairline(slide, hero.x+0.28, hero.y+2.08, 0.88, C.accent, 0, 0.55);
    addText(slide, satisfaction.note || '把体验结果回看至预约、到院、检查和随访触点。', { x:hero.x+0.28, y:hero.y+2.36, w:1.58, h:0.30, fontSize:6.8, color:C.captionOnImage, fit:'shrink', breakLine:true });
  }

  return {
    drawHealthcareExperienceHero
  };
}

module.exports = {
  createHealthcareExperienceHeroRenderer
};
