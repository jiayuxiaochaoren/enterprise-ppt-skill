function createEnergyDeploymentRenderers(ctx = {}, deps = {}) {
  const {
    addDarkBreathingCircle,
    addLabel,
    addNumber,
    addRect,
    addText,
    addVisualPhotoPanel,
    slideWantsImage,
    stageCanvas
  } = ctx;
  const colors = deps.colors || (() => ctx.colors());
  const canvasWidth = deps.canvasWidth || (() => typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333);
  const addEnergyFooter = deps.addEnergyFooter || (() => {});

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
      addNumber(slide, String(i+1).padStart(2,'0'), { x:1.18, y:y+0.22, w:0.28, h:0.10, typeRole:'number', fontSize:7.0, color:accent, valign:'mid' });
      addText(slide, phase.title, { x:1.66, y:y+0.20, w:1.12, h:0.14, fontSize:8.8, bold:true, color:C.white, fit:'shrink', valign:'mid' });
      addText(slide, phase.body, { x:2.92, y:y+0.14, w:2.72, h:0.26, fontSize:8.8, color:'A8B3C3', fit:'shrink', valign:'mid', breakLine:true });
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
    energyDeploymentRadius
  };
}

module.exports = {
  createEnergyDeploymentRenderers
};
