const {
  assertRendererContext
} = require('../renderer-context');

function createRiskBoardRenderers(ctx = {}) {
  assertRendererContext(ctx, ['risk'], { label:'risk renderer context' });
  const C = ctx.colors();
  const {
    PageNumber,
    addClockwiseLoopConnectors,
    addDarkBreathingCircle,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption,
    footerText,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    sectionKicker,
    stageCanvas,
    variantOf
  } = ctx;

function riskMatrixSlide(slide, plan, s, idx) {
  const darkRisk = false;
  if (darkRisk) {
    stageCanvas(slide, { field:false });
    addDarkBreathingCircle(slide, 8.22, 0.22, 4.28, 2.40, C.accent);
    addRect(slide, 0.78, 1.88, 11.20, 4.92, C.ink2, C.darkLine || '334155', {
      fill:{color:C.ink2, transparency:20},
      line:{color:C.darkLine || '334155', transparency:68, width:0.36}
    });
  } else {
    lightCanvas(slide);
  }
  sectionKicker(slide, 'RISK MATRIX', 0.86, 0.72, darkRisk);
  addText(slide, s.title || '风险矩阵', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:darkRisk ? C.white : C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.3, h:0.20, fontSize:10.0, color:darkRisk ? (C.darkMuted || '94A3B8') : C.muted, fit:'shrink' });
  PageNumber(slide, idx);
  const rows = (s.rows || []).slice(0,6);
  const gate = { x:0.92, y:2.12, w:2.48, h:3.96 };
  const strongRiskGate = plan.industry === 'manufacturing-operations';
  const gateFill = strongRiskGate ? C.accent : (darkRisk ? (C.darkPanel || C.ink) : C.ink);
  const gateRail = strongRiskGate ? C.cyan : C.accent;
  addRect(slide, gate.x, gate.y, gate.w, gate.h, gateFill, gateFill, {
    fill:{color:gateFill, transparency:0},
    line:{color:gateFill, transparency:100}
  });
  addRect(slide, gate.x, gate.y, 0.08, gate.h, gateRail, gateRail, { fill:{color:gateRail, transparency:0}, line:{color:gateRail, transparency:100} });
  addLabel(slide, plan.industry === 'manufacturing-operations' ? '外发门禁' : 'CONTROL GATE', {
    x:gate.x+0.30, y:gate.y+0.34, w:1.08, h:0.10, fontSize:6.4, color:gateRail, charSpace:plan.industry === 'manufacturing-operations' ? 0 : 0.72
  });
  addText(slide, s.coreTitle || '先判风险优先级', {
    x:gate.x+0.30, y:gate.y+0.86, w:1.74, h:0.34, fontSize:15.2, bold:true, color:C.white, fit:'shrink'
  });
  addText(slide, s.coreBody || s.claim || '证书、授权、联系方式和公开边界先通过门禁，再进入外发展示。', {
    x:gate.x+0.30, y:gate.y+1.52, w:1.82, h:0.72, fontSize:8.2, color:C.captionOnImage, fit:'shrink', breakLine:true
  });
  addHairline(slide, gate.x+0.30, gate.y+2.72, 0.82, gateRail, 0, 0.66);
  addText(slide, 'CERT · AUTH · CONTACT', { x:gate.x+0.30, y:gate.y+3.06, w:1.56, h:0.10, fontSize:6.0, color:strongRiskGate ? C.darkText : (C.darkMuted || 'A8B3C3'), fit:'shrink' });

  const box = { x:3.78, y:2.14, w:3.78, h:3.74 };
  const panelColor = darkRisk ? (C.ink2 || C.ink) : panelFill();
  const lineColor = darkRisk ? (C.darkLine || '334155') : C.line;
  const mutedColor = darkRisk ? (C.darkMuted || '94A3B8') : C.muted;
  addRect(slide, box.x, box.y, box.w, box.h, panelColor, lineColor, { fill:{color:panelColor, transparency:darkRisk ? 0 : 0}, line:{color:lineColor, transparency:darkRisk ? 52 : 14, width:0.52} });
  addText(slide, '发生概率', { x:box.x+0.12, y:box.y+0.10, w:0.70, h:0.12, fontSize:7.0, color:mutedColor, fit:'shrink' });
  addText(slide, '业务影响', { x:box.x+box.w-0.82, y:box.y+box.h+0.10, w:0.74, h:0.12, fontSize:7.0, color:mutedColor, fit:'shrink', align:'right' });
  addHairline(slide, box.x+0.52, box.y+box.h-0.42, box.w-0.88, lineColor, darkRisk ? 42 : 4, 0.5);
  slide.addShape('line', { x:box.x+0.52, y:box.y+box.h-0.42, w:0, h:-box.h+0.76, line:{color:lineColor, transparency:darkRisk ? 42 : 4, width:0.5} });
  const highCount = rows.filter(r => r[1] === '高').length;
  const midCount = rows.filter(r => r[1] === '中' || !['高', '低'].includes(r[1])).length;
  const lowCount = rows.filter(r => r[1] === '低').length;
  const cells = [
    [box.x+0.48, box.y+2.34, 1.30, 0.88, C.cyan, '低影响 / 可监控', lowCount],
    [box.x+1.98, box.y+2.34, 1.30, 0.88, C.accent, '中影响 / 需响应', midCount],
    [box.x+0.48, box.y+1.22, 1.30, 0.88, C.accent, '高概率 / 需治理', 0],
    [box.x+1.98, box.y+1.22, 1.30, 0.88, C.risk, '高风险 / 优先处置', highCount]
  ];
  cells.forEach(([x,y,w,h,color,label,count],i)=>{
    const isHigh = i === 3;
    const fillTransparency = isHigh ? 76 : (count ? 84 : 91);
    addRect(slide, x, y, w, h, color, color, { fill:{color, transparency:darkRisk ? Math.max(42, fillTransparency - 18) : fillTransparency}, line:{color, transparency:isHigh?28:56, width:0.46} });
    addText(slide, label, { x:x+0.14, y:y+h-0.24, w:w-0.28, h:0.12, fontSize:6.8, color:darkRisk ? (isHigh ? 'FFE3E3' : C.white) : (isHigh ? C.risk : C.body), align:'left', fit:'shrink' });
    if (count) {
      slide.addShape('ellipse', { x:x+w-0.34, y:y+0.15, w:0.24, h:0.24, fill:{color}, line:{color:'FFFFFF', transparency:0, width:0.50} });
      addText(slide, String(count), { x:x+w-0.305, y:y+0.225, w:0.17, h:0.08, fontSize:5.5, bold:true, color:C.onAccent || 'FFFFFF', align:'center', fit:'shrink' });
    }
  });
  addLabel(slide, 'MITIGATION QUEUE', { x:8.04, y:2.18, w:1.36, h:0.10, fontSize:6.4, color:C.accent, charSpace:0.8 });
  rows.slice(0,4).forEach((r,i)=>{
    const y = 2.58 + i*0.70;
    const color = r[1] === '高' ? C.risk : (r[1] === '低' ? C.cyan : C.accent);
    addText(slide, String(i+1).padStart(2,'0'), { x:8.04, y:y+0.05, w:0.32, h:0.10, fontSize:6.8, bold:true, color });
    addText(slide, r[0], { x:8.54, y:y, w:1.54, h:0.14, fontSize:8.8, bold:true, color:darkRisk ? C.white : C.text, fit:'shrink' });
    addText(slide, r[2] || '明确责任人与处置节奏。', { x:10.16, y:y, w:1.42, h:0.13, fontSize:7.2, color:darkRisk ? (C.darkMuted || '94A3B8') : C.body, fit:'shrink' });
    addHairline(slide, 8.04, y+0.44, 3.64, lineColor, darkRisk ? 54 : 16, 0.38);
  });
  addRect(slide, 0.92, 6.32, 8.96, 0.30, darkRisk ? (C.ink2 || C.ink) : (C.panelAlt || C.softBlue), lineColor, { fill:{color:darkRisk ? (C.ink2 || C.ink) : (C.panelAlt || C.softBlue), transparency:darkRisk ? 0 : 16}, line:{color:lineColor, transparency:100} });
  addRect(slide, 0.92, 6.32, 1.08, 0.30, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
  addText(slide, s.note || '先判断风险优先级，再展开重点处置动作。', { x:2.18, y:6.40, w:7.24, h:0.10, fontSize:7.6, color:darkRisk ? (C.darkMuted || '94A3B8') : C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:darkRisk ? (C.darkMuted || '94A3B8') : C.muted });
}

function riskControlStack(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'CONTROL SYSTEM', 0.86, 0.72, false);
  addText(slide, s.title || '治理与保障体系', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.3, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const rows = (s.rows || []).slice(0,6);
  addRect(slide, 0.92, 2.04, 3.00, 4.10, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'GOVERNANCE PRINCIPLE', { x:1.22, y:2.42, w:1.46, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '把风险写进日常机制', { x:1.22, y:2.90, w:1.86, h:0.28, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || '以责任、时限、证据和复盘构成治理闭环。', { x:1.22, y:3.54, w:1.82, h:0.48, fontSize:8.2, color:C.captionOnImage, breakLine:true, fit:'shrink' });
  addHairline(slide, 1.22, 4.52, 0.78, C.accent, 0, 0.68);
  addText(slide, s.note || '制度、控制动作和复盘节奏放在同一张治理页中。', { x:1.22, y:4.92, w:1.86, h:0.38, fontSize:7.0, color:C.darkMuted, breakLine:true, fit:'shrink' });
  const groups = [
    { label:'责任机制', color:C.accent, rows:rows.filter((_,i)=>i%3===0) },
    { label:'过程控制', color:C.cyan, rows:rows.filter((_,i)=>i%3===1) },
    { label:'复盘保障', color:C.violet, rows:rows.filter((_,i)=>i%3===2) }
  ];
  groups.forEach((g,i)=>{
    const x = 4.42 + i*2.46;
    addRect(slide, x, 2.20, 2.08, 3.72, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?g.color:C.line, transparency:i===0?20:16, width:0.46} });
    addRect(slide, x, 2.20, 2.08, 0.04, g.color, g.color, { line:{color:g.color, transparency:100} });
    addLabel(slide, `CONTROL 0${i+1}`, { x:x+0.22, y:2.54, w:0.94, h:0.09, fontSize:5.4, color:g.color, charSpace:0.75 });
    addText(slide, g.label, { x:x+0.22, y:2.86, w:1.20, h:0.16, fontSize:10.8, bold:true, color:C.text, fit:'shrink' });
    (g.rows.length ? g.rows : [{0:g.label, 2:'明确责任人与执行节奏。'}]).slice(0,2).forEach((r,j)=>{
      const y = 3.46 + j*0.86;
      addText(slide, itemTitle({title:r[0]}, `机制 ${j+1}`), { x:x+0.22, y:y, w:1.28, h:0.13, fontSize:8.2, bold:true, color:C.text, fit:'shrink' });
      addText(slide, r[2] || '明确责任人与执行节奏。', { x:x+0.22, y:y+0.30, w:1.48, h:0.18, fontSize:6.8, color:C.body, fit:'shrink' });
    });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function riskResponsibilityItems(s) {
  const raw = s.responsibilities || s.owners || s.raci || s.accountabilities || s.actions || s.rows || [];
  const list = (Array.isArray(raw) ? raw : []).map((v, i) => {
    if (Array.isArray(v)) {
      return {
        title: v[0],
        level: v[1],
        body: v[2],
        owner: v[3] || ['责任人', '审批人', '执行人', '复盘人'][i % 4],
        cadence: v[4] || ''
      };
    }
    if (typeof v === 'string') return { title:v };
    return v || {};
  }).filter(Boolean);
  return list.length ? list : [
    { title:'定责', owner:'Owner', body:'明确唯一责任人与协作边界。', cadence:'启动即确认' },
    { title:'处置', owner:'Action', body:'按等级和时限推进控制动作。', cadence:'过程跟踪' },
    { title:'留痕', owner:'Evidence', body:'沉淀过程证据和审批记录。', cadence:'节点留存' },
    { title:'复盘', owner:'Review', body:'回看风险变化并更新机制。', cadence:'周期复盘' }
  ];
}

function riskResponsibilityLoop(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'RESPONSIBILITY LOOP', 0.86, 0.72, false);
  addText(slide, s.title || '责任闭环与治理机制', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.3, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

  const items = riskResponsibilityItems(s);
  const core = { x:0.92, y:2.04, w:2.86, h:4.16 };
  addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'GOVERNANCE CORE', { x:core.x+0.30, y:core.y+0.38, w:1.36, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '责任不落空', { x:core.x+0.30, y:core.y+0.86, w:1.72, h:0.28, fontSize:15.4, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || '把风险、动作、责任人、证据和复盘节奏绑定在同一条治理链上。', {
    x:core.x+0.30, y:core.y+1.44, w:1.92, h:0.62, fontSize:8.8, color:C.captionOnImage, fit:'shrink', breakLine:true
  });
  addHairline(slide, core.x+0.30, core.y+2.36, 0.82, C.accent, 0, 0.62);
  [
    ['OWNER', s.ownerLabel || '唯一责任人'],
    ['SLA', s.slaLabel || '处置时限'],
    ['EVIDENCE', s.evidenceLabel || '过程留痕']
  ].forEach((row,i)=>{
    const y = core.y + 2.72 + i*0.52;
    addLabel(slide, row[0], { x:core.x+0.32, y, w:0.84, h:0.09, fontSize:5.4, color:i===0?C.accent:(i===1?C.cyan:C.violet), charSpace:0.42 });
    addText(slide, row[1], { x:core.x+1.18, y:y-0.015, w:1.22, h:0.12, fontSize:7.6, color:'CBD5E1', fit:'shrink' });
  });

  const board = { x:4.24, y:2.04, w:7.28, h:4.16 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, {
    fill:{color:panelFill(), transparency:0},
    line:{color:C.line, transparency:14, width:0.50}
  });
  addLabel(slide, s.loopLabel || 'RISK · OWNER · ACTION · EVIDENCE · REVIEW', { x:board.x+0.28, y:board.y+0.28, w:2.92, h:0.10, fontSize:6.0, color:C.muted, charSpace:0.72 });

  const cx = board.x + board.w/2;
  const cy = board.y + board.h/2 + 0.10;
  slide.addShape('ellipse', { x:cx-0.68, y:cy-0.34, w:1.36, h:0.68, fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:54, width:0.42} });
  addText(slide, s.centerTitle || '责任闭环', { x:cx-0.46, y:cy-0.11, w:0.92, h:0.13, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, s.centerLabel || 'NO ORPHAN RISK', { x:cx-0.56, y:cy+0.10, w:1.12, h:0.08, fontSize:4.7, color:'64748B', align:'center', charSpace:0.42 });

  const slots = [
    { x:board.x+0.48, y:board.y+0.86, color:C.accent, defaultTitle:'定责' },
    { x:board.x+4.28, y:board.y+0.86, color:C.cyan, defaultTitle:'处置' },
    { x:board.x+4.28, y:board.y+2.92, color:C.violet, defaultTitle:'留痕' },
    { x:board.x+0.48, y:board.y+2.92, color:'94A3B8', defaultTitle:'复盘' }
  ];
  const cardW = 2.52;
  const cardH = 1.02;
  slots.forEach((slot,i)=>{
    const it = items[i] || {};
    addRect(slide, slot.x, slot.y, cardW, cardH, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:i===0?0:4},
      line:{color:i===0?slot.color:C.line, transparency:i===0?16:18, width:0.44}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.20, y:slot.y+0.24, w:0.30, h:0.10, fontSize:6.8, color:slot.color });
    addText(slide, itemTitle(it, slot.defaultTitle), { x:slot.x+0.64, y:slot.y+0.18, w:1.02, h:0.15, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
    addText(slide, it.owner || it.role || it.accountable || ['责任人', '处置人', '证据人', '复盘人'][i], {
      x:slot.x+1.58, y:slot.y+0.19, w:0.72, h:0.14, fontSize:8.8, color:slot.color, align:'right', fit:'shrink'
    });
    addText(slide, itemBody(it, ['明确责任与边界。', '推进处置动作。', '沉淀过程证据。', '更新治理机制。'][i]), {
      x:slot.x+0.20, y:slot.y+0.56, w:2.02, h:0.20, fontSize:8.8, color:C.body, fit:'shrink'
    });
  });
  addClockwiseLoopConnectors(slide, slots.map(slot => ({ x:slot.x, y:slot.y, w:cardW, h:cardH })), [C.accent, C.cyan, C.violet, '94A3B8'], {
    gap:0.18,
    transparency:30,
    width:0.42
  });

  const note = s.note || '每项责任都有责任人、处置动作、过程证据和复盘节奏。';
  addText(slide, note, { x:0.94, y:6.52, w:9.2, h:0.14, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function guidanceAndRiskBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'GUIDANCE AND RISK BOARD', 0.86, 0.72, false);
  addText(slide, s.title || '指引与风险边界', { x:0.84, y:1.05, w:6.0, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.claim || s.subtitle || '把增长假设、触发条件、责任和动作放在同一张管理板上。', { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  PageNumber(slide, idx);
  const rows = (s.rows || []).slice(0, 4);
  const assumptions = Array.isArray(s.assumptions) ? s.assumptions : [];
  const core = { x:0.92, y:2.04, w:2.82, h:4.00 };
  addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'GUIDANCE ASSUMPTIONS', { x:core.x+0.28, y:core.y+0.34, w:1.66, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.75 });
  addText(slide, s.guidance || s.coreTitle || '下季度边界', { x:core.x+0.28, y:core.y+0.82, w:1.70, h:0.24, fontSize:13.8, bold:true, color:C.white, fit:'shrink' });
  const assumptionList = assumptions.length ? assumptions : rows.slice(0, 3).map(r => `${r[0]} 不越过预警阈值`);
  assumptionList.slice(0, 3).forEach((item, i) => {
    const y = core.y + 1.52 + i * 0.62;
    const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
    addNumber(slide, String(i + 1).padStart(2, '0'), { x:core.x+0.30, y:y+0.02, w:0.28, h:0.09, fontSize:6.0, color:accent });
    addText(slide, itemTitle(item, `假设 ${i+1}`), { x:core.x+0.72, y, w:1.46, h:0.15, fontSize:8.2, color:C.captionOnImage, fit:'shrink' });
  });
  addHairline(slide, core.x+0.30, core.y+3.42, 0.82, C.accent, 0, 0.58);
  addText(slide, s.note || '每项风险必须有触发条件和处置动作。', { x:core.x+0.30, y:core.y+3.68, w:1.74, h:0.15, fontSize:6.9, color:C.darkMuted || 'A8B3C3', fit:'shrink' });

  const board = { x:4.02, y:2.04, w:7.54, h:4.00 };
  addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
  ['RISK', 'TRIGGER', 'OWNER / ACTION'].forEach((label, i) => {
    const x = board.x + [0.30, 2.24, 4.08][i];
    addLabel(slide, label, { x, y:board.y+0.30, w:i===2?1.58:0.96, h:0.09, fontSize:5.8, color:i===0?C.risk:(i===1?C.accent:C.cyan), charSpace:0.7 });
  });
  rows.forEach((r, i) => {
    const risk = Array.isArray(r) ? r[0] : itemTitle(r);
    const level = Array.isArray(r) ? r[1] : (r.level || r.severity || '中');
    const action = Array.isArray(r) ? r[2] : itemBody(r);
    const y = board.y + 0.76 + i * 0.72;
    const accent = level === '高' ? C.risk : (level === '低' ? C.cyan : C.accent);
    addRect(slide, board.x+0.22, y-0.08, board.w-0.44, 0.58, i === 0 ? 'FFFFFF' : panelFill(), C.line, { fill:{color:i === 0 ? 'FFFFFF' : panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?20:18, width:0.34} });
    addText(slide, risk || `风险 ${i+1}`, { x:board.x+0.36, y:y+0.06, w:1.46, h:0.13, fontSize:8.2, bold:true, color:C.text, fit:false });
    addText(slide, level === '高' ? '触发后即升级' : '达到阈值后跟踪', { x:board.x+2.30, y:y+0.06, w:1.34, h:0.13, fontSize:8.0, color:accent, fit:false });
    addText(slide, compactEvidenceCaption(action || '明确责任人和处置节奏。', 32), {
      x:board.x+4.14, y:y+0.02, w:2.46, h:0.28,
      fontSize:8.1, color:C.body, fit:false, breakLine:true, valign:'mid'
    });
  });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function materialityMatrixBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'MATERIALITY MATRIX', 0.86, 0.72, false);
  addText(slide, s.title || '重要议题矩阵', { x:0.84, y:1.05, w:6.1, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.claim || s.subtitle || '矩阵页必须有双轴、优先区和可定位议题。', { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  PageNumber(slide, idx);
  const rows = (s.rows || []).slice(0, 6);
  const axes = s.axes || {};
  const matrix = { x:0.92, y:2.02, w:6.18, h:4.10 };
  addRect(slide, matrix.x, matrix.y, matrix.w, matrix.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.48} });
  addRect(slide, matrix.x+3.12, matrix.y+0.18, 2.76, 1.58, C.risk, C.risk, { fill:{color:C.risk, transparency:86}, line:{color:C.risk, transparency:56, width:0.34} });
  addText(slide, '优先治理区', { x:matrix.x+4.28, y:matrix.y+0.36, w:0.94, h:0.12, fontSize:7.4, bold:true, color:C.risk, align:'center', fit:'shrink' });
  addHairline(slide, matrix.x+0.60, matrix.y+3.46, matrix.w-1.06, C.line, 10, 0.48);
  slide.addShape('line', { x:matrix.x+0.60, y:matrix.y+3.46, w:0, h:-3.00, line:{color:C.line, transparency:10, width:0.48} });
  addText(slide, axes.y || '利益相关方影响', { x:matrix.x+0.02, y:matrix.y+0.34, w:0.50, h:0.52, fontSize:6.8, color:C.muted, rotate:270, fit:'shrink' });
  addText(slide, axes.x || '业务影响', { x:matrix.x+4.52, y:matrix.y+3.66, w:0.92, h:0.11, fontSize:6.8, color:C.muted, fit:'shrink' });
  const positions = [
    [0.78, 0.82, C.risk],
    [0.60, 0.52, C.accent],
    [0.42, 0.58, C.cyan],
    [0.34, 0.30, C.violet],
    [0.70, 0.36, C.accent],
    [0.48, 0.78, C.cyan]
  ];
  rows.forEach((r, i) => {
    const [px, py, color] = positions[i] || positions[0];
    const x = matrix.x + 0.60 + px * (matrix.w - 1.32);
    const y = matrix.y + 3.46 - py * 2.90;
    slide.addShape('ellipse', { x:x-0.07, y:y-0.07, w:0.14, h:0.14, fill:{color}, line:{color:'FFFFFF', transparency:0, width:0.40} });
    addText(slide, itemTitle(Array.isArray(r) ? { title:r[0] } : r, `议题 ${i+1}`), { x:x+0.12, y:y-0.08, w:1.02, h:0.10, fontSize:6.0, color:C.text, fit:'shrink' });
  });

  const readout = { x:7.62, y:2.02, w:3.78, h:4.10 };
  addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'TOPIC READOUT', { x:readout.x+0.28, y:readout.y+0.34, w:1.16, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  rows.slice(0, 4).forEach((r, i) => {
    const y = readout.y + 0.92 + i * 0.62;
    const accent = i === 0 ? C.risk : (i === 1 ? C.accent : C.cyan);
    addNumber(slide, String(i + 1).padStart(2, '0'), { x:readout.x+0.28, y:y+0.02, w:0.28, h:0.09, fontSize:6.2, color:accent });
    addText(slide, itemTitle(Array.isArray(r) ? { title:r[0] } : r, `议题 ${i+1}`), { x:readout.x+0.70, y:y, w:1.04, h:0.13, fontSize:8.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, compactEvidenceCaption(Array.isArray(r) ? (r[2] || '') : itemBody(r), 24), { x:readout.x+1.88, y:y, w:1.48, h:0.12, fontSize:6.8, color:C.captionOnImage, fit:'shrink' });
  });
  addText(slide, s.note || '议题位置必须能解释优先级，而不是只列清单。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function governanceTableEditorial(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'GOVERNANCE TABLE EDITORIAL', 0.86, 0.72, false);
  addText(slide, s.title || '治理机制表', { x:0.84, y:1.05, w:6.1, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.claim || s.subtitle || '治理页把责任、节奏、证据和决策放到同一行。', { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  PageNumber(slide, idx);
  const rows = (s.rows || []).slice(0, 4);
  const intro = { x:0.92, y:2.06, w:2.36, h:3.86 };
  addRect(slide, intro.x, intro.y, intro.w, intro.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
  addLabel(slide, 'EDITORIAL CORE', { x:intro.x+0.28, y:intro.y+0.34, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
  addText(slide, s.coreTitle || '责任可追踪', { x:intro.x+0.28, y:intro.y+0.84, w:1.42, h:0.22, fontSize:13.4, bold:true, color:C.white, fit:'shrink' });
  addText(slide, s.coreBody || s.note || '每个治理动作都需要责任人、节奏、证据和决策去向。', { x:intro.x+0.28, y:intro.y+1.46, w:1.50, h:0.58, fontSize:8.0, color:C.captionOnImage, fit:'shrink', breakLine:true });
  addHairline(slide, intro.x+0.28, intro.y+2.56, 0.74, C.accent, 0, 0.58);
  addLabel(slide, 'OWNER · CADENCE · EVIDENCE · DECISION', { x:intro.x+0.28, y:intro.y+3.14, w:1.56, h:0.16, fontSize:5.5, color:'64748B', charSpace:0.45, fit:'shrink' });

  const table = { x:3.54, y:2.06, w:8.00, h:3.86 };
  const headers = [
    { label:'责任', x:0.28, w:1.70, color:C.accent },
    { label:'节奏', x:2.38, w:0.86, color:C.cyan },
    { label:'应对动作', x:3.62, w:3.70, color:C.violet }
  ];
  addRect(slide, table.x, table.y, table.w, table.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
  headers.forEach(h => addText(slide, h.label, { x:table.x+h.x, y:table.y+0.27, w:h.w, h:0.14, fontSize:8.8, bold:true, color:h.color, fit:'shrink' }));
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
  addText(slide, s.note || '治理表格不是风险清单，而是可追踪的管理机制。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function riskAdaptive(slide, plan, s, idx) {
  const variant = variantOf(s, 'governance-board');
  if (variant === 'materiality-matrix-board') return materialityMatrixBoard(slide, plan, s, idx);
  if (variant === 'guidance-and-risk-board') return guidanceAndRiskBoard(slide, plan, s, idx);
  if (variant === 'governance-table-editorial') return governanceTableEditorial(slide, plan, s, idx);
  if (variant === 'risk-matrix') return riskMatrixSlide(slide, plan, s, idx);
  if (variant === 'control-stack') return riskControlStack(slide, plan, s, idx);
  if (variant === 'responsibility-loop') return riskResponsibilityLoop(slide, plan, s, idx);
  return riskTable(slide, plan, s, idx);
}

function riskTable(slide, plan, s, idx) {
  // Governance board family: readable risks, severity, and concrete response actions.
  lightCanvas(slide);
  sectionKicker(slide, 'GOVERNANCE BOARD', 0.86, 0.72, false);
  addText(slide, s.title, { x:0.84, y:1.05, w:5.2, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
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
    addText(slide, meta.zh, { x:7.46, y:y+0.235, w:0.76, h:0.08, fontSize:5.8, bold:true, color:C.onAccent || C.white, align:'center', fit:'shrink' });
    addText(slide, response || '明确责任人与处置节奏。', { x:8.56, y:y+0.14, w:2.34, h:0.15, fontSize:8.2, color:C.body, fit:'shrink' });
  });
  addRect(slide, 4.58, 5.92, 6.82, 0.46, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.42} });
  addText(slide, '保障机制', { x:4.86, y:6.08, w:0.86, h:0.12, fontSize:8.3, bold:true, color:C.text, fit:'shrink' });
  addText(slide, s.note || '以数据责任、跨部门协同、分批集成和上线培训构成风险闭环。', { x:5.96, y:6.06, w:4.72, h:0.14, fontSize:7.8, color:C.body, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
}

  return {
    governanceTableEditorial,
    guidanceAndRiskBoard,
    materialityMatrixBoard,
    riskAdaptive,
    riskControlStack,
    riskMatrixSlide,
    riskResponsibilityLoop,
    riskTable
  };
}


module.exports = {
  createRiskBoardRenderers
};
