function createGuidanceAssumptionCore(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    itemTitle
  } = ctx;

  function drawGuidanceAssumptionCore(slide, s, rows, assumptions, core) {
    addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, 'GUIDANCE ASSUMPTIONS', {
      x:core.x+0.28, y:core.y+0.34, w:1.66, h:0.10,
      fontSize:5.8, color:C.accent, charSpace:0.75
    });
    addText(slide, s.guidance || s.coreTitle || '下季度边界', {
      x:core.x+0.28, y:core.y+0.82, w:1.70, h:0.24,
      fontSize:13.8, bold:true, color:C.white, fit:'shrink'
    });
    const assumptionList = assumptions.length ? assumptions : rows.slice(0, 3).map(r => `${r[0]} 不越过预警阈值`);
    assumptionList.slice(0, 3).forEach((item, i) => {
      const y = core.y + 1.52 + i * 0.62;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addNumber(slide, String(i + 1).padStart(2, '0'), {
        x:core.x+0.30, y:y+0.02, w:0.28, h:0.09,
        fontSize:6.0, color:accent
      });
      addText(slide, itemTitle(item, `假设 ${i+1}`), {
        x:core.x+0.72, y, w:1.46, h:0.15,
        fontSize:8.2, color:C.captionOnImage, fit:'shrink'
      });
    });
    addHairline(slide, core.x+0.30, core.y+3.42, 0.82, C.accent, 0, 0.58);
    addText(slide, s.note || '每项风险必须有触发条件和处置动作。', {
      x:core.x+0.30, y:core.y+3.68, w:1.74, h:0.15,
      fontSize:6.9, color:C.darkMuted || 'A8B3C3', fit:'shrink'
    });
  }

  return {
    drawGuidanceAssumptionCore
  };
}

module.exports = {
  createGuidanceAssumptionCore
};
