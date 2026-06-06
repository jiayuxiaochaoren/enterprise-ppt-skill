function createManufacturingOeeDecomposition(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  const pctWidth = (value, max=2.30) => {
    const num = Number(String(value || '').replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(num)) return max * 0.56;
    return Math.max(0.28, Math.min(max, max * Math.min(100, Math.abs(num)) / 100));
  };

  function renderOeeDecomposition(slide, components) {
    const board = { x:4.28, y:2.10, w:4.24, h:3.92 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'OEE DECOMPOSITION', { x:board.x+0.28, y:board.y+0.32, w:1.70, h:0.12, fontSize:6.8, color:C.accent, charSpace:0.8 });
    components.forEach((m,i)=>{
      const y = board.y + 0.88 + i*0.86;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:board.x+0.30, y:y+0.02, w:0.30, h:0.12, fontSize:6.8, color:accent });
      addText(slide, m.label || `构成 ${i+1}`, { x:board.x+0.72, y:y-0.04, w:0.98, h:0.16, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addNumber(slide, m.value || '—', { x:board.x+3.06, y:y-0.06, w:0.68, h:0.16, fontSize:11.2, color:accent, align:'right', fit:'shrink' });
      addRect(slide, board.x+0.72, y+0.30, 2.36, 0.055, C.line, C.line, { line:{color:C.line, transparency:100} });
      addRect(slide, board.x+0.72, y+0.30, pctWidth(m.value, 2.36), 0.055, accent, accent, { line:{color:accent, transparency:100} });
      addText(slide, m.body || m.note || '', { x:board.x+0.72, y:y+0.48, w:2.88, h:0.17, fontSize:8.8, color:C.body, fit:'shrink' });
    });
    addRect(slide, board.x+0.28, board.y+3.32, 3.52, 0.30, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    addText(slide, '停机原因、工单与策略回写。', { x:board.x+0.42, y:board.y+3.38, w:3.10, h:0.18, fontSize:8.8, color:C.body, fit:'shrink' });
  }

  return {
    renderOeeDecomposition
  };
}

module.exports = {
  createManufacturingOeeDecomposition
};
