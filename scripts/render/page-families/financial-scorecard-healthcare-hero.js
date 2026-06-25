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

  function drawHealthcareExperienceHero(slide, wait, satisfaction, closure, hero) {
    const value = compactHeroMetricValue(satisfaction.value || '—');
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addRect(slide, hero.x, hero.y, 0.06, hero.h, C.accent, C.accent, {
      fill:{ color:C.accent, transparency:0 },
      line:{ color:C.accent, transparency:100 }
    });
    addLabel(slide, '核心体验', { x:hero.x+0.26, y:hero.y+0.30, w:1.40, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    addText(slide, satisfaction.label || '满意度', {
      x:hero.x+0.26,
      y:hero.y+0.86,
      w:hero.w-0.52,
      h:0.17,
      fontSize:11.2,
      bold:true,
      color:'E2E8F0',
      fit:'shrink'
    });
    addText(slide, value, {
      x:hero.x+0.26,
      y:hero.y+1.26,
      w:hero.w-0.52,
      h:0.42,
      fontSize:heroMetricFontSize(value),
      bold:true,
      color:C.white,
      fit:'shrink'
    });
    addText(slide, satisfaction.note || '把体验结果回看至预约、到院、检查和随访触点。', {
      x:hero.x+0.26,
      y:hero.y+1.86,
      w:hero.w-0.52,
      h:0.24,
      fontSize:6.8,
      color:'E2E8F0',
      fit:'shrink',
      breakLine:true
    });
    [
      [wait.label || '等待响应', wait.value || '—', C.accent],
      [closure.label || '反馈闭环', closure.value || '—', C.cyan]
    ].forEach((row, i) => {
      const y = hero.y + 2.22 + i * 0.30;
      addLabel(slide, row[0], {
        x:hero.x+0.26, y:y+0.02, w:0.92, h:0.08,
        fontSize:4.8, color:row[2], charSpace:0
      });
      addText(slide, row[1], {
        x:hero.x+1.48, y, w:0.50, h:0.10,
        fontSize:7.2, bold:true, color:'E2E8F0', fit:'shrink', align:'right'
      });
      addRect(slide, hero.x+1.12, y+0.10, 0.22, 0.024, row[2], row[2], {
        fill:{ color:row[2], transparency:12 },
        line:{ color:row[2], transparency:100 }
      });
    });
  }

  return {
    drawHealthcareExperienceHero
  };
}

module.exports = {
  createHealthcareExperienceHeroRenderer
};
