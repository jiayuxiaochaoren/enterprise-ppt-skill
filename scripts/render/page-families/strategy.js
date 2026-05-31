const family = 'strategy';

const types = [
  'strategy-map',
  'module-matrix'
];

function createStrategyRenderers(ctx = {}) {
  const C = ctx.colors();
  const W = ctx.canvasWidth();
  const H = ctx.canvasHeight();
  const {
    addArrowLine,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    brandWorldBusinessProof,
    footerText,
    glassPanel,
    industryProfile,
    lightCanvas,
    panelFill,
    sectionKicker,
    singleObjectConceptMapSlide,
    valueCreationProcessMapSlide,
    variantOf
  } = ctx;

  function strategyMap(slide, plan, s, idx) {
    const strategyVariant = variantOf(s, '');
    if (strategyVariant === 'value-creation-process-map') return valueCreationProcessMapSlide(slide, plan, s, idx);
    if (strategyVariant === 'single-object-concept-map') return singleObjectConceptMapSlide(slide, plan, s, idx);
    if (strategyVariant === 'brand-world-and-business-proof') return brandWorldBusinessProof(slide, plan, s, idx);
    lightCanvas(slide);
    sectionKicker(slide, 'VALUE CREATION MAP', 0.86, 0.72, false);
    addText(slide, s.title || '价值创造路径', { x:0.84, y:1.05, w:5.7, h:0.36, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    if (s.claim || s.subtitle) addText(slide, s.claim || s.subtitle, { x:0.86, y:1.52, w:6.6, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const drivers = s.drivers || s.inputs || (s.left || []).slice(0,3);
    const actions = s.actions || s.capabilities || (s.cards || []).slice(0,4).map(c=>c.title);
    const outcomes = s.outcomes || s.outputs || (s.right || []).slice(0,3);

    const left = { x:0.92, y:2.10, w:2.50, h:3.86 };
    const center = { x:4.16, y:1.96, w:4.02, h:4.14 };
    const right = { x:8.72, y:2.10, w:2.92, h:3.86 };
    addRect(slide, left.x, left.y, left.w, left.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addRect(slide, center.x, center.y, center.w, center.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addRect(slide, right.x, right.y, right.w, right.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    addLabel(slide, 'INPUT', { x:left.x+0.28, y:left.y+0.34, w:0.80, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.leftTitle || '关键输入', { x:left.x+0.28, y:left.y+0.70, w:1.60, h:0.18, fontSize:12.6, bold:true, color:C.text, fit:'shrink' });
    (drivers || []).slice(0,3).forEach((it,i)=>{
      const y = left.y + 1.28 + i*0.66;
      addNumber(slide, String(i+1).padStart(2,'0'), { x:left.x+0.28, y:y-0.03, w:0.34, h:0.12, fontSize:7.2, color:i===0?C.accent:C.muted });
      addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:left.x+0.74, y:y-0.05, w:1.36, h:0.16, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      addHairline(slide, left.x+0.28, y+0.28, 1.74, C.line, 16, 0.38);
    });

    addLabel(slide, 'OPERATING MODEL', { x:center.x+0.34, y:center.y+0.34, w:1.55, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.9 });
    addText(slide, s.centerTitle || '运营动作', { x:center.x+0.34, y:center.y+0.78, w:1.70, h:0.20, fontSize:13.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, '把输入转译为可运营、可复盘、可放大的增长动作。', { x:center.x+0.34, y:center.y+1.12, w:3.10, h:0.14, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    (actions || []).slice(0,4).forEach((it,i)=>{
      const y = center.y + 1.62 + i*0.52;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.tertiary || C.violet : C.darkMuted || 'A8B3C3'));
      addRect(slide, center.x+0.34, y, 3.36, 0.34, C.ink2, C.darkLine || '334155', {
        fill:{color:C.ink2, transparency:26},
        line:{color:i===0?C.accent:(C.darkLine || '334155'), transparency:i===0?24:58, width:0.35}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:center.x+0.54, y:y+0.11, w:0.30, h:0.09, fontSize:6.4, color:accent });
      addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:center.x+1.00, y:y+0.08, w:1.78, h:0.12, fontSize:8.7, bold:true, color:C.white, fit:'shrink' });
    });

    addLabel(slide, 'OUTCOME', { x:right.x+0.28, y:right.y+0.34, w:0.88, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.rightTitle || '结果信号', { x:right.x+0.28, y:right.y+0.70, w:1.64, h:0.18, fontSize:12.6, bold:true, color:C.text, fit:'shrink' });
    (outcomes || []).slice(0,3).forEach((it,i)=>{
      const y = right.y + 1.22 + i*0.74;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addRect(slide, right.x+0.28, y, 2.20, 0.46, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i===0?C.accent:C.line, transparency:i===0?20:18, width:0.42}
      });
      slide.addShape('ellipse', { x:right.x+0.50, y:y+0.18, w:0.08, h:0.08, fill:{color:accent}, line:{color:accent, transparency:100} });
      addText(slide, typeof it === 'string' ? it : (it.title || it.label || ''), { x:right.x+0.72, y:y+0.13, w:1.50, h:0.13, fontSize:8.5, bold:true, color:C.text, fit:'shrink' });
    });
    addArrowLine(slide, left.x+left.w+0.24, 4.02, center.x-left.x-left.w-0.42, 0, C.accent, { transparency:14, width:0.72 });
    addArrowLine(slide, center.x+center.w+0.20, 4.02, right.x-center.x-center.w-0.28, 0, C.accent, { transparency:14, width:0.72 });
    addHairline(slide, 0.92, 6.34, 10.64, C.line, 14, 0.55);
    addText(slide, s.note || '价值流动、投入动作与经营结果保持在同一套链路中。', { x:0.96, y:6.54, w:8.90, h:0.13, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function moduleMatrix(slide, plan, s, idx) {
    slide.background = { color:'F7FAFD' };
    addRect(slide, 0, 0, W, H, 'F7FAFD', 'F7FAFD');
    addRect(slide, 0, 0, W, 0.92, 'FFFFFF', 'FFFFFF', { fill:{color:'FFFFFF', transparency:0}, line:{color:'FFFFFF', transparency:100} });
    sectionKicker(slide, 'CAPABILITY MAP', 0.86, 0.72, false);
    addText(slide, s.title, { x:0.84, y:1.05, w:4.8, h:0.35, fontSize:24, bold:true, color:C.text });
    if (s.intro) addText(slide, s.intro, { x:0.86, y:1.52, w:5.2, h:0.22, fontSize:10.8, color:C.muted });
    addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' });

    const cards = s.cards || [];
    const leftPanel = { x:0.92, y:2.20, w:2.92, h:3.42 };
    glassPanel(slide, leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h, false);
    addText(slide, 'CORE', { x:leftPanel.x+0.28, y:leftPanel.y+0.34, w:0.7, h:0.14, fontSize:8.0, color:C.muted, charSpace:1.1 });
    const industry = industryProfile(plan);
    addText(slide, s.coreTitle || industry.coreTitle || '运营能力地图', { x:leftPanel.x+0.28, y:leftPanel.y+0.86, w:2.12, h:0.28, fontSize:16.8, bold:true, color:C.text });
    addText(slide, s.coreBody || industry.coreBody || '以中心能力雷达串联关键模块，表达平台不是功能堆叠，而是围绕业务闭环形成能力场。', { x:leftPanel.x+0.28, y:leftPanel.y+1.54, w:2.06, h:0.78, fontSize:9.4, color:C.body, breakLine:true });
    addHairline(slide, leftPanel.x+0.28, leftPanel.y+2.70, 0.72, C.accent, 0, 0.75);

    const stage = { x:4.20, y:2.06, w:7.88, h:4.46 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, 'FFFFFF', 'E8EEF6', { fill:{color:'FFFFFF', transparency:18}, line:{color:'E8EEF6', transparency:18, width:0.55} });
    addText(slide, 'CAPABILITY FIELD', { x:stage.x+0.24, y:stage.y+0.20, w:1.55, h:0.12, fontSize:6.6, color:C.muted, charSpace:1.0 });

    const cx = stage.x + stage.w * 0.52;
    const cy = stage.y + stage.h * 0.54;
    const radarCards = cards.slice(0, Math.min(6, Math.max(4, cards.length || 4)));
    const radarCount = radarCards.length || 4;
    const radarRadius = 1.10;
    const radarPoint = (radius, i, count = radarCount) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / count;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    };
    const axis = Array.from({ length:radarCount }, (_, i) => radarPoint(radarRadius, i));
    [0.42,0.76,radarRadius].forEach((r,i)=>slide.addShape('ellipse', { x:cx-r, y:cy-r, w:r*2, h:r*2, fill:{color:C.softBlue, transparency:100}, line:{color:'D8E2EF', transparency:28+i*10, width:0.36} }));
    axis.forEach(([x,y])=>slide.addShape('line', { x:cx, y:cy, w:x-cx, h:y-cy, line:{color:'D8E2EF', transparency:70, width:0.26} }));
    const strengths = [0.78, 0.82, 0.70, 0.86, 0.66, 0.74];
    const poly = Array.from({ length:radarCount }, (_, i) => radarPoint(radarRadius * strengths[i % strengths.length], i));
    poly.forEach(([x,y],i)=>{ const [nx,ny]=poly[(i+1)%poly.length]; slide.addShape('line', { x, y, w:nx-x, h:ny-y, line:{color:C.accent, transparency:20, width:0.62} }); });
    slide.addShape('ellipse', { x:cx-0.07, y:cy-0.07, w:0.14, h:0.14, fill:{color:'F7FAFD', transparency:0}, line:{color:C.accent, transparency:0, width:0.38} });

    const labels = radarCount === 4
      ? [
          { x:stage.x+0.52, y:stage.y+0.58, w:2.36, h:0.64, anchor:axis[0] },
          { x:stage.x+5.28, y:stage.y+1.54, w:2.18, h:0.64, anchor:axis[1] },
          { x:stage.x+4.84, y:stage.y+3.46, w:2.42, h:0.64, anchor:axis[2] },
          { x:stage.x+0.54, y:stage.y+2.90, w:2.32, h:0.64, anchor:axis[3] }
        ]
      : axis.map((anchor) => {
          const right = anchor[0] > cx + 0.10;
          const left = anchor[0] < cx - 0.10;
          const x = right ? stage.x + 5.28 : (left ? stage.x + 0.50 : stage.x + 2.76);
          const y = Math.max(stage.y + 0.58, Math.min(stage.y + 3.50, anchor[1] - 0.28));
          return { x, y, w:2.24, h:0.64, anchor };
        });
    radarCards.forEach((c,i)=>{
      const {x,y,w,h,anchor} = labels[i];
      const accent = i===0?C.accent:(i===1?C.cyan:(i===3?C.violet:C.muted));
      slide.addShape('ellipse', { x:anchor[0]-0.045, y:anchor[1]-0.045, w:0.09, h:0.09, fill:{color:accent}, line:{color:accent, transparency:100} });
      addRect(slide, x, y, w, h, 'FFFFFF', 'FFFFFF', { fill:{color:'FFFFFF', transparency:8}, line:{color:'FFFFFF', transparency:100} });
      addText(slide, String(i+1).padStart(2,'0'), { x:x+0.02, y:y+0.02, w:0.30, h:0.11, typeRole:'caption', fontSize:7.5, bold:true, color:accent });
      addText(slide, c.title, { x:x+0.38, y:y, w:w-0.42, h:0.16, typeRole:'cardTitle', fontSize:10.5, bold:true, color:C.text, fit:'shrink' });
      addText(slide, c.body, { x:x+0.38, y:y+0.28, w:w-0.42, h:0.25, typeRole:'bodySmall', fontSize:8.25, color:C.body, fit:'shrink', breakLine:true });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
  }

  return {
    moduleMatrix,
    strategyMap
  };
}

function entries(renderers = {}) {
  return [
    { types:['strategy-map'], render:renderers.strategyMap, source:`page-family:${family}` },
    { types:['module-matrix'], render:renderers.moduleMatrix, source:`page-family:${family}` }
  ];
}

module.exports = {
  createStrategyRenderers,
  family,
  types,
  entries
};
