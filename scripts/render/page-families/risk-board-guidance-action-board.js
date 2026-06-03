function createGuidanceRiskActionBoard(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText,
    compactEvidenceCaption,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawGuidanceRiskActionBoard(slide, rows, board) {
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.46}
    });
    ['RISK', 'TRIGGER', 'OWNER / ACTION'].forEach((label, i) => {
      const x = board.x + [0.30, 2.24, 4.08][i];
      addLabel(slide, label, {
        x, y:board.y+0.30, w:i === 2 ? 1.58 : 0.96, h:0.09,
        fontSize:5.8, color:i === 0 ? C.risk : (i === 1 ? C.accent : C.cyan), charSpace:0.7
      });
    });
    rows.forEach((r, i) => {
      const risk = Array.isArray(r) ? r[0] : itemTitle(r);
      const level = Array.isArray(r) ? r[1] : (r.level || r.severity || '中');
      const action = Array.isArray(r) ? r[2] : itemBody(r);
      const y = board.y + 0.76 + i * 0.72;
      const accent = level === '高' ? C.risk : (level === '低' ? C.cyan : C.accent);
      addRect(slide, board.x+0.22, y-0.08, board.w-0.44, 0.58, i === 0 ? 'FFFFFF' : panelFill(), C.line, {
        fill:{color:i === 0 ? 'FFFFFF' : panelFill(), transparency:0},
        line:{color:i === 0 ? accent : C.line, transparency:i === 0 ? 20 : 18, width:0.34}
      });
      addText(slide, risk || `风险 ${i+1}`, {
        x:board.x+0.36, y:y+0.06, w:1.46, h:0.13,
        fontSize:8.2, bold:true, color:C.text, fit:false
      });
      addText(slide, level === '高' ? '触发后即升级' : '达到阈值后跟踪', {
        x:board.x+2.30, y:y+0.06, w:1.34, h:0.13,
        fontSize:8.0, color:accent, fit:false
      });
      addText(slide, compactEvidenceCaption(action || '明确责任人和处置节奏。', 32), {
        x:board.x+4.14, y:y+0.02, w:2.46, h:0.28,
        fontSize:8.1, color:C.body, fit:false, breakLine:true, valign:'mid'
      });
    });
  }

  return {
    drawGuidanceRiskActionBoard
  };
}

module.exports = {
  createGuidanceRiskActionBoard
};
