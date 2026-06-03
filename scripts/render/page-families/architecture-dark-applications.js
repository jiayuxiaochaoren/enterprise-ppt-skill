function createArchitectureDarkApplicationsRenderer(ctx = {}) {
  const C = ctx.colors();

  function drawArchitectureDarkApplications(slide, apps) {
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
    ctx.addRect(slide, 5.66, 3.33, 1.22, 0.78, C.ink, C.accent, { fill:{color:C.ink, transparency:6}, line:{color:C.accent, transparency:22, width:0.55} });
    ctx.addText(slide, '统一运营核心', { x:5.78, y:3.54, w:0.98, h:0.14, fontSize:9.2, bold:true, color:C.white, align:'center', fit:'shrink' });
    ctx.addText(slide, '认证 · 流程 · 指标', { x:5.76, y:3.80, w:1.02, h:0.12, fontSize:8.8, color:'94A3B8', align:'center', fit:'shrink' });
    ctx.addHairline(slide, 5.08, 3.72, 0.58, '334155', 48, 0.38);
    ctx.addHairline(slide, 6.88, 3.72, 0.70, '334155', 48, 0.38);
    slide.addShape('line', { x:6.27, y:4.11, w:0, h:0.91, line:{color:C.violet, transparency:28, width:0.45} });
  }

  return {
    drawArchitectureDarkApplications
  };
}

module.exports = {
  createArchitectureDarkApplicationsRenderer
};
