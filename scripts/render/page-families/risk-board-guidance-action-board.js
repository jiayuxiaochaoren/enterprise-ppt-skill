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

  function drawGuidanceRiskActionBoard(slide, plan, rows, board) {
    const isFinance = plan && plan.industry === 'finance-investment';
    const financeWide = isFinance && board.w >= 9.5;
    const columns = financeWide
      ? {
        riskX:0.36,
        riskW:2.36,
        triggerX:3.18,
        triggerW:1.52,
        actionX:5.18,
        actionW:Math.max(3.10, board.w - 5.58)
      }
      : {
        riskX:0.36,
        riskW:1.46,
        triggerX:2.30,
        triggerW:1.34,
        actionX:4.14,
        actionW:2.46
      };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.46}
    });
    (isFinance ? ['风险事项', '触发阈值', '管理动作'] : ['RISK', 'TRIGGER', 'OWNER / ACTION']).forEach((label, i) => {
      const x = board.x + [0.30, columns.triggerX - 0.06, columns.actionX - 0.06][i];
      addLabel(slide, label, {
        x, y:board.y+0.30, w:i === 0 ? columns.riskW : (i === 1 ? columns.triggerW : columns.actionW), h:0.09,
        fontSize:isFinance ? 8.8 : 5.8, color:i === 0 ? C.risk : (i === 1 ? C.accent : C.cyan), charSpace:isFinance ? 0 : 0.7
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
        x:board.x+columns.riskX, y:y+0.06, w:columns.riskW, h:0.13,
        fontSize:isFinance ? 8.8 : 8.2, bold:true, color:C.text, fit:false
      });
      if (isFinance) {
        addRect(slide, board.x+columns.triggerX, y+0.02, Math.min(1.18, columns.triggerW), 0.18, accent, accent, {
          fill:{ color:accent, transparency:20 },
          line:{ color:accent, transparency:100 }
        });
        addText(slide, level === '高' ? '立即升级' : '达到阈值跟踪', {
          x:board.x+columns.triggerX+0.10, y:y+0.05, w:Math.max(0.86, columns.triggerW-0.20), h:0.10,
          fontSize:8.8, color:accent, fit:'shrink'
        });
      } else {
        addText(slide, level === '高' ? '触发后即升级' : '达到阈值后跟踪', {
          x:board.x+columns.triggerX, y:y+0.06, w:columns.triggerW, h:0.13,
          fontSize:8.0, color:accent, fit:false
        });
      }
      addText(slide, compactEvidenceCaption(action || '明确责任人和处置节奏。', 32), {
        x:board.x+columns.actionX, y:y+0.02, w:columns.actionW, h:0.28,
        fontSize:isFinance ? 8.8 : 8.1, color:C.body, fit:false, breakLine:true, valign:'mid'
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
