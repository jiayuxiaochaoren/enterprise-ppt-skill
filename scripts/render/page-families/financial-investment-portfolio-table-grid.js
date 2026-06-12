function createPortfolioActionTableGrid(ctx = {}) {
  const C = ctx.colors();

  function drawPortfolioActionTable(slide, rows, table) {
    ctx.addRect(slide, table.x, table.y, table.w, table.h, ctx.panelFill(), C.line, {
      fill:{color:ctx.panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.52}
    });
    const headers = ['主题', '权重', 'IRR', 'DPI', '风险', '动作'];
    const col = [0, 1.62, 2.54, 3.38, 4.20, 5.10];
    const colW = [1.40, 0.70, 0.62, 0.62, 0.76, 1.92];
    headers.forEach((h,i)=>ctx.addText(slide, h, {
      x:table.x+0.28+col[i], y:table.y+0.30, w:colW[i], h:0.15,
      fontSize:7.7, bold:true, color:i===0?C.accent:C.muted, fit:false
    }));
    ctx.addHairline(slide, table.x+0.24, table.y+0.66, table.w-0.48, C.line, 12, 0.45);
    rows.forEach((r,i)=>{
      const y = table.y + 0.96 + i*0.54;
      const riskColor = r.risk === '高' ? C.risk : (r.risk === '低' ? C.cyan : C.accent);
      ctx.addNumber(slide, String(i+1).padStart(2,'0'), {
        x:table.x+0.28, y:y, w:0.28, h:0.14, fontSize:7.3, color:i===0?C.accent:C.muted
      });
      ctx.addText(slide, r.theme || r.name || `主题 ${i+1}`, {
        x:table.x+0.66, y:y, w:1.16, h:0.14, fontSize:7.8, bold:true, color:C.text, fit:false
      });
      ctx.addText(slide, `${r.weight || '—'}%`, {
        x:table.x+1.88, y:y, w:0.52, h:0.14, fontSize:7.6, color:C.body, align:'right', fit:false
      });
      ctx.addText(slide, r.irr || '—', {
        x:table.x+2.78, y:y, w:0.48, h:0.14, fontSize:7.6, color:C.body, align:'right', fit:false
      });
      ctx.addText(slide, r.dpi || '—', {
        x:table.x+3.60, y:y, w:0.48, h:0.14, fontSize:7.6, color:C.body, align:'right', fit:false
      });
      ctx.addRect(slide, table.x+4.46, y-0.02, 0.54, 0.24, riskColor, riskColor, {
        fill:{color:riskColor, transparency:8},
        line:{color:riskColor, transparency:100}
      });
      ctx.addText(slide, r.risk || '中', {
        x:table.x+4.46, y:y+0.02, w:0.54, h:0.16,
        fontSize:7.2, bold:true, color:C.onAccent || C.white, align:'center', valign:'mid', fit:false
      });
      ctx.addText(slide, ctx.compactEvidenceCaption(r.action || '维持观察', 26), {
        x:table.x+5.34, y:y-0.01, w:1.88, h:0.24,
        fontSize:7.5, bold:true, color:C.text, fit:false, breakLine:true, valign:'mid'
      });
      ctx.addHairline(slide, table.x+0.24, y+0.34, table.w-0.48, C.line, 20, 0.30);
    });
  }

  return {
    drawPortfolioActionTable
  };
}

module.exports = {
  createPortfolioActionTableGrid
};
