function createRetailCohortStoryRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;

  function numericValue(metric = {}) {
    const num = Number(String(metric.value || '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(num) ? Math.abs(num) : 0;
  }

  function cohortRows(metrics = []) {
    const source = metrics.slice(1, 4);
    const fallback = [
      { label:'新品弱', value:'14', note:'商品' },
      { label:'出餐不稳', value:'13', note:'履约' },
      { label:'高峰排队', value:'13', note:'门店' }
    ];
    const list = source.length ? source : fallback;
    const tags = ['商品', '履约', '门店'];
    const colors = [C.accent, C.cyan, C.violet];
    const max = Math.max(...list.map(numericValue), 1);
    return list.map((metric, i) => ({
      tag: metric.note && metric.note !== '顾虑' ? metric.note : tags[i],
      label: metric.label || metric.title || fallback[i].label,
      color: colors[i],
      width: Math.max(0.22, Math.min(0.62, (numericValue(metric) / max) * 0.62))
    }));
  }

  function drawRetailCohortStory(slide, cohort, metrics = []) {
    addLabel(slide, '问题分层', { x:cohort.x, y:cohort.y, w:1.02, h:0.10, fontSize:6.4, color:C.accent, charSpace:0 });
    cohortRows(metrics).forEach((row,i)=>{
      const y = cohort.y + 0.52 + i*0.70;
      addRect(slide, cohort.x, y-0.05, 2.88, 0.42, i===1 ? C.ink : 'FFFFFF', C.line, {
        fill:{color:i===1 ? C.ink : 'FFFFFF', transparency:i===1 ? 0 : 0},
        line:{color:i===1 ? C.ink : C.line, transparency:i===1 ? 100 : 18, width:0.34}
      });
      addLabel(slide, row.tag, { x:cohort.x+0.18, y:y+0.12, w:0.60, h:0.10, fontSize:6.8, color:row.color, charSpace:0 });
      addText(slide, row.label, { x:cohort.x+0.94, y:y+0.10, w:1.04, h:0.15, fontSize:8.9, bold:true, color:i===1 ? C.white : C.text, fit:'shrink', valign:'mid' });
      addRect(slide, cohort.x+2.10, y+0.15, 0.62, 0.055, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, cohort.x+2.10, y+0.15, row.width, 0.055, row.color, row.color, { line:{color:row.color, transparency:100} });
    });
  }

  return {
    drawRetailCohortStory
  };
}

module.exports = {
  createRetailCohortStoryRenderer
};
