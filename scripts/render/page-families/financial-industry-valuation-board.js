function createValuationSensitivityBoard(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;

  function renderValuationSensitivityBoard(slide, s, board) {
    const rows = (s.valuationSensitivity && s.valuationSensitivity.rows) || s.rows || ['低增长','基准','高增长'];
    const cols = (s.valuationSensitivity && s.valuationSensitivity.cols) || ['低退出倍数','基准','高退出倍数'];
    const values = (s.valuationSensitivity && s.valuationSensitivity.values) || [[12,16,19],[15,20,24],[18,23,29]];
    addLabel(slide, 'IRR / EXIT SCENARIO', { x:board.x+0.30, y:board.y+0.32, w:1.72, h:0.10, fontSize:6.8, color:C.accent, charSpace:0.8 });
    rows.slice(0,3).forEach((r,ri)=>{
      addText(slide, String(r), { x:board.x+0.34, y:board.y+1.00+ri*0.78, w:1.06, h:0.16, fontSize:8.8, bold:true, color:C.body, fit:'shrink' });
      cols.slice(0,3).forEach((c,ci)=>{
        if (ri===0) addText(slide, String(c), { x:board.x+1.70+ci*1.52, y:board.y+0.64, w:1.02, h:0.16, fontSize:8.8, color:C.muted, align:'center', fit:'shrink' });
        const v = (values[ri] && values[ri][ci]) || 0;
        const color = v >= 23 ? C.cyan : (v <= 14 ? C.risk : C.accent);
        addRect(slide, board.x+1.62+ci*1.52, board.y+0.92+ri*0.78, 1.18, 0.46, color, color, { fill:{color, transparency:v>=23?8:18}, line:{color, transparency:100} });
        addText(slide, `${v}%`, { x:board.x+1.62+ci*1.52, y:board.y+1.06+ri*0.78, w:1.18, h:0.12, fontSize:9.0, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink' });
      });
    });
  }

  return {
    renderValuationSensitivityBoard
  };
}

module.exports = {
  createValuationSensitivityBoard
};
