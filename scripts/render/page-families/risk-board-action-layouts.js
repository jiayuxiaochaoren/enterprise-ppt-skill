const {
  createRiskActionLoopRenderer
} = require('./risk-board-action-loop');

function createRiskBoardActionLayoutRenderers(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    itemTitle,
    panelFill
  } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const riskActionLoop = createRiskActionLoopRenderer(ctx, {
    drawRiskBoardFooter,
    drawRiskLightHeader
  });

  function riskControlStack(slide, plan, s, idx) {
    drawRiskLightHeader(slide, s, idx, { kicker:'CONTROL SYSTEM', fallbackTitle:'治理与保障体系', titleW:5.5 });
    const rows = (s.rows || []).slice(0,6);
    const rowTitle = (row, fallback) => Array.isArray(row) ? (row[0] || fallback) : itemTitle(row, fallback);
    const rowLevel = row => Array.isArray(row) ? (row[1] || '') : (row.level || row.status || row.risk || '');
    const rowBody = row => Array.isArray(row) ? (row[2] || row[1] || '') : (row.body || row.note || row.description || '');
    addRect(slide, 0.92, 2.04, 3.00, 4.10, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'GOVERNANCE PRINCIPLE', { x:1.22, y:2.42, w:1.46, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '把风险写进日常机制', { x:1.22, y:2.90, w:1.86, h:0.28, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || '以责任、时限、证据和复盘构成治理闭环。', { x:1.22, y:3.54, w:1.82, h:0.48, fontSize:8.2, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, 1.22, 4.52, 0.78, C.accent, 0, 0.68);
    addText(slide, s.note || '制度、控制动作和复盘节奏放在同一张治理页中。', { x:1.22, y:4.92, w:1.86, h:0.38, fontSize:7.0, color:C.darkMuted, breakLine:true, fit:'shrink' });
    const fallbackRows = [
      { title:'责任机制', level:'明确', body:'明确责任人与执行节奏。' },
      { title:'过程控制', level:'跟踪', body:'把关键控制动作纳入日常检查。' },
      { title:'复盘保障', level:'闭环', body:'用证据复盘风险处理结果。' }
    ];
    const cards = (rows.length ? rows : fallbackRows).slice(0,3);
    const colors = [C.accent, C.cyan, C.violet || C.accent];
    cards.forEach((r,i)=>{
      const x = 4.30 + i*2.54;
      const color = colors[i];
      addRect(slide, x, 2.20, 2.20, 3.18, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?color:C.line, transparency:i===0?18:16, width:0.50} });
      addRect(slide, x, 2.20, 2.20, 0.05, color, color, { line:{color, transparency:100} });
      addLabel(slide, `CONTROL 0${i+1}`, { x:x+0.24, y:2.52, w:0.94, h:0.09, fontSize:5.4, color, charSpace:0.75 });
      const level = rowLevel(r);
      if (level) {
        addRect(slide, x+1.42, 2.43, 0.62, 0.30, color, color, { fill:{color, transparency:8}, line:{color, transparency:38, width:0.35} });
        addText(slide, level, { x:x+1.42, y:2.48, w:0.62, h:0.20, fontSize:8.6, bold:true, color:C.white, align:'center', valign:'mid', fit:false });
      }
      addText(slide, rowTitle(r, `机制 ${i+1}`), { x:x+0.24, y:2.92, w:1.62, h:0.24, fontSize:12.0, bold:true, color:C.text, fit:'shrink' });
      addHairline(slide, x+0.24, 3.36, 0.64, color, 0, 0.62);
      addText(slide, rowBody(r) || '明确责任人与执行节奏。', { x:x+0.24, y:3.72, w:1.66, h:0.78, fontSize:8.8, color:C.body, breakLine:true, valign:'top', fit:false });
    });
    const overflow = rows.slice(3,4)[0];
    if (overflow) {
      const text = `${rowTitle(overflow, '补充信号')}：${rowBody(overflow) || rowLevel(overflow)}`;
      addRect(slide, 4.30, 5.68, 7.28, 0.48, C.softBlue || 'EEF5FF', C.line, { fill:{color:C.softBlue || 'EEF5FF', transparency:8}, line:{color:C.line, transparency:28, width:0.42} });
      addText(slide, text, { x:4.56, y:5.80, w:6.70, h:0.20, fontSize:8.4, color:C.body, breakLine:true, valign:'mid', fit:false });
    }
    drawRiskBoardFooter(slide, plan);
  }

  return {
    riskControlStack,
    riskActionLoop
  };
}

module.exports = {
  createRiskBoardActionLayoutRenderers
};
