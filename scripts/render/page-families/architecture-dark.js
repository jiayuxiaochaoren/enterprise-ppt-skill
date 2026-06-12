const {
  createArchitectureDarkApplicationsRenderer
} = require('./architecture-dark-applications');
const {
  createArchitectureDarkLayersRenderer
} = require('./architecture-dark-layers');
const { createPageFamilyPrimitives } = require('./primitives');

function createArchitectureDarkRenderer(ctx = {}) {
  const { drawDarkPageHeader, drawFooter } = createPageFamilyPrimitives(ctx);
  const { drawArchitectureDarkApplications } = createArchitectureDarkApplicationsRenderer(ctx);
  const { drawArchitectureDarkLayers } = createArchitectureDarkLayersRenderer(ctx);

  return function architectureDark(slide, plan, s, idx) {
    // Platform section architecture v10: no overlaid vertical core card; core is a foreground capsule inside the application stratum.
    const C = ctx.colors();
    drawDarkPageHeader(slide, {
      kicker:'SYSTEM ARCHITECTURE',
      title:s.title,
      titleY:1.08,
      titleFit:false,
      subtitle:s.subtitle,
      subtitleY:1.55,
      subtitleW:5.4,
      subtitleH:0.22,
      subtitleSize:10.8,
      subtitleFit:false,
      idx,
      pageNumberMethod:'text',
      pageNumberOpts:{ color:'64748B' }
    });

    const layers = s.layers || [];
    const entrance = layers[0] || {title:'用户入口层', items:[]};
    const apps = layers[1] || {title:'业务应用层', items:[]};
    const data = layers[2] || {title:'数据支撑层', items:[]};

    drawArchitectureDarkLayers(slide, entrance, apps, data);
    drawArchitectureDarkApplications(slide, apps);
    ctx.addText(slide, '统一数据底座 · 统一服务入口 · 统一运营看板 · 统一闭环机制', { x:0.90, y:6.25, w:8.2, h:0.20, fontSize:12.2, bold:true, color:'CBD5E1' });
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createArchitectureDarkRenderer
};
