function createRiskBoardGovernanceTableGrid(ctx = {}) {
  const C = ctx.colors();
  const {
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function peopleGovernanceCadence(name = '', level = '') {
    const text = String(name || '');
    if (/授权|照片|肖像|素材/i.test(text)) return '外发前校对';
    if (/口号|价值观|承诺|薪酬|福利|成长/i.test(text)) return '岗位上线前';
    if (/联系人|官网|邮箱|信息/i.test(text)) return '发布前补全';
    if (level === '高') return '发出前确认';
    if (level === '低') return '月度巡检';
    return '周度复盘';
  }

  function peopleGovernanceAction(name = '', body = '') {
    const text = String(name || '');
    let prefix = '招聘动作';
    if (/授权|照片|肖像|素材/i.test(text)) prefix = '授权动作';
    else if (/口号|价值观|承诺|薪酬|福利|成长/i.test(text)) prefix = '口径动作';
    else if (/联系人|官网|邮箱|信息/i.test(text)) prefix = '信息动作';
    return `${prefix}：${body || '补齐可对外表达的校准动作。'}`;
  }

  function clampCopy(text = '', max = 42) {
    const raw = String(text || '').trim();
    if (raw.length <= max) return raw;
    return `${raw.slice(0, Math.max(0, max - 1)).trim()}…`;
  }

  function drawGovernanceActionTable(slide, plan, rows, table) {
    const isPeopleCulture = plan && plan.industry === 'people-culture-company';
    const widePeople = isPeopleCulture && table.w >= 9.5;
    const columns = widePeople
      ? [
        { label:'外发风险', x:0.36, w:2.44, color:C.accent },
        { label:'校准节点', x:3.16, w:1.08, color:C.cyan },
        { label:'招聘动作', x:4.78, w:Math.max(3.90, table.w - 5.18), color:C.violet }
      ]
      : [
        { label:isPeopleCulture ? '外发风险' : '责任', x:0.28, w:1.70, color:C.accent },
        { label:isPeopleCulture ? '校准节点' : '节奏', x:2.38, w:0.86, color:C.cyan },
        { label:isPeopleCulture ? '招聘动作' : '应对动作', x:3.62, w:3.70, color:C.violet }
      ];
    addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.46}
    });
    columns.forEach(h => addText(slide, h.label, {
      x:table.x+h.x, y:table.y+0.27, w:h.w, h:0.14,
      fontSize:8.8, bold:true, color:h.color, fit:'shrink'
    }));
    rows.forEach((r, i) => {
      const rowStart = widePeople ? 0.64 : 0.72;
      const rowPitch = widePeople ? 0.62 : 0.74;
      const rowHeight = widePeople ? 0.50 : 0.56;
      const y = table.y + rowStart + i * rowPitch;
      const name = Array.isArray(r) ? r[0] : itemTitle(r, `治理事项 ${i+1}`);
      const level = Array.isArray(r) ? r[1] : (r.level || '');
      const body = Array.isArray(r) ? r[2] : itemBody(r);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
      addRect(slide, table.x+0.18, y-0.08, table.w-0.36, rowHeight, i === 0 ? 'FFFFFF' : panelFill(), C.line, {
        fill:{color:i === 0 ? 'FFFFFF' : panelFill(), transparency:0},
        line:{color:i === 0 ? accent : C.line, transparency:i === 0 ? 20 : 18, width:0.34}
      });
      addText(slide, name, {
        x:table.x+columns[0].x, y:y+0.02, w:columns[0].w, h:0.26,
        fontSize:8.4, bold:true, color:C.text, fit:false, breakLine:true
      });
      const cadenceText = isPeopleCulture
        ? peopleGovernanceCadence(name, level)
        : (level === '高' ? '季度审议' : (level === '低' ? '年度留痕' : '月度复盘'));
      addText(slide, cadenceText, {
        x:table.x+columns[1].x, y:y+0.08, w:columns[1].w, h:0.14,
        fontSize:7.4, color:accent, fit:false
      });
      const actionText = isPeopleCulture
        ? peopleGovernanceAction(name, body)
        : (body || '保留来源、授权和过程记录。');
      addText(slide, widePeople ? clampCopy(actionText, 32) : actionText, {
        x:table.x+columns[2].x, y:y+0.02, w:columns[2].w, h:0.30,
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
