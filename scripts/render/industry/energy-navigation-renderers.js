function createEnergyNavigationRenderers(ctx = {}, deps = {}) {
  const {
    addDarkBreathingCircle,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    addVisualPhotoPanel,
    hasEnergyCurveSemantics,
    slideWantsImage,
    stageCanvas
  } = ctx;
  const colors = deps.colors || (() => ctx.colors());
  const canvasWidth = deps.canvasWidth || (() => typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333);
  const addEnergyFooter = deps.addEnergyFooter || (() => {});
  function decorationsEnabled(plan = {}, s = {}) {
    return plan.decorations === true || plan.enableDecorations === true ||
      plan.enableDecorativeMotifs === true || s.enableDecorations === true ||
      s.enableDecorativeMotifs === true;
  }

  function energyToc(slide, plan, s, idx) {
    const C = colors();
    const W = canvasWidth();
    const allowDecorations = decorationsEnabled(plan, s);
    stageCanvas(slide, { field:false });
    const useImage = slideWantsImage(plan, s, 'navigation');
    if (useImage) {
      addVisualPhotoPanel(slide, plan, s, 'navigation', 0, 5.58, W, 1.28, { transparency:44 });
    } else if (allowDecorations) {
      addRect(slide, 0, 5.58, W, 1.28, C.ink2, C.ink2, { fill:{color:C.ink2, transparency:28}, line:{color:C.ink2, transparency:100} });
      if (hasEnergyCurveSemantics(s)) ctx.addPulseCurve(slide, 1.02, 5.90, 5.36, 0.36, C.cyan, true, { transparency:66, width:0.36, nodes:false });
    }
    if (allowDecorations) addDarkBreathingCircle(slide, 10.36, 0.36, 2.48, 1.22, C.accent);
    addLabel(slide, '运营序列', { x:0.84, y:0.72, w:1.72, h:0.14, fontSize:7.0, color:'64748B', charSpace:0 });
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
    const showConnectors = allowDecorations || plan.navigationConnectors === true || s.navigationConnectors === true;
    if (showConnectors) addHairline(slide, startX+0.18, y+1.08, 9.90, '334155', 34, 0.58);
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
      if (showConnectors && i < stages.length - 1) {
        slide.addShape('line', { x:x+cardW+0.03, y:y+0.72, w:gap+0.10, h:0, line:{color:'334155', transparency:30, width:0.40, endArrowType:'triangle'} });
      }
    });
    addLabel(slide, '站点 · 数据 · 告警 · 调度 · 价值', { x:7.94, y:6.18, w:3.28, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'94A3B8', charSpace:0, align:'right' });
    addEnergyFooter(slide, plan, true);
  }

  return {
    energyToc
  };
}

module.exports = {
  createEnergyNavigationRenderers
};
