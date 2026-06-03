function createRetailCohortStoryRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawRetailCohortStory(slide, cohort) {
    addLabel(slide, 'COHORT / PRODUCT STORY', { x:cohort.x, y:cohort.y, w:1.68, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7 });
    [
      ['NEW', '新客入会', C.accent],
      ['ACTIVE', '活跃会员', C.cyan],
      ['VIP', '高价值会员', C.violet]
    ].forEach((row,i)=>{
      const y = cohort.y + 0.52 + i*0.70;
      addRect(slide, cohort.x, y-0.05, 2.88, 0.42, i===1 ? C.ink : 'FFFFFF', C.line, {
        fill:{color:i===1 ? C.ink : 'FFFFFF', transparency:i===1 ? 0 : 0},
        line:{color:i===1 ? C.ink : C.line, transparency:i===1 ? 100 : 18, width:0.34}
      });
      addLabel(slide, row[0], { x:cohort.x+0.18, y:y+0.08, w:0.60, h:0.08, fontSize:6.8, color:row[2], charSpace:0.2 });
      addText(slide, row[1], { x:cohort.x+0.94, y:y+0.06, w:1.04, h:0.13, fontSize:8.9, bold:true, color:i===1 ? C.white : C.text, fit:'shrink' });
      addRect(slide, cohort.x+2.10, y+0.10, 0.58, 0.045, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, cohort.x+2.10, y+0.10, [0.34,0.48,0.54][i], 0.045, row[2], row[2], { line:{color:row[2], transparency:100} });
    });
  }

  return {
    drawRetailCohortStory
  };
}

module.exports = {
  createRetailCohortStoryRenderer
};
