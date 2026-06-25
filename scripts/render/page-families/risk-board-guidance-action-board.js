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

  function financeBoundarySignal(risk = '', level = '') {
    const text = String(risk || '');
    if (/回款|现金|账期|应收/i.test(text)) return '回款偏离计划即预警';
    if (/毛利|利润|成本|费用/i.test(text)) return '毛利跌破红线即复盘';
    if (/需求|订单|收入|销量|签约/i.test(text)) return '订单低于预算即跟踪';
    if (/投放|营销/i.test(text)) return '投放超预算即收缩';
    return level === '高' ? '偏离边界即上会' : '接近阈值先跟踪';
  }

  function financeActionCopy(risk = '', action = '') {
    const text = String(risk || '');
    let prefix = '预算动作';
    if (/回款|现金|账期|应收/i.test(text)) prefix = '现金动作';
    else if (/毛利|利润|成本|费用/i.test(text)) prefix = '利润动作';
    else if (/需求|订单|收入|销量|签约/i.test(text)) prefix = '订单动作';
    return `${prefix}：${action || '同步预算、现金和毛利联动动作。'}`;
  }

  function lifestyleTriggerCopy(risk = '', level = '') {
    const text = String(risk || '');
    if (/客流|拥堵|排队|高峰/i.test(text)) return '高峰超阈值即限流';
    if (/商户|服务|质量/i.test(text)) return '评分下滑即复核';
    if (/内容|调性|品牌|传播/i.test(text)) return '内容偏题即收口';
    if (/天气|降雨|高温|台风/i.test(text)) return '天气突变即切预案';
    return level === '高' ? '触发红线即升级' : '偏离体验阈值即跟踪';
  }

  function lifestyleActionCopy(risk = '', action = '') {
    const text = String(risk || '');
    let prefix = '现场动作';
    if (/客流|拥堵|排队|高峰/i.test(text)) prefix = '限流动作';
    else if (/商户|服务|质量/i.test(text)) prefix = '商户动作';
    else if (/内容|调性|品牌|传播/i.test(text)) prefix = '内容动作';
    else if (/天气|降雨|高温|台风/i.test(text)) prefix = '预案动作';
    return `${prefix}：${action || '明确现场负责人和补救动作。'}`;
  }

  function drawGuidanceRiskActionBoard(slide, plan, rows, board) {
    const isFinance = plan && plan.industry === 'finance-investment';
    const isLifestyle = plan && plan.industry === 'lifestyle-food-tourism-fashion';
    const financeWide = isFinance && board.w >= 9.5;
    const lifestyleWide = isLifestyle && board.w >= 9.5;
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
    const activeColumns = !isFinance && isLifestyle
      ? {
        riskX:0.36,
        riskW:1.58,
        triggerX:2.36,
        triggerW:1.44,
        actionX:4.18,
        actionW:2.74
      }
      : columns;
    const wideLifestyleColumns = lifestyleWide
      ? {
        riskX:0.36,
        riskW:2.20,
        triggerX:3.08,
        triggerW:1.62,
        actionX:5.04,
        actionW:Math.max(4.10, board.w - 5.40)
      }
      : activeColumns;
    const usedColumns = lifestyleWide ? wideLifestyleColumns : activeColumns;
    const rowStep = lifestyleWide ? 0.54 : 0.72;
    const rowHeight = lifestyleWide ? 0.46 : 0.58;
    const actionMax = isFinance ? 44 : (lifestyleWide ? 42 : 32);
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.46}
    });
    (isFinance ? ['边界事项', '监测信号', '管理动作'] : (isLifestyle ? ['场景风险', '触发点', '现场动作'] : ['RISK', 'TRIGGER', 'OWNER / ACTION'])).forEach((label, i) => {
      const x = board.x + [0.30, usedColumns.triggerX - 0.06, usedColumns.actionX - 0.06][i];
      addLabel(slide, label, {
        x, y:board.y+0.30, w:i === 0 ? usedColumns.riskW : (i === 1 ? usedColumns.triggerW : usedColumns.actionW), h:0.09,
        fontSize:(isFinance || isLifestyle) ? 8.8 : 5.8, color:i === 0 ? C.risk : (i === 1 ? C.accent : C.cyan), charSpace:(isFinance || isLifestyle) ? 0 : 0.7
      });
    });
    rows.forEach((r, i) => {
      const risk = Array.isArray(r) ? r[0] : itemTitle(r);
      const level = Array.isArray(r) ? r[1] : (r.level || r.severity || '中');
      const action = Array.isArray(r) ? r[2] : itemBody(r);
      const y = board.y + 0.76 + i * rowStep;
      const accent = level === '高' ? C.risk : (level === '低' ? C.cyan : C.accent);
      addRect(slide, board.x+0.22, y-0.08, board.w-0.44, rowHeight, i === 0 ? 'FFFFFF' : panelFill(), C.line, {
        fill:{color:i === 0 ? 'FFFFFF' : panelFill(), transparency:0},
        line:{color:i === 0 ? accent : C.line, transparency:i === 0 ? 20 : 18, width:0.34}
      });
      addText(slide, risk || `风险 ${i+1}`, {
        x:board.x+usedColumns.riskX, y:y+0.06, w:usedColumns.riskW, h:0.13,
        fontSize:(isFinance || isLifestyle) ? 8.8 : 8.2, bold:true, color:C.text, fit:false
      });
      if (isFinance) {
        addRect(slide, board.x+columns.triggerX, y+0.02, Math.min(1.18, columns.triggerW), 0.18, accent, accent, {
          fill:{ color:accent, transparency:20 },
          line:{ color:accent, transparency:100 }
        });
        addText(slide, financeBoundarySignal(risk, level), {
          x:board.x+columns.triggerX+0.10, y:y+0.05, w:Math.max(0.86, columns.triggerW-0.20), h:0.10,
          fontSize:8.8, color:accent, fit:'shrink'
        });
      } else if (isLifestyle) {
        addText(slide, lifestyleTriggerCopy(risk, level), {
          x:board.x+usedColumns.triggerX, y:y+0.06, w:usedColumns.triggerW, h:0.13,
          fontSize:lifestyleWide ? 8.0 : 8.2, color:accent, fit:false
        });
      } else {
        addText(slide, level === '高' ? '触发后即升级' : '达到阈值后跟踪', {
          x:board.x+columns.triggerX, y:y+0.06, w:columns.triggerW, h:0.13,
          fontSize:8.0, color:accent, fit:false
        });
      }
      const actionCopy = isFinance
        ? financeActionCopy(risk, action)
        : (isLifestyle
          ? lifestyleActionCopy(risk, action)
          : (action || '明确责任人和处置节奏。'));
      addText(slide, compactEvidenceCaption(actionCopy, actionMax), {
        x:board.x+usedColumns.actionX, y:y+0.02, w:usedColumns.actionW, h:lifestyleWide ? 0.22 : 0.28,
        fontSize:(isFinance || isLifestyle) ? 8.4 : 8.1, color:C.body, fit:false, breakLine:true, valign:'mid'
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
