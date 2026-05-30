const family = 'architecture';

const types = [
  'architecture',
  'architecture-dark'
];

function createArchitectureRenderers(ctx = {}) {
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

  function architectureAdaptive(slide, plan, s, idx) {
    const variant = ctx.variantOf(s, 'layer-stack');
    if (variant === 'service-blueprint') return ctx.architectureServiceBlueprint(slide, plan, s, idx);
    if (variant === 'platform-capability-map') return ctx.architectureSaasCapabilityMap(slide, plan, s, idx);
    if (variant === 'production-topology') return ctx.architectureManufacturingTopology(slide, plan, s, idx);
    if (variant === 'blueprint-stack') return ctx.architectureBlueprint(slide, plan, s, idx);
    if (variant === 'hub-spoke') return ctx.architectureHubSpoke(slide, plan, s, idx);
    return architectureDark(slide, plan, s, idx);
  }

  return {
    architectureAdaptive,
    architectureDark
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
