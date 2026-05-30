const family = "timeline";

const types = ["timeline", "timeline-dark"];

function createTimelineRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    addArrowLine,
    addClockwiseLoopConnectors,
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

function timelineClosedLoop(slide, plan, s, idx) {
  stageCanvas(slide);
  sectionKicker(slide, 'OPERATING LOOP', 0.84, 0.72, true);
  addText(slide, s.title || '流程闭环', { x:0.82, y:1.06, w:6.2, h:0.38, fontSize:24, bold:true, color:C.white, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.54, w:5.9, h:0.20, fontSize:10.4, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
  const phases = (s.phases || []).slice(0,4).map(p => typeof p === 'string' ? { title:p } : (p || {}));
  if (phases.length === 3) {
    phases.push({
      title: s.returnTitle || '复盘回流',
      body: (s.businessLogic && (s.businessLogic.action || s.businessLogic.metric)) || s.note || '复盘数据回到下一轮动作。'
    });
  }
  const board = { x:0.92, y:2.04, w:10.84, h:4.18 };
  addRect(slide, board.x, board.y, board.w, board.h, C.ink2, '334155', {
    fill:{color:C.ink2, transparency:58},
    line:{color:'334155', transparency:74, width:0.36}
  });
  addLabel(slide, plan.industry === 'manufacturing-operations' ? 'FAULT · WORKORDER · SPARE PART · OEE' : 'ACTION · DATA · REVIEW', {
    x:board.x+0.30, y:board.y+0.28, w:2.92, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.75
  });

  const cx = 6.34, cy = 4.05;
  slide.addShape('ellipse', { x:cx-1.34, y:cy-0.70, w:2.68, h:1.40, fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:46, width:0.46} });
  slide.addShape('ellipse', { x:cx-0.92, y:cy-0.42, w:1.84, h:0.84, fill:{color:C.ink2, transparency:30}, line:{color:'334155', transparency:62, width:0.28} });
  addText(slide, s.centerTitle || (plan.industry === 'manufacturing-operations' ? 'OEE复盘' : '闭环复盘'), { x:cx-0.74, y:cy-0.14, w:1.48, h:0.18, fontSize:12.8, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, 'DATA BACK TO ACTION', { x:cx-0.86, y:cy+0.20, w:1.72, h:0.09, fontSize:5.2, color:'64748B', align:'center', charSpace:0.62 });
  const pos = [
    { x:1.22, y:2.74 }, { x:8.46, y:2.74 },
    { x:8.46, y:4.78 }, { x:1.22, y:4.78 }
  ];
  const cardW = 2.46;
  const cardH = 1.06;
  phases.forEach((p,i)=>{
    const {x,y} = pos[i];
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, x, y, cardW, cardH, C.ink, '334155', { fill:{color:C.ink, transparency:i===0?6:20}, line:{color:accent, transparency:i===0?18:54, width:0.44} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.22, w:0.32, h:0.11, fontSize:6.8, color:accent });
    addText(slide, p.title, { x:x+0.66, y:y+0.16, w:1.36, h:0.16, fontSize:10.0, bold:true, color:C.white, fit:false });
    addText(slide, compactEvidenceCaption(p.body || '', 28), {
      x:x+0.66, y:y+0.46, w:1.54, h:0.36,
      fontSize:8.6, color:C.darkMuted || 'A8B3C3', fit:false, breakLine:true, valign:'mid'
    });
  });
  addClockwiseLoopConnectors(slide, pos.map(p => ({ x:p.x, y:p.y, w:cardW, h:cardH })), [C.accent, C.cyan, C.violet, C.accent], {
    gap:0.24,
    transparency:30,
    width:0.54
  });
  addLabel(slide, 'SEQUENCE 01 → 02 → 03 → 04 → 01', { x:board.x+0.30, y:board.y+0.48, w:2.92, h:0.09, fontSize:5.3, color:C.darkMuted || '64748B', charSpace:0.62 });
  addText(slide, '复盘回流', { x:1.18, y:4.06, w:0.70, h:0.10, fontSize:5.8, color:C.accent, fit:'shrink' });
  if (s.note) addText(slide, s.note, { x:0.92, y:6.36, w:7.8, h:0.18, fontSize:9.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function timelineFlywheel(slide, plan, s, idx) {
  stageCanvas(slide);
  sectionKicker(slide, 'OPERATING FLYWHEEL', 0.84, 0.72, true);
  addText(slide, s.title || '运营飞轮', { x:0.82, y:1.06, w:6.9, h:0.38, fontSize:24, bold:true, color:C.white, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.54, w:6.2, h:0.20, fontSize:10.2, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });

  const raw = s.flywheel || s.loopItems || s.phases || s.cards || s.items || [];
  const nodes = (Array.isArray(raw) ? raw : []).slice(0,6).map(v => typeof v === 'string' ? { title:v } : v);
  const items = nodes.length ? nodes : [
    { title:'触达', body:'建立入口' },
    { title:'转化', body:'形成动作' },
    { title:'留存', body:'沉淀关系' },
    { title:'复盘', body:'驱动下一轮' }
  ];
  const cx = 6.58;
  const cy = 3.94;
  const radiusX = 3.02;
  const radiusY = 1.66;
  const nodeW = items.length <= 4 ? 2.02 : 1.72;
  const nodeH = 0.84;
  addRect(slide, 0.92, 2.02, 10.92, 4.26, C.ink2, '334155', {
    fill:{color:C.ink2, transparency:60},
    line:{color:'334155', transparency:76, width:0.36}
  });
  addLabel(slide, s.flywheelLabel || 'INPUT · ACTION · SIGNAL · REVIEW', { x:1.20, y:2.32, w:2.58, h:0.10, fontSize:6.0, color:'64748B', charSpace:0.8 });
  slide.addShape('ellipse', { x:cx-2.20, y:cy-1.24, w:4.40, h:2.48, fill:{color:C.ink, transparency:100}, line:{color:C.accent, transparency:48, width:0.50} });
  slide.addShape('ellipse', { x:cx-1.38, y:cy-0.76, w:2.76, h:1.52, fill:{color:C.ink, transparency:0}, line:{color:'334155', transparency:62, width:0.30} });
  addText(slide, s.centerTitle || '飞轮复利', { x:cx-0.78, y:cy-0.16, w:1.56, h:0.20, fontSize:13.2, bold:true, color:C.white, align:'center', fit:'shrink' });
  addLabel(slide, s.centerLabel || 'COMPOUNDING LOOP', { x:cx-0.88, y:cy+0.20, w:1.76, h:0.09, fontSize:5.4, color:'64748B', align:'center', charSpace:0.60 });

  let slots;
  if (items.length <= 4) {
    slots = [
      { x:cx-nodeW/2, y:2.42 },
      { x:8.64, y:3.40 },
      { x:cx-nodeW/2, y:4.76 },
      { x:2.62, y:3.40 }
    ].slice(0, items.length);
    addArrowLine(slide, cx+1.18, cy-1.12, 1.30, 0, C.accent, { transparency:34, width:0.40 });
    addArrowLine(slide, 9.62, cy-0.06, 0, 0.72, C.cyan, { transparency:36, width:0.40 });
    addArrowLine(slide, cx-2.48, cy+1.12, 1.30, 0, C.violet, { beginArrowType:'triangle', endArrowType:null, transparency:38, width:0.40 });
    addArrowLine(slide, 3.62, cy-0.06, 0, 0.72, '94A3B8', { beginArrowType:'triangle', endArrowType:null, transparency:42, width:0.40 });
  } else {
    const points = items.map((_, i) => {
      const angle = -Math.PI / 2 + i * (Math.PI * 2 / items.length);
      return {
        x: cx + Math.cos(angle) * radiusX,
        y: cy + Math.sin(angle) * radiusY,
        angle
      };
    });
    points.forEach((p,i)=>{
      const next = points[(i+1) % points.length];
      const sx = p.x + Math.cos(p.angle) * 0.56;
      const sy = p.y + Math.sin(p.angle) * 0.28;
      const ex = next.x - Math.cos(next.angle) * 0.56;
      const ey = next.y - Math.sin(next.angle) * 0.28;
      addArrowLine(slide, sx, sy, ex-sx, ey-sy, i===0?C.accent:(i===1?C.cyan:(i===2?C.violet:'94A3B8')), { transparency:46, width:0.36 });
    });
    slots = points.map(p => ({
      x: Math.max(1.18, Math.min(10.44, p.x - nodeW / 2)),
      y: Math.max(2.62, Math.min(5.32, p.y - nodeH / 2))
    }));
  }
  items.forEach((it,i)=>{
    const p = slots[i];
    const x = p.x;
    const y = p.y;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
    addRect(slide, x, y, nodeW, nodeH, C.ink, '334155', {
      fill:{color:C.ink, transparency:i===0?4:22},
      line:{color:accent, transparency:i===0?18:56, width:0.42}
    });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.16, y:y+0.18, w:0.28, h:0.10, fontSize:6.6, color:accent });
    addText(slide, itemTitle(it, `动作 ${i+1}`), { x:x+0.54, y:y+0.14, w:nodeW-0.74, h:0.13, fontSize:8.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(it), { x:x+0.54, y:y+0.44, w:nodeW-0.74, h:0.18, fontSize:8.8, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
  });
  if (s.note) addText(slide, s.note, { x:0.94, y:6.46, w:8.40, h:0.14, fontSize:8.2, color:C.darkMuted || '94A3B8', fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
}

function timelineProcessBoard(slide, plan, s, idx) {
  lightCanvas(slide);
  sectionKicker(slide, 'PROCESS BOARD', 0.86, 0.72, false);
  addText(slide, s.title || '实施路径', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
  if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.1, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
  addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
  const phases = (s.phases || []).slice(0,6);
  addRect(slide, 0.92, 2.02, 10.92, 4.16, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
  const connectors = [];
  phases.forEach((p,i)=>{
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 1.22 + col*3.36;
    const y = 2.42 + row*1.72;
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
    addRect(slide, x, y, 2.82, 1.18, i===0 ? C.panelAlt : panelFill(), C.line, { fill:{color:i===0 ? C.panelAlt : panelFill(), transparency:i===0?4:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:18, width:0.42} });
    addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.22, w:0.32, h:0.11, fontSize:6.8, color:accent });
    addText(slide, p.title, { x:x+0.70, y:y+0.16, w:1.46, h:0.15, fontSize:10.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, p.body, { x:x+0.22, y:y+0.54, w:2.22, h:0.32, fontSize:7.6, color:C.body, fit:'shrink', breakLine:true });
    if (i < phases.length - 1 && col < 2) connectors.push({ x:x+2.90, y:y+0.58, color:accent });
  });
  connectors.forEach(conn => slide.addShape('line', { x:conn.x, y:conn.y, w:0.26, h:0, line:{color:conn.color, transparency:34, width:0.42, endArrowType:'triangle'} }));
  addText(slide, s.note || '步骤、动作与产出保持一一对应，便于项目执行复盘。', { x:0.96, y:6.46, w:8.40, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
}

function timelineAdaptive(slide, plan, s, idx) {
  const variant = variantOf(s, 'pathway-rail');
  if (variant === 'flywheel' || variant === 'operating-loop') return timelineFlywheel(slide, plan, s, idx);
  if (variant === 'closed-loop') return timelineClosedLoop(slide, plan, s, idx);
  if (variant === 'process-board') return timelineProcessBoard(slide, plan, s, idx);
  return timelineDark(slide, plan, s, idx);
}

function timelineDark(slide, plan, s, idx) {
  // Pathway Timeline v12: Keynote-style rail with unified milestone cards.
  // Number, title and body are one compact group; no alternating scattered labels.
  stageCanvas(slide);
  sectionKicker(slide, 'PATHWAY', 0.84, 0.72, true);
  addText(slide, s.title, { x:0.82, y:1.04, w:7.55, h:0.40, fontSize:23.2, bold:true, color:C.white, fit:'shrink' });
  addText(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, bold:true, color:C.darkMuted || 'D8CDD0', align:'right' });

  const phases = (s.phases || []).slice(0,4);
  const axisY = 4.62;
  const cardXs = [0.98, 3.78, 6.58, 9.38];
  const cardW = 2.36;
  const nodeXs = cardXs.map(x => x + 0.38);
  addHairline(slide, nodeXs[0], axisY, nodeXs[nodeXs.length-1]-nodeXs[0], '334155', 22, 0.72);

  phases.forEach((p,i)=>{
    const nodeX = nodeXs[i];
    const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===3 ? (C.darkMuted || 'D8CDD0') : (C.captionOnImage || 'F7ECEF')));
    const cardX = cardXs[i];
    const cardY = 2.42;

    // One grouped milestone: num + title on the same baseline, body below.
    addRect(slide, cardX-0.18, cardY-0.10, cardW+0.36, 1.18, C.ink2, '334155', { fill:{color:C.ink2, transparency:72}, line:{color:'334155', transparency:86, width:0.35} });
    addText(slide, String(i+1).padStart(2,'0'), { x:cardX, y:cardY, w:0.34, h:0.14, fontSize:8.0, bold:true, color:accent });
    addText(slide, p.title, { x:cardX+0.48, y:cardY-0.04, w:cardW-0.48, h:0.20, fontSize:12.3, bold:true, color:C.white, fit:'shrink' });
    addText(slide, p.body, { x:cardX+0.48, y:cardY+0.48, w:cardW-0.48, h:0.42, fontSize:8.6, color:C.darkMuted || 'D8CDD0', breakLine:true, valign:'top', fit:'shrink' });

    // Connector is a short local cue from the grouped card to the rail.
    const tickTop = cardY + 1.08;
    slide.addShape('line', { x:nodeX, y:tickTop, w:0, h:axisY-tickTop-0.14, line:{color:'334155', transparency:36, width:0.48} });
    slide.addShape('ellipse', { x:nodeX-0.08, y:axisY-0.08, w:0.20, h:0.20, fill:{color:accent}, line:{color:accent, transparency:100} });
  });

  if (s.note) {
    addHairline(slide, 0.86, 6.10, 8.20, '334155', 42, 0.45);
    addText(slide, s.note, { x:0.86, y:6.30, w:8.6, h:0.22, fontSize:12.2, bold:true, color:'CBD5E1' });
  }
  addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.darkMuted || 'D8CDD0' });
}

  return {
    timelineAdaptive,
    timelineClosedLoop,
    timelineDark,
    timelineFlywheel,
    timelineProcessBoard
  };
}

function entries(renderers = {}) {
  return [
    { types, render:renderers.timelineAdaptive, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createTimelineRenderers,
  entries
};
