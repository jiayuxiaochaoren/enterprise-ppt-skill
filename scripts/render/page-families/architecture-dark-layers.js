function createArchitectureDarkLayersRenderer(ctx = {}) {
  const C = ctx.colors();

  function drawArchitectureDarkLayers(slide, entrance, apps, data) {
    const panelX = 2.45;
    const panelW = 8.70;
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

    (data.items || []).slice(0,7).forEach((it,i)=>{
      const x = 2.72 + i*1.12;
      ctx.addText(slide, it, { x, y:5.25, w:0.78, h:0.13, fontSize:8.8, color:'CBD5E1', bold:true, align:'center', fit:'shrink' });
      if (i>0) slide.addShape('line', { x:x-0.17, y:5.13, w:0, h:0.40, line:{color:'334155', transparency:56, width:0.3} });
    });
  }

  return {
    drawArchitectureDarkLayers
  };
}

module.exports = {
  createArchitectureDarkLayersRenderer
};
