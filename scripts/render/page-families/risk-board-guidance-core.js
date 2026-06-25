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

  function drawGuidanceAssumptionCore(slide, plan, s, rows, assumptions, core) {
    addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    const isFinance = plan && plan.industry === 'finance-investment';
    const isLifestyle = plan && plan.industry === 'lifestyle-food-tourism-fashion';
    addLabel(slide, isFinance ? '预算边界' : (isLifestyle ? '场景边界' : 'GUIDANCE ASSUMPTIONS'), {
      x:core.x+0.28, y:core.y+0.34, w:isFinance ? 1.12 : 1.66, h:0.10,
      fontSize:5.8, color:C.accent, charSpace:(isFinance || isLifestyle) ? 0 : 0.75
    });
    addText(slide, s.guidance || s.coreTitle || (isLifestyle ? '体验增长边界' : '下季度边界'), {
      x:core.x+0.28, y:core.y+0.82, w:1.70, h:0.24,
      fontSize:isFinance ? 13.2 : 13.8, bold:true, color:C.white, fit:'shrink'
    });
    const assumptionList = assumptions.length ? assumptions : rows.slice(0, 3).map(r => `${r[0]} 不越过预警阈值`);
    assumptionList.slice(0, 3).forEach((item, i) => {
      const y = core.y + 1.52 + i * 0.62;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      if (isFinance) {
        addRect(slide, core.x+0.24, y-0.08, 2.16, 0.42, C.ink2 || '111827', accent, {
          fill:{ color:C.ink2 || '111827', transparency:i === 0 ? 0 : 10 },
          line:{ color:accent, transparency:42, width:0.28 }
        });
        addLabel(slide, `边界 0${i+1}`, {
          x:core.x+0.34, y:y+0.08, w:0.44, h:0.08, fontSize:5.0, color:accent, charSpace:0
        });
        addText(slide, itemTitle(item, `假设 ${i+1}`), {
          x:core.x+0.88, y:y+0.04, w:1.30, h:0.12,
          fontSize:7.4, color:C.captionOnImage, fit:'shrink'
        });
      } else if (isLifestyle) {
        addRect(slide, core.x+0.24, y-0.06, 2.18, 0.38, C.ink2 || '111827', accent, {
          fill:{ color:C.ink2 || '111827', transparency:i === 0 ? 0 : 10 },
          line:{ color:accent, transparency:46, width:0.28 }
        });
        addLabel(slide, `边界 0${i+1}`, {
          x:core.x+0.34, y:y+0.08, w:0.44, h:0.08, fontSize:5.0, color:accent, charSpace:0
        });
        addText(slide, itemTitle(item, `假设 ${i+1}`), {
          x:core.x+0.88, y:y+0.04, w:1.26, h:0.12,
          fontSize:7.2, color:C.captionOnImage, fit:'shrink'
        });
      } else {
        addNumber(slide, String(i + 1).padStart(2, '0'), {
          x:core.x+0.30, y:y+0.02, w:0.28, h:0.09,
          fontSize:6.0, color:accent
        });
        addText(slide, itemTitle(item, `假设 ${i+1}`), {
          x:core.x+0.72, y, w:1.46, h:0.15,
          fontSize:8.2, color:C.captionOnImage, fit:'shrink'
        });
      }
    });
    if (isFinance) {
      ['预算', '现金', '毛利'].forEach((item, i) => {
        const x = core.x + 0.30 + i * 0.72;
        const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
        addRect(slide, x, core.y+3.38, 0.54, 0.20, accent, accent, {
          fill:{ color:accent, transparency:20 },
          line:{ color:accent, transparency:100 }
        });
        addLabel(slide, item, { x:x+0.08, y:core.y+3.44, w:0.38, h:0.06, fontSize:4.8, color:accent, charSpace:0 });
      });
      addText(slide, s.note || '预算、现金和毛利三条边界必须同步监控。', {
        x:core.x+0.30, y:core.y+3.72, w:1.78, h:0.16,
        fontSize:6.8, color:C.darkMuted || 'A8B3C3', fit:'shrink'
      });
    } else if (isLifestyle) {
      addHairline(slide, core.x+0.30, core.y+3.42, 0.82, C.accent, 0, 0.58);
      addText(slide, s.note || '高峰容量、商户质量和品牌调性必须一起守住。', {
        x:core.x+0.30, y:core.y+3.68, w:1.74, h:0.15,
        fontSize:6.9, color:C.darkMuted || 'A8B3C3', fit:'shrink'
      });
    } else {
      addHairline(slide, core.x+0.30, core.y+3.42, 0.82, C.accent, 0, 0.58);
      addText(slide, s.note || '每项风险必须有触发条件和处置动作。', {
        x:core.x+0.30, y:core.y+3.68, w:1.74, h:0.15,
        fontSize:6.9, color:C.darkMuted || 'A8B3C3', fit:'shrink'
      });
    }
  }

  return {
    drawGuidanceAssumptionCore
  };
}

module.exports = {
  createGuidanceAssumptionCore
};
