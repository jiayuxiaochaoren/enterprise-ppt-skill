function createPortfolioAllocationSummary(ctx = {}) {
  const C = ctx.colors();

  function drawPortfolioAllocationSummary(slide, s, rows, summary) {
    ctx.addRect(slide, summary.x, summary.y, summary.w, summary.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    ctx.addLabel(slide, 'ALLOCATION VIEW', {
      x:summary.x+0.28, y:summary.y+0.34, w:1.46, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8
    });
    const total = rows.reduce((sum,r)=>sum+(Number(r.weight) || 0), 0) || 100;
    rows.slice(0,4).forEach((r,i)=>{
      const y = summary.y + 1.06 + i*0.58;
      const share = Math.max(0.18, Math.min(0.96, (Number(r.weight) || (25 - i*3)) / total * 2.4));
      const color = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      slide.addShape('ellipse', {
        x:summary.x+0.34, y:y+0.05, w:0.10, h:0.10, fill:{color}, line:{color, transparency:100}
      });
      ctx.addText(slide, r.theme || r.name || `组合 ${i+1}`, {
        x:summary.x+0.58, y:y, w:1.10, h:0.12, fontSize:6.8, bold:true, color:C.white, fit:'shrink'
      });
      ctx.addText(slide, `${r.weight || ''}%`, {
        x:summary.x+2.00, y:y, w:0.40, h:0.12, fontSize:6.8, color:'A8B3C3', align:'right', fit:'shrink'
      });
      ctx.addRect(slide, summary.x+0.58, y+0.28, 1.58, 0.035, '334155', '334155', {
        line:{color:'334155', transparency:100}
      });
      ctx.addRect(slide, summary.x+0.58, y+0.28, share, 0.035, color, color, {
        line:{color, transparency:100}
      });
    });
    ctx.addHairline(slide, summary.x+0.32, summary.y+3.42, 0.82, C.accent, 0, 0.56);
    ctx.addText(slide, s.summary || '按主题、风险和现金回收能力决定下一阶段配置动作。', {
      x:summary.x+0.32, y:summary.y+3.58, w:1.94, h:0.22, fontSize:6.8, color:'A8B3C3', fit:'shrink'
    });
  }

  return {
    drawPortfolioAllocationSummary
  };
}

module.exports = {
  createPortfolioAllocationSummary
};
