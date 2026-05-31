const family = 'architecture';
const {
  createArchitectureEnergyRenderers
} = require('./architecture-energy');
const {
  createArchitectureIndustryRenderers
} = require('./architecture-industry');

const types = [
  'architecture',
  'architecture-dark'
];

function createArchitectureRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    footerText,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    sectionKicker,
    stageCanvas
  } = ctx;
  const {
    energyArchitecture
  } = createArchitectureEnergyRenderers(ctx);
  const {
    architectureManufacturingTopology,
    architectureSaasCapabilityMap,
    architectureServiceBlueprint
  } = createArchitectureIndustryRenderers(ctx);

  function architectureDark(slide, plan, s, idx) {
    // Platform section architecture v10: no overlaid vertical core card; core is a foreground capsule inside the application stratum.
    const C = ctx.colors();
    ctx.stageCanvas(slide);
    ctx.sectionKicker(slide, 'SYSTEM ARCHITECTURE', 0.84, 0.72, true);
    ctx.addText(slide, s.title, { x:0.82, y:1.08, w:5.8, h:0.36, fontSize:24, bold:true, color:C.white });
    if (s.subtitle) ctx.addText(slide, s.subtitle, { x:0.84, y:1.55, w:5.4, h:0.22, fontSize:10.8, color:'94A3B8' });
    ctx.addText(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, bold:true, color:'64748B', align:'right' });

    const layers = s.layers || [];
    const entrance = layers[0] || {title:'用户入口层', items:[]};
    const apps = layers[1] || {title:'业务应用层', items:[]};
    const data = layers[2] || {title:'数据支撑层', items:[]};
    const panelX = 2.45, panelW = 8.70;
    const layerDefs = [
      { layer: entrance, y:2.10, h:0.58, accent:C.accent, label:'ACCESS' },
      { layer: apps, y:3.18, h:1.18, accent:C.cyan, label:'APPLICATIONS' },
      { layer: data, y:5.02, h:0.64, accent:C.violet, label:'DATA FOUNDATION' }
    ];

    layerDefs.forEach((def, li)=>{
      const {layer,y,h,accent,label} = def;
      ctx.addText(slide, layer.title, { x:0.92, y:y+0.16, w:1.18, h:0.16, fontSize:9.6, bold:true, color:'CBD5E1' });
      ctx.addText(slide, label, { x:2.45, y:y-0.22, w:1.45, h:0.10, fontSize:6.5, color:'64748B', charSpace:0.8 });
      ctx.addRect(slide, panelX, y, panelW, h, C.ink2, '334155', { fill:{color:C.ink2, transparency:li===1?22:34}, line:{color:accent, transparency:li===1?44:68, width:0.48} });
      ctx.addHairline(slide, 2.10, y+h/2, 0.22, accent, 8, 0.65);
    });

    (entrance.items || []).slice(0,4).forEach((it,i)=>{
      const x = 2.76 + i*1.86;
      ctx.addText(slide, it, { x, y:2.29, w:1.24, h:0.13, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
    });

    // Business zones are derived from the current plan's application items; never hardcode an industry.
    const appItems = apps.items || [];
    const appGroups = [
      { title: appItems[0] || '核心应用', items: appItems.slice(1,2).join(' · '), x:2.86, w:2.20, accent:C.cyan },
      { title: appItems[2] || appItems[1] || '协同处置', items: appItems.slice(3,4).join(' · '), x:7.58, w:2.20, accent:C.accent },
      { title: appItems[4] || '策略复盘', items: appItems.slice(5,6).join(' · '), x:9.98, w:0.92, accent:C.violet }
    ];
    appGroups.forEach((g,i)=>{
      ctx.addRect(slide, g.x, 3.48, g.w, 0.48, C.ink2, '334155', { fill:{color:C.ink2, transparency:18}, line:{color:g.accent, transparency:i===0?30:62, width:0.4} });
      ctx.addText(slide, g.title, { x:g.x+0.12, y:3.59, w:g.w-0.24, h:0.12, fontSize:8.8, bold:true, color:C.white, align:'center', fit:'shrink' });
      if (g.items) ctx.addText(slide, g.items, { x:g.x+0.10, y:3.80, w:g.w-0.20, h:0.11, fontSize:8.8, color:'94A3B8', align:'center', fit:'shrink' });
    });
    // Foreground core capsule, intentionally on top and bounded inside the application stratum.
    ctx.addRect(slide, 5.66, 3.33, 1.22, 0.78, C.ink, C.accent, { fill:{color:C.ink, transparency:6}, line:{color:C.accent, transparency:22, width:0.55} });
    ctx.addText(slide, '统一运营核心', { x:5.78, y:3.54, w:0.98, h:0.14, fontSize:9.2, bold:true, color:C.white, align:'center', fit:'shrink' });
    ctx.addText(slide, '认证 · 流程 · 指标', { x:5.76, y:3.80, w:1.02, h:0.12, fontSize:8.8, color:'94A3B8', align:'center', fit:'shrink' });
    ctx.addHairline(slide, 5.08, 3.72, 0.58, '334155', 48, 0.38);
    ctx.addHairline(slide, 6.88, 3.72, 0.70, '334155', 48, 0.38);
    slide.addShape('line', { x:6.27, y:4.11, w:0, h:0.91, line:{color:C.violet, transparency:28, width:0.45} });

    (data.items || []).slice(0,7).forEach((it,i)=>{
      const x = 2.72 + i*1.12;
      ctx.addText(slide, it, { x, y:5.25, w:0.78, h:0.13, fontSize:8.8, color:'CBD5E1', bold:true, align:'center', fit:'shrink' });
      if (i>0) slide.addShape('line', { x:x-0.17, y:5.13, w:0, h:0.40, line:{color:'334155', transparency:56, width:0.3} });
    });
    ctx.addText(slide, '统一数据底座 · 统一服务入口 · 统一运营看板 · 统一闭环机制', { x:0.90, y:6.25, w:8.2, h:0.20, fontSize:12.2, bold:true, color:'CBD5E1' });
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
  }

  function architectureBlueprint(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'SOLUTION BLUEPRINT', 0.86, 0.72, false);
    addText(slide, s.title || '方案架构蓝图', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.1, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const layers = (s.layers || []).slice(0,5);
    addRect(slide, 0.92, 2.10, 2.76, 3.92, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'ARCHITECTURE LOGIC', { x:1.20, y:2.42, w:1.34, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '从业务入口到数据底座', { x:1.20, y:2.86, w:1.96, h:0.30, fontSize:15.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || '复杂方案先讲清系统边界、分层关系和关键接口。', { x:1.20, y:3.48, w:1.94, h:0.58, fontSize:8.2, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, 1.20, 4.48, 0.78, C.accent, 0, 0.68);
    addText(slide, s.note || '架构页应避免功能堆叠，优先表达“对象、动作、数据、治理”的关系。', { x:1.20, y:4.86, w:1.94, h:0.38, fontSize:7.1, color:C.darkMuted, breakLine:true, fit:'shrink' });

    const board = { x:4.18, y:2.04, w:7.32, h:4.10 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'LAYERED OPERATING SYSTEM', { x:board.x+0.34, y:board.y+0.26, w:1.82, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
    const rowH = 0.58;
    layers.forEach((layer,i)=>{
      const y = board.y + 0.72 + i*0.66;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, board.x+0.34, y, board.w-0.68, rowH, i===1 ? C.panelAlt : panelFill(), C.line, {
        fill:{color:i===1 ? C.panelAlt : panelFill(), transparency:i===1?8:0},
        line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.42}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:board.x+0.60, y:y+0.21, w:0.30, h:0.10, fontSize:6.8, color:accent });
      addText(slide, layer.title || layer.name || `层级 ${i+1}`, { x:board.x+1.04, y:y+0.15, w:1.28, h:0.15, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
      const items = (layer.items || []).slice(0,5);
      addText(slide, items.join('   /   '), { x:board.x+2.70, y:y+0.16, w:4.02, h:0.13, fontSize:8.4, color:C.body, fit:'shrink' });
    });
    addHairline(slide, board.x+0.34, 6.42, board.w-0.68, C.line, 16, 0.45);
    addText(slide, s.footerNote || '用蓝图把角色、系统、数据和责任放在同一张结构图中。', { x:board.x+0.34, y:6.60, w:5.8, h:0.12, fontSize:7.4, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function architectureHubSpoke(slide, plan, s, idx) {
    stageCanvas(slide);
    sectionKicker(slide, 'CONNECTED ARCHITECTURE', 0.84, 0.72, true);
    addText(slide, s.title || '协同架构', { x:0.82, y:1.08, w:5.9, h:0.36, fontSize:24, bold:true, color:C.white, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.55, w:5.5, h:0.22, fontSize:10.6, color:C.darkMuted || '94A3B8', fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
    const nodes = s.nodes || s.hubs || (s.layers || []).map(l => ({ title:l.title, body:(l.items || []).slice(0,3).join(' / ') }));
    const cx = 6.68, cy = 3.78;
    addRect(slide, cx-1.04, cy-0.56, 2.08, 1.12, C.ink, C.accent, { fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:22, width:0.56} });
    addText(slide, s.centerTitle || '统一平台核心', { x:cx-0.70, y:cy-0.20, w:1.40, h:0.16, fontSize:10.4, bold:true, color:C.white, align:'center', fit:'shrink' });
    addLabel(slide, 'DATA · PROCESS · GOVERNANCE', { x:cx-0.86, y:cy+0.14, w:1.72, h:0.09, fontSize:5.4, color:'64748B', align:'center', charSpace:0.55 });
    const pos = [
      [2.00,2.18], [5.02,2.06], [8.74,2.18],
      [9.10,4.98], [5.14,5.28], [1.92,4.98]
    ];
    nodes.slice(0,6).forEach((n,i)=>{
      const [x,y] = pos[i];
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      slide.addShape('line', { x:cx, y:cy, w:x+0.88-cx, h:y+0.40-cy, line:{color:accent, transparency:62, width:0.34} });
      addRect(slide, x, y, 1.76, 0.80, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?20:38}, line:{color:accent, transparency:i===0?24:58, width:0.42} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.18, y:y+0.22, w:0.28, h:0.10, fontSize:6.4, color:accent });
      addText(slide, itemTitle(n, `节点 ${i+1}`), { x:x+0.54, y:y+0.16, w:0.94, h:0.13, fontSize:8.5, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(n), { x:x+0.18, y:y+0.47, w:1.24, h:0.12, fontSize:6.6, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    addText(slide, s.note || '多角色、多系统、多区域之间的协同关系在同一网络中展开。', { x:0.90, y:6.42, w:7.60, h:0.16, fontSize:8.5, color:C.darkMuted || '94A3B8', fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
  }

  function architectureAdaptive(slide, plan, s, idx) {
    const variant = ctx.variantOf(s, 'layer-stack');
    if (variant === 'energy-topology') return energyArchitecture(slide, plan, s, idx);
    if (variant === 'service-blueprint') return architectureServiceBlueprint(slide, plan, s, idx);
    if (variant === 'platform-capability-map') return architectureSaasCapabilityMap(slide, plan, s, idx);
    if (variant === 'production-topology') return architectureManufacturingTopology(slide, plan, s, idx);
    if (variant === 'blueprint-stack') return architectureBlueprint(slide, plan, s, idx);
    if (variant === 'hub-spoke') return architectureHubSpoke(slide, plan, s, idx);
    return architectureDark(slide, plan, s, idx);
  }

  return {
    architectureAdaptive,
    architectureDark,
    architectureBlueprint,
    architectureHubSpoke,
    architectureManufacturingTopology,
    architectureSaasCapabilityMap,
    architectureServiceBlueprint,
    energyArchitecture
  };
}

function entries(renderers = {}) {
  return [
    { types:['architecture', 'architecture-dark'], render:renderers.architectureAdaptive, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createArchitectureRenderers,
  entries
};
