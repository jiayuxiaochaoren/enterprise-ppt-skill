function createRiskBoardTableRenderer(ctx = {}, deps = {}) {
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = deps;
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill
  } = ctx;

  return function riskTable(slide, plan, s, idx) {
    // Governance board family: readable risks, severity, and concrete response actions.
    drawRiskLightHeader(slide, s, idx, { kicker:'GOVERNANCE BOARD', titleW:5.2, subtitleW:6.2 });
    const rows = (s.rows || []).slice(0,4);
    const levels = {
      '高': { color:C.risk || 'EF4444', label:'HIGH', zh:'高' },
      '中': { color:C.accent, label:'MEDIUM', zh:'中' },
      '低': { color:C.cyan, label:'LOW', zh:'低' }
    };
    const highCount = rows.filter(r=>r[1]==='高').length;
    const medCount = rows.filter(r=>r[1]==='中').length;
    addRect(slide, 0.92, 2.06, 3.18, 3.96, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'RISK READINESS', { x:1.22, y:2.42, w:1.38, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, '治理优先级', { x:1.22, y:2.78, w:1.42, h:0.18, fontSize:13.2, bold:true, color:C.white, fit:'shrink' });
    addNumber(slide, String(highCount), { x:1.20, y:3.38, w:0.74, h:0.48, fontSize:34, color:C.risk || C.accent, fit:'shrink' });
    addText(slide, '高优先级风险', { x:2.10, y:3.58, w:1.12, h:0.14, fontSize:8.0, color:C.captionOnImage, fit:'shrink' });
    addNumber(slide, String(medCount), { x:1.22, y:4.25, w:0.62, h:0.34, fontSize:23, color:C.accent, fit:'shrink' });
    addText(slide, '需要持续跟踪', { x:2.10, y:4.38, w:1.20, h:0.14, fontSize:8.0, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 1.22, 5.08, 0.82, C.accent, 0, 0.62);
    addText(slide, '风险页优先呈现责任、处置和节奏，不把风险压成难读矩阵。', { x:1.22, y:5.38, w:2.10, h:0.28, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink', breakLine:true });

    addLabel(slide, 'CONTROL ACTIONS', { x:4.58, y:2.12, w:1.36, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addHairline(slide, 4.58, 2.42, 6.64, C.line, 14, 0.55);
    rows.forEach((r,i)=>{
      const [risk, level, response] = r;
      const meta = levels[level] || levels['中'];
      const y = 2.68 + i*0.78;
      addRect(slide, 4.58, y, 6.82, 0.58, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:i===1?0:8},
        line:{color:i===1?meta.color:C.line, transparency:i===1?24:14, width:i===1?0.55:0.42}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:4.86, y:y+0.20, w:0.32, h:0.10, fontSize:6.8, color:meta.color });
      addText(slide, risk, { x:5.36, y:y+0.14, w:1.80, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
      addRect(slide, 7.46, y+0.18, 0.76, 0.20, meta.color, meta.color, { fill:{color:meta.color, transparency:8}, line:{color:meta.color, transparency:100} });
      addText(slide, meta.zh, { x:7.46, y:y+0.18, w:0.76, h:0.20, fontSize:6.2, bold:true, color:C.onAccent || C.white, align:'center', valign:'mid', fit:'shrink', margin:0 });
      addText(slide, response || '明确责任人与处置节奏。', { x:8.56, y:y+0.14, w:2.34, h:0.15, fontSize:8.2, color:C.body, fit:'shrink' });
    });
    addRect(slide, 4.58, 5.92, 6.82, 0.46, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.42} });
    addText(slide, '保障机制', { x:4.86, y:6.08, w:0.86, h:0.12, fontSize:8.3, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.note || '以数据责任、跨部门协同、分批集成和上线培训构成风险闭环。', { x:5.96, y:6.06, w:4.72, h:0.14, fontSize:7.8, color:C.body, fit:'shrink' });
    drawRiskBoardFooter(slide, plan, { color:'738297' });
  };
}

module.exports = {
  createRiskBoardTableRenderer
};
