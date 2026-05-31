const family = 'toc';

const types = ['toc', 'toc-clean'];

function createTocRenderers(ctx = {}) {
  const C = ctx.colors();
  const W = ctx.canvasWidth();
  const H = ctx.canvasHeight();
  const {
    PageNumber,
    addHairline,
    addRect,
    addText,
    copyFallback,
    copyPolicyList,
    footerText,
    glassPanel,
    isCompanyIntroPlan
  } = ctx;

  function tocClean(slide, plan, s, idx) {
    const companyIntro = isCompanyIntroPlan(plan);
    slide.background = { color:C.ink };
    addRect(slide, 0, 0, W, H, C.ink, C.ink);
    slide.addShape('ellipse', { x:8.70, y:-0.74, w:4.90, h:4.90, fill:{color:C.accent, transparency:97}, line:{color:C.accent, transparency:90, width:0.45} });
    slide.addShape('ellipse', { x:9.96, y:0.52, w:2.58, h:2.58, fill:{color:C.ink, transparency:100}, line:{color:C.cyan, transparency:92, width:0.4} });
    slide.addShape('ellipse', { x:-1.45, y:5.22, w:3.10, h:3.10, fill:{color:C.cyan, transparency:94}, line:{color:C.cyan, transparency:100} });
    addText(slide, s.label || (companyIntro ? copyFallback(plan, 'tocTitle', '目录') : 'CONTENTS'), { x:0.78, y:0.96, w:1.65, h:0.16, fontSize:8.0, color:C.darkMuted || 'D8CDD0', charSpace:companyIntro ? 0 : 1.5 });
    addText(slide, '02', { x:0.70, y:1.42, w:2.25, h:0.82, fontSize:57, bold:true, color:'17233A' });
    addText(slide, s.title || copyFallback(plan, 'tocTitle', '目录'), { x:0.78, y:2.08, w:2.6, h:0.48, fontSize:28, bold:true, color:C.white });
    addHairline(slide, 0.82, 2.86, 0.86, C.accent, 0, 0.75);
    addText(slide, s.subtitle || copyFallback(plan, companyIntro ? 'tocCompanyIntroSubtitle' : 'tocSubtitle'), { x:0.80, y:3.42, w:3.05, h:0.38, fontSize:10.2, color:C.darkMuted || 'D8CDD0', breakLine:true });
    addText(slide, footerText(plan), { x:0.80, y:6.82, w:2.75, h:0.14, fontSize:7.5, color:C.darkMuted || 'D8CDD0' });

    const items = (s.items && s.items.length ? s.items : copyPolicyList(plan, 'tocItems', [])).slice(0, 5);
    glassPanel(slide, 4.82, 1.44, 6.18, 4.72, true);
    addText(slide, s.navigationLabel || (companyIntro ? '章节目录' : 'NAVIGATION SEQUENCE'), { x:5.20, y:1.78, w:2.15, h:0.13, fontSize:7.0, color:C.darkMuted || 'D8CDD0', charSpace:companyIntro ? 0 : 1.1 });
    slide.addShape('line', { x:5.32, y:2.28, w:0, h:3.00, line:{color:'334155', transparency:46, width:0.45} });
    items.slice(0,5).forEach((it,i)=>{
      const y = 2.24 + i*0.60;
      const active = i===0;
      const accent = active ? C.accent : (i===2 ? C.cyan : (i===4 ? C.violet : '94A3B8'));
      slide.addShape('ellipse', { x:5.27, y:y+0.05, w:0.10, h:0.10, fill:{color:accent}, line:{color:accent, transparency:100} });
      addText(slide, String(i+1).padStart(2,'0'), { x:5.70, y:y-0.01, w:0.35, h:0.12, fontSize:7.2, bold:true, color:accent });
      addText(slide, it, { x:6.30, y:y-0.04, w:3.40, h:0.16, fontSize:11.6, bold:true, color:active?C.white:'CBD5E1', fit:'shrink' });
      if (i<4) addHairline(slide, 6.30, y+0.34, 3.88, '334155', 72, 0.32);
    });
    addText(slide, '01—05', { x:9.82, y:5.36, w:0.58, h:0.14, fontSize:7.6, color:C.darkMuted || 'D8CDD0', align:'right' });
    PageNumber(slide, idx, { color:C.darkMuted || 'D8CDD0', fontSize:11.5 });
  }

  return {
    tocClean
  };
}

function entries(renderers = {}) {
  return [
    { types, render:renderers.tocClean, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createTocRenderers,
  entries
};
