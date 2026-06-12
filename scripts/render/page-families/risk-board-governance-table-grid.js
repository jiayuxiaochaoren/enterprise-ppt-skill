function createRiskBoardGovernanceTableGrid(ctx = {}) {
  const C = ctx.colors();
  const {
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawGovernanceActionTable(slide, rows, table) {
    const headers = [
      { label:'责任', x:0.28, w:1.70, color:C.accent },
      { label:'节奏', x:2.38, w:0.86, color:C.cyan },
      { label:'应对动作', x:3.62, w:3.70, color:C.violet }
    ];
    addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.46}
    });
    headers.forEach(h => addText(slide, h.label, {
      x:table.x+h.x, y:table.y+0.27, w:h.w, h:0.14,
      fontSize:8.8, bold:true, color:h.color, fit:'shrink'
    }));
    rows.forEach((r, i) => {
      const y = table.y + 0.72 + i * 0.74;
      const name = Array.isArray(r) ? r[0] : itemTitle(r, `治理事项 ${i+1}`);
      const level = Array.isArray(r) ? r[1] : (r.level || '');
      const body = Array.isArray(r) ? r[2] : itemBody(r);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
      addRect(slide, table.x+0.18, y-0.08, table.w-0.36, 0.56, i === 0 ? 'FFFFFF' : panelFill(), C.line, {
        fill:{color:i === 0 ? 'FFFFFF' : panelFill(), transparency:0},
        line:{color:i === 0 ? accent : C.line, transparency:i === 0 ? 20 : 18, width:0.34}
      });
      addText(slide, name, {
        x:table.x+0.28, y:y+0.02, w:1.72, h:0.26,
        fontSize:8.4, bold:true, color:C.text, fit:false, breakLine:true
      });
      addText(slide, level === '高' ? '季度审议' : (level === '低' ? '年度留痕' : '月度复盘'), {
        x:table.x+2.38, y:y+0.08, w:0.86, h:0.14,
        fontSize:7.4, color:accent, fit:false
      });
      addText(slide, body || '保留来源、授权和过程记录。', {
        x:table.x+3.62, y:y+0.02, w:3.74, h:0.30,
        fontSize:7.8, color:C.body, fit:false, breakLine:true, valign:'top'
      });
    });
  }

  return {
    drawGovernanceActionTable
  };
}

module.exports = {
  createRiskBoardGovernanceTableGrid
};
