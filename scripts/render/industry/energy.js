function createEnergyIndustryRenderers(ctx = {}) {
  const {
    addDarkBreathingCircle,
    addEnergyLens,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    addVisualPhotoPanel,
    footerText,
    glassPanel,
    hasEnergyCurveSemantics,
    lightCanvas,
    panelFill,
    stageCanvas,
    slideWantsImage
  } = ctx;
  const canvasWidth = () => typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const canvasHeight = () => typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const colors = () => ctx.colors();

  function addEnergyFooter(slide, plan, dark = true) {
    addText(slide, footerText(plan), {
      x:0.82, y:7.05, w:7.8, h:0.16,
      fontSize:7.8,
      color:dark ? '64748B' : '738297'
    });
  }

  function energyToc(slide, plan, s, idx) {
    const C = colors();
    const W = canvasWidth();
    stageCanvas(slide, { field:false });
    const useImage = slideWantsImage(plan, s, 'navigation');
    if (useImage) {
      addVisualPhotoPanel(slide, plan, s, 'navigation', 0, 5.58, W, 1.28, { transparency:44 });
    } else {
      addRect(slide, 0, 5.58, W, 1.28, C.ink2, C.ink2, { fill:{color:C.ink2, transparency:28}, line:{color:C.ink2, transparency:100} });
      if (hasEnergyCurveSemantics(s)) ctx.addPulseCurve(slide, 1.02, 5.90, 5.36, 0.36, C.cyan, true, { transparency:66, width:0.36, nodes:false });
    }
    addDarkBreathingCircle(slide, 10.36, 0.36, 2.48, 1.22, C.accent);
    addLabel(slide, 'OPERATING SEQUENCE', { x:0.84, y:0.72, w:1.72, h:0.14, fontSize:7.0, color:'64748B', charSpace:1.15 });
    addText(slide, s.title || '电站运行路径', { x:0.82, y:1.14, w:3.35, h:0.36, fontSize:24, bold:true, color:C.white });
    addText(slide, '不是目录清单，而是一条从站点接入到区域复盘的运营路径。', { x:0.84, y:1.68, w:4.92, h:0.18, fontSize:9.0, color:'94A3B8', fit:'shrink' });
    addText(slide, String(idx).padStart(2,'0'), { x:11.62, y:0.70, w:0.58, h:0.18, fontSize:10.5, bold:true, color:'64748B', align:'right' });

    addText(slide, '02', { x:0.72, y:2.12, w:1.52, h:0.58, fontSize:42, bold:true, color:'13213A', fit:'shrink' });
    const items = (s.items || []).slice(0,5);
    const chapterLabels = ['多站资产背景', '集中运维升级', '架构与数据流转', '试点区域推广', '价值与保障'];
    const stages = [
      ['01', '接入', '资产与设备'],
      ['02', '监测', '运行与告警'],
      ['03', '闭环', '工单与策略'],
      ['04', '推广', '区域化运维'],
      ['05', '复盘', '价值与保障']
    ];
    const startX = 1.02;
    const y = 3.03;
    const gap = 0.17;
    const cardW = 2.16;
    addHairline(slide, startX+0.18, y+1.08, 9.90, '334155', 34, 0.58);
    stages.forEach((st,i)=>{
      const x = startX + i*(cardW+gap);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      const active = i === 0;
      addRect(slide, x, y, cardW, 1.44, active ? C.ink : C.ink2, active ? C.accent : '334155', {
        fill:{ color:active ? C.ink : C.ink2, transparency:active ? 4 : 36 },
        line:{ color:active ? C.accent : '334155', transparency:active ? 24 : 62, width:0.44 }
      });
      slide.addShape('ellipse', { x:x+0.22, y:y+0.22, w:0.10, h:0.10, fill:{color:accent}, line:{color:accent, transparency:100} });
      addNumber(slide, st[0], { x:x+0.42, y:y+0.17, w:0.36, h:0.10, typeRole:'number', fontSize:7.0, color:accent });
      addText(slide, st[1], { x:x+0.22, y:y+0.54, w:0.86, h:0.18, typeRole:'cardTitle', fontSize:11.4, bold:true, color:C.white, fit:'shrink' });
      addText(slide, st[2], { x:x+0.22, y:y+0.86, w:1.20, h:0.13, typeRole:'caption', fontSize:7.8, color:'7C8BA3', fit:'shrink' });
      addText(slide, chapterLabels[i] || items[i] || '', { x:x+0.22, y:y+1.08, w:1.58, h:0.16, typeRole:'bodySmall', fontSize:8.8, bold:active, color:active?C.white:'CBD5E1', fit:'shrink' });
      if (i < stages.length - 1) {
        slide.addShape('line', { x:x+cardW+0.03, y:y+0.72, w:gap+0.10, h:0, line:{color:'334155', transparency:30, width:0.40, endArrowType:'triangle'} });
      }
    });
    addLabel(slide, 'SITE · DATA · ALARM · DISPATCH · VALUE', { x:7.94, y:6.18, w:3.28, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'94A3B8', charSpace:0.8, align:'right' });
    addEnergyFooter(slide, plan, true);
  }

  function energySituationEditorial(slide, plan, s, idx) {
    const C = colors();
    const H = canvasHeight();
    slide.background = { color:'F7FAFD' };
    addRect(slide, 0, 0, canvasWidth(), H, 'F7FAFD', 'F7FAFD');
    const useImage = slideWantsImage(plan, s, 'situation');
    if (useImage) {
      addVisualPhotoPanel(slide, plan, s, 'situation', 0, 0, 4.82, H, { transparency:36, stroke:'334155', strokeTransparency:78 });
    }
    addRect(slide, 0, 0, 4.82, H, C.ink, C.ink, { fill:{color:C.ink, transparency:18}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'SITE READOUT', { x:0.78, y:0.76, w:1.36, h:0.12, fontSize:6.8, color:'94A3B8', charSpace:1.1 });
    addText(slide, s.title || '多站点能源资产运营背景', { x:0.76, y:1.18, w:3.18, h:0.62, typeRole:'pageTitle', fontSize:22.5, bold:true, color:C.white, fit:'shrink', breakLine:true });
    addText(slide, s.leftTitle || '管理现状', { x:0.82, y:2.28, w:1.36, h:0.18, fontSize:10.6, bold:true, color:'CBD5E1' });
    (s.left || []).slice(0,3).forEach((it,i)=>{
      const y = 2.78 + i*0.78;
      const accent = i===1 ? C.cyan : C.accent;
      slide.addShape('ellipse', { x:0.86, y:y+0.07, w:0.07, h:0.07, fill:{color:accent}, line:{color:accent, transparency:100} });
      addText(slide, it, { x:1.08, y, w:2.80, h:0.34, typeRole:'bodySmall', fontSize:8.8, color:'CBD5E1', fit:'shrink', breakLine:true, valign:'mid' });
    });
    addHairline(slide, 0.82, 5.62, 1.06, C.accent, 0, 0.65);
    addLabel(slide, 'BESS · PV · MICROGRID', { x:0.82, y:5.92, w:2.18, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'7C8BA3', charSpace:0.7 });

    addLabel(slide, 'UPGRADE DEMANDS', { x:5.62, y:0.72, w:1.48, h:0.12, typeRole:'kicker', fontSize:6.8, color:C.muted, charSpace:1.0 });
    addText(slide, s.rightTitle || '升级诉求', { x:5.58, y:1.10, w:3.0, h:0.30, fontSize:22.0, bold:true, color:C.text });
    addText(slide, '把设备数据、运行状态和策略复盘收束成同一套管理视图。', { x:5.60, y:1.56, w:4.80, h:0.18, typeRole:'bodySmall', fontSize:8.8, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.68, w:0.72, h:0.20, fontSize:12.6, color:C.accent, align:'right' });

    (s.cards || []).slice(0,3).forEach((card,i)=>{
      const y = 2.20 + i*1.22;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, 5.58, y, 5.86, 0.94, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.54} });
      addRect(slide, 5.58, y, 0.05, 0.94, accent, accent, { line:{color:accent, transparency:100} });
      addText(slide, String(i+1).padStart(2,'0'), { x:5.90, y:y+0.35, w:0.34, h:0.12, typeRole:'number', fontSize:7.0, bold:true, color:accent, valign:'mid' });
      addText(slide, card.title, { x:6.46, y:y+0.22, w:1.72, h:0.17, typeRole:'cardTitle', fontSize:12.0, bold:true, color:C.text, fit:'shrink', valign:'mid' });
      addText(slide, card.body, { x:8.24, y:y+0.18, w:2.70, h:0.36, typeRole:'bodySmall', fontSize:8.8, color:C.body, fit:'shrink', valign:'mid' });
    });

    addRect(slide, 5.58, 6.03, 5.86, 0.42, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'DESIGN PRINCIPLE', { x:5.88, y:6.16, w:1.20, h:0.12, typeRole:'microLabel', fontSize:6.8, color:C.accent, charSpace:0.7 });
    addText(slide, '先统一运行事实，再设计调度闭环。', { x:7.22, y:6.12, w:2.72, h:0.16, typeRole:'caption', fontSize:8.4, bold:true, color:'CBD5E1', fit:'shrink' });
    addEnergyFooter(slide, plan, false);
  }

  function energyProblemSplit(slide, plan, s, idx) {
    const C = colors();
    stageCanvas(slide, { field:false });
    addDarkBreathingCircle(slide, 8.62, 0.66, 3.94, 2.10, C.violet);
    const useImage = slideWantsImage(plan, s, 'split');
    if (useImage) {
      addVisualPhotoPanel(slide, plan, s, 'split', 8.80, 0.98, 3.34, 5.24, { transparency:46, stroke:'334155', strokeTransparency:62 });
      addRect(slide, 8.80, 4.84, 3.34, 1.38, C.ink, C.ink, { fill:{color:C.ink, transparency:12}, line:{color:C.ink, transparency:100} });
    } else {
      addRect(slide, 8.80, 0.98, 3.34, 5.24, C.ink2, '334155', { fill:{color:C.ink2, transparency:46}, line:{color:'334155', transparency:68, width:0.36} });
      addEnergyLens(slide, 8.94, 1.26, 2.94, C.cyan, { showCurve:hasEnergyCurveSemantics(s) });
    }
    addLabel(slide, 'OPERATING BREAKPOINTS', { x:0.84, y:0.72, w:1.90, h:0.12, typeRole:'kicker', fontSize:6.8, color:'64748B', charSpace:1.05 });
    addText(slide, s.title || '从分散巡检到集中运维', { x:0.82, y:1.08, w:5.55, h:0.36, typeRole:'pageTitle', fontSize:24, bold:true, color:C.white, fit:'shrink' });
    if (s.intro) addText(slide, s.intro, { x:0.84, y:1.56, w:5.72, h:0.20, typeRole:'bodySmall', fontSize:9.0, color:'94A3B8', fit:'shrink' });
    addText(slide, String(idx).padStart(2,'0'), { x:11.62, y:0.70, w:0.58, h:0.18, fontSize:10.5, bold:true, color:'64748B', align:'right' });

    addRect(slide, 0.90, 2.20, 7.24, 0.52, C.ink2, '334155', { fill:{color:C.ink2, transparency:54}, line:{color:'334155', transparency:64, width:0.36} });
    addLabel(slide, 'FROM', { x:1.18, y:2.39, w:0.56, h:0.11, fontSize:6.8, bold:true, color:'64748B', charSpace:0.45 });
    addText(slide, '分散巡检', { x:1.72, y:2.34, w:1.16, h:0.12, fontSize:8.4, bold:true, color:'CBD5E1' });
    addHairline(slide, 3.06, 2.46, 1.66, C.accent, 42, 0.38);
    addLabel(slide, 'TO', { x:5.04, y:2.39, w:0.32, h:0.11, fontSize:6.8, bold:true, color:C.cyan, charSpace:0.45 });
    addText(slide, '集中运维闭环', { x:5.44, y:2.34, w:1.62, h:0.12, fontSize:8.4, bold:true, color:C.white });

    const cards = s.cards || [];
    const pos = [[0.92,3.16],[4.18,3.16],[0.92,4.60],[4.18,4.60]];
    cards.slice(0,4).forEach((card,i)=>{
      const [x,y] = pos[i];
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addRect(slide, x, y, 2.90, 1.00, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?18:36}, line:{color:accent, transparency:i===0?24:58, width:0.42} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:y+0.22, w:0.32, h:0.10, fontSize:6.8, color:accent });
      addText(slide, card.title, { x:x+0.70, y:y+0.17, w:1.62, h:0.16, fontSize:11.2, bold:true, color:C.white, fit:'shrink' });
      addText(slide, card.body, { x:x+0.24, y:y+0.52, w:2.34, h:0.30, typeRole:'bodySmall', fontSize:8.8, color:'A8B3C3', fit:'shrink' });
    });
    addLabel(slide, 'FIELD SIGNAL', { x:9.12, y:5.16, w:1.18, h:0.11, fontSize:6.8, color:'7C8BA3', charSpace:0.45 });
    addText(slide, '设备状态进入同一张运行图', { x:9.12, y:5.50, w:1.98, h:0.18, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
    if (hasEnergyCurveSemantics(s)) ctx.addPulseCurve(slide, 9.12, 5.82, 2.10, 0.28, C.cyan, true, { transparency:46, width:0.36, nodes:false });
    addEnergyFooter(slide, plan, true);
  }

  function energyCapabilityLoop(slide, plan, s, idx) {
    const C = colors();
    lightCanvas(slide);
    ctx.sectionKicker(slide, 'ENERGY LOOP', 0.86, 0.72, false);
    addText(slide, s.title, { x:0.84, y:1.05, w:5.0, h:0.35, fontSize:24, bold:true, color:C.text });
    if (s.intro) addText(slide, s.intro, { x:0.86, y:1.52, w:5.9, h:0.22, fontSize:10.8, color:C.muted });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const cards = s.cards || [];
    const left = { x:0.92, y:2.12, w:3.18, h:3.60 };
    glassPanel(slide, left.x, left.y, left.w, left.h, false);
    addLabel(slide, 'OPERATING LOOP', { x:left.x+0.28, y:left.y+0.34, w:1.25, h:0.12, fontSize:6.8, color:C.muted, charSpace:0.8 });
    addText(slide, '负荷-储能-告警闭环', { x:left.x+0.28, y:left.y+0.90, w:2.24, h:0.28, fontSize:15.8, bold:true, color:C.text });
    addText(slide, '从运行曲线发现偏差，以告警工单驱动处置，再回到策略复盘与调度优化。', { x:left.x+0.28, y:left.y+1.54, w:2.20, h:0.72, fontSize:9.2, color:C.body, breakLine:true });
    addHairline(slide, left.x+0.28, left.y+2.78, 0.72, C.accent, 0, 0.75);

    const panel = { x:4.42, y:1.98, w:7.66, h:4.42 };
    addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink, 'D8E2EF', { fill:{color:C.ink, transparency:0}, line:{color:'D8E2EF', transparency:82, width:0.36} });
    addLabel(slide, 'ENERGY OPERATING LOOP', { x:4.72, y:2.28, w:1.86, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'64748B', charSpace:1.0 });
    const loop = [
      { key:'负荷曲线', fallback:cards[0], x:4.86, y:2.62, accent:C.accent },
      { key:'储能策略', fallback:cards[3], x:8.94, y:2.62, accent:C.violet },
      { key:'告警事件', fallback:cards[1], x:8.94, y:4.70, accent:C.cyan },
      { key:'工单闭环', fallback:cards[2], x:4.86, y:4.70, accent:'94A3B8' }
    ];
    const loopOval = { x:5.58, y:2.74, w:4.96, h:2.88 };
    slide.addShape('ellipse', { x:loopOval.x, y:loopOval.y, w:loopOval.w, h:loopOval.h, fill:{color:C.ink, transparency:100}, line:{color:'7FA5D8', transparency:58, width:0.48} });
    slide.addShape('ellipse', { x:loopOval.x+0.72, y:loopOval.y+0.44, w:loopOval.w-1.44, h:loopOval.h-0.88, fill:{color:C.ink, transparency:100}, line:{color:'334155', transparency:58, width:0.28} });
    addText(slide, '闭环', { x:7.46, y:3.74, w:1.14, h:0.28, fontSize:20.5, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, 'MONITOR · ALARM · WORKORDER · DISPATCH', { x:6.72, y:4.22, w:2.60, h:0.10, fontSize:5.7, color:'64748B', charSpace:0.7, align:'center' });
    ctx.addPulseCurve(slide, 6.58, 4.56, 2.86, 0.46, C.cyan, true, { transparency:60, width:0.38, nodes:false });
    [
      [loopOval.x+loopOval.w*0.50, loopOval.y+0.04, C.accent],
      [loopOval.x+loopOval.w-0.04, loopOval.y+loopOval.h*0.50, C.violet],
      [loopOval.x+loopOval.w*0.50, loopOval.y+loopOval.h-0.04, C.cyan],
      [loopOval.x+0.04, loopOval.y+loopOval.h*0.50, '94A3B8']
    ].forEach(([x,y,color])=>slide.addShape('ellipse', { x:x-0.045, y:y-0.045, w:0.09, h:0.09, fill:{color}, line:{color, transparency:100} }));
    loop.forEach((node,i)=>{
      const card = node.fallback || { title:node.key, body:'' };
      addRect(slide, node.x, node.y, 2.46, 0.92, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?4:18}, line:{color:node.accent, transparency:i===0?22:54, width:0.45} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:node.x+0.20, y:node.y+0.18, w:0.30, h:0.10, fontSize:6.8, color:node.accent });
      addText(slide, card.title, { x:node.x+0.56, y:node.y+0.13, w:1.56, h:0.14, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
      addText(slide, card.body, { x:node.x+0.56, y:node.y+0.43, w:1.66, h:0.26, typeRole:'bodySmall', fontSize:8.8, color:'A8B3C3', fit:'shrink' });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
  }

  function energyValueSignal(slide, plan, s, idx) {
    const C = colors();
    const W = canvasWidth();
    const H = canvasHeight();
    slide.background = { color:'F7FAFD' };
    addRect(slide, 0, 0, W, H, 'F7FAFD', 'F7FAFD');
    addRect(slide, 0, 0, W, 0.92, C.white, C.white, { line:{color:C.white, transparency:100} });
    addLabel(slide, 'VALUE SIGNAL', { x:0.86, y:0.72, w:1.34, h:0.12, fontSize:6.8, color:C.muted, charSpace:1.0 });
    addText(slide, s.title || '预期价值', { x:0.84, y:1.06, w:3.30, h:0.34, fontSize:24, bold:true, color:C.text });
    if (s.intro) addText(slide, s.intro, { x:0.86, y:1.52, w:5.80, h:0.18, fontSize:9.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const cards = s.cards || [];
    const lead = cards[0] || { title:'运行态势可视', body:'' };
    const useImage = slideWantsImage(plan, s, 'value');
    if (useImage) {
      addVisualPhotoPanel(slide, plan, s, 'value', 0.92, 2.08, 4.76, 3.70, { transparency:42, stroke:'D8E2EF', strokeTransparency:32 });
      addRect(slide, 0.92, 4.38, 4.76, 1.40, C.ink, C.ink, { fill:{color:C.ink, transparency:12}, line:{color:C.ink, transparency:100} });
    } else {
      addRect(slide, 0.92, 2.08, 4.76, 3.70, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
      addDarkBreathingCircle(slide, 2.62, 2.58, 2.18, 1.18, C.cyan);
      if (hasEnergyCurveSemantics(s)) ctx.addPulseCurve(slide, 1.28, 3.78, 2.92, 0.42, C.cyan, true, { transparency:46, width:0.38, nodes:false });
    }
    addLabel(slide, 'PRIMARY OUTCOME', { x:1.22, y:4.70, w:1.28, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, lead.title, { x:1.22, y:5.02, w:2.80, h:0.22, fontSize:14.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, lead.body, { x:1.22, y:5.32, w:3.70, h:0.24, typeRole:'bodySmall', fontSize:8.8, color:'CBD5E1', fit:'shrink' });

    const signals = cards.slice(1,4);
    signals.forEach((card,i)=>{
      const y = 2.16 + i*1.12;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, 6.36, y, 5.26, 0.88, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.52} });
      addText(slide, String(i+2).padStart(2,'0'), { x:6.68, y:y+0.28, w:0.36, h:0.12, typeRole:'number', fontSize:7.0, bold:true, color:accent });
      addText(slide, card.title, { x:7.24, y:y+0.17, w:1.62, h:0.16, fontSize:12.1, bold:true, color:C.text, fit:'shrink' });
      addText(slide, card.body, { x:8.94, y:y+0.14, w:2.18, h:0.32, typeRole:'bodySmall', fontSize:8.8, color:C.body, fit:'shrink', valign:'mid' });
    });
    addRect(slide, 6.36, 5.72, 5.26, 0.62, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'VALUE CAPTION', { x:6.68, y:5.92, w:1.18, h:0.12, typeRole:'microLabel', fontSize:6.8, color:C.accent, charSpace:0.65 });
    addText(slide, s.note || '收益测算需结合站点发电量、电价规则、历史告警和运行数据进一步校准。', {
      x:8.02,
      y:5.88,
      w:3.18,
      h:0.20,
      typeRole:'caption',
      fontSize:8.4,
      color:'CBD5E1',
      fit:'shrink',
      breakLine:true
    });
    addEnergyFooter(slide, plan, false);
  }

  function energyDeploymentRadius(slide, plan, s, idx) {
    const C = colors();
    const W = canvasWidth();
    stageCanvas(slide, { field:false });
    const useImage = slideWantsImage(plan, s, 'timeline');
    if (useImage) {
      addVisualPhotoPanel(slide, plan, s, 'timeline', 0, 5.72, W, 1.00, { transparency:52 });
    } else {
      addRect(slide, 0, 5.72, W, 1.00, C.ink2, C.ink2, { fill:{color:C.ink2, transparency:36}, line:{color:C.ink2, transparency:100} });
    }
    addDarkBreathingCircle(slide, 8.42, 0.72, 4.08, 2.22, C.accent);
    addLabel(slide, 'DEPLOYMENT RADIUS', { x:0.84, y:0.72, w:1.62, h:0.12, fontSize:6.8, color:'64748B', charSpace:1.05 });
    addText(slide, s.title || '先选重点站点试点，再扩展区域集中运维', { x:0.82, y:1.08, w:7.20, h:0.36, fontSize:22.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, String(idx).padStart(2,'0'), { x:11.62, y:0.70, w:0.58, h:0.18, fontSize:10.5, bold:true, color:'64748B', align:'right' });

    const phases = (s.phases || []).slice(0,4);
    const y0 = 2.10;
    phases.forEach((phase,i)=>{
      const y = y0 + i*0.76;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addRect(slide, 0.92, y, 5.38, 0.56, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?18:44}, line:{color:accent, transparency:i===0?30:70, width:0.38} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:1.18, y:y+0.20, w:0.28, h:0.10, typeRole:'number', fontSize:7.0, color:accent });
      addText(slide, phase.title, { x:1.66, y:y+0.13, w:1.12, h:0.12, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, phase.body, { x:2.92, y:y+0.09, w:2.72, h:0.24, fontSize:8.8, color:'A8B3C3', fit:'shrink', valign:'mid' });
    });

    const panel = { x:7.05, y:1.78, w:4.72, h:3.70 };
    addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink2, '334155', { fill:{color:C.ink2, transparency:70}, line:{color:'334155', transparency:74, width:0.36} });
    addLabel(slide, 'PILOT TO REGION', { x:panel.x+0.34, y:panel.y+0.32, w:1.28, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.8 });
    const cx = panel.x + 2.42;
    const cy = panel.y + 2.08;
    [0.62,1.18,1.76].forEach((r,i)=>{
      slide.addShape('ellipse', { x:cx-r, y:cy-r, w:r*2, h:r*2, fill:{color:C.ink, transparency:100}, line:{color:i===0?C.accent:(i===1?C.cyan:'334155'), transparency:i===0?34:62, width:i===0?0.62:0.40} });
    });
    slide.addShape('ellipse', { x:cx-0.10, y:cy-0.10, w:0.20, h:0.20, fill:{color:C.accent}, line:{color:C.accent, transparency:100} });
    [
      [cx-1.18, cy-0.42, C.cyan, '重点站点'],
      [cx+1.32, cy-0.18, C.violet, '储能场景'],
      [cx+0.58, cy+1.16, '94A3B8', '区域中心']
    ].forEach(([x,y,color,label])=>{
      slide.addShape('ellipse', { x:x-0.055, y:y-0.055, w:0.11, h:0.11, fill:{color}, line:{color, transparency:100} });
      addText(slide, label, { x:x+0.16, y:y-0.08, w:0.82, h:0.13, fontSize:8.8, color:'A8B3C3', fit:'shrink' });
    });
    addText(slide, '3-5', { x:cx-0.38, y:cy-0.38, w:0.74, h:0.30, fontSize:20.0, bold:true, color:C.white, align:'center' });
    addLabel(slide, 'PILOT SITES', { x:cx-0.46, y:cy+0.10, w:0.90, h:0.10, fontSize:5.6, color:'64748B', charSpace:0.7, align:'center' });

    if (s.note) {
      addText(slide, s.note, { x:0.92, y:5.20, w:5.70, h:0.18, fontSize:8.8, bold:true, color:'CBD5E1', fit:'shrink' });
    }
    addLabel(slide, 'START SMALL · PROVE LOOP · SCALE REGIONALLY', { x:7.56, y:6.18, w:3.52, h:0.10, fontSize:5.8, color:'94A3B8', charSpace:0.7, align:'right' });
    addEnergyFooter(slide, plan, true);
  }

  return {
    energyDeploymentRadius,
    energyCapabilityLoop,
    energyProblemSplit,
    energySituationEditorial,
    energyToc,
    energyValueSignal
  };
}

module.exports = {
  createEnergyIndustryRenderers
};
