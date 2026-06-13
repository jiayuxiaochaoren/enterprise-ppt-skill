function createHealthcareExperienceHeroRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function compactHeroMetricValue(value) {
    const text = String(value == null ? '—' : value).trim();
    const wanYuan = text.match(/^([+-]?\d+(?:\.\d+)?)\s*万元$/);
    if (wanYuan) return `${wanYuan[1]}万`;
    return text;
  }

  function heroMetricFontSize(value) {
    const text = String(value || '');
    if (/万|元|条|份|人|家|店/.test(text)) return text.length >= 5 ? 24 : 26;
    if (text.length >= 7) return 27;
    return 31;
  }

  function drawHealthcareExperienceHero(slide, satisfaction, hero) {
    const value = compactHeroMetricValue(satisfaction.value || '—');
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, '核心体验', { x:hero.x+0.28, y:hero.y+0.30, w:1.40, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    addText(slide, satisfaction.label || '满意度', {
      x:hero.x+0.24,
      y:hero.y+0.86,
      w:hero.w-0.48,
      h:0.17,
      fontSize:11.2,
      bold:true,
      color:'E2E8F0',
      align:'center',
      fit:'shrink'
    });
    addText(slide, value, {
      x:hero.x+0.20,
      y:hero.y+1.36,
      w:hero.w-0.40,
      h:0.44,
      fontSize:heroMetricFontSize(value),
      bold:true,
      color:C.white,
      align:'center',
      fit:'shrink'
    });
    addHairline(slide, hero.x+(hero.w-1.30)/2, hero.y+2.06, 1.30, C.accent, 0, 0.55);
    addText(slide, satisfaction.note || '把体验结果回看至预约、到院、检查和随访触点。', {
      x:hero.x+0.26,
      y:hero.y+2.34,
      w:hero.w-0.52,
      h:0.26,
      fontSize:7.0,
      color:'E2E8F0',
      align:'center',
      fit:'shrink',
      breakLine:true
    });
  }

  return {
    drawHealthcareExperienceHero
  };
}

module.exports = {
  createHealthcareExperienceHeroRenderer
};
