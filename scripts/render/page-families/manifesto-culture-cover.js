function createCultureCoverSoftGeometry(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;
  const {
    drawDarkStageShell,
    drawFooter
  } = deps;

  return function cultureCoverSoftGeometry(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:true },
      breathingCircle:{ x:8.66, y:0.34, w:4.12, h:2.34, color:C.accent },
      kicker:'CULTURE COVER',
      kickerOpts:{ x:0.86, y:0.88, w:1.42, h:0.13, fontSize:7.0, color:C.cyan, charSpace:1.0 },
      idx,
      pageNumberMethod:'number',
      pageNumberOpts:{ x:11.70, y:0.74, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' }
    });
    addText(slide, s.statement || s.title || '文化不是口号，而是团队交付方式', {
      x:0.84, y:1.56, w:6.48, h:0.96, fontSize:31.0, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    addText(slide, s.claim || s.subtitle || '用组织场景、行为原则和产出证据说明文化如何发生。', {
      x:0.88, y:2.88, w:5.70, h:0.22, fontSize:10.4, color:C.captionOnImage, fit:'shrink'
    });
    addHairline(slide, 0.90, 3.42, 0.90, C.accent, 0, 0.72);
    const soft = [
      { x:7.72, y:2.00, w:2.62, h:1.18, color:C.accent, title:'行为', body:'能被观察' },
      { x:8.94, y:3.42, w:2.40, h:1.08, color:C.cyan, title:'场景', body:'能被复盘' },
      { x:6.82, y:4.44, w:2.36, h:1.04, color:C.violet, title:'产出', body:'能被证明' }
    ];
    soft.forEach((box, i) => {
      addRect(slide, box.x, box.y, box.w, box.h, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:24 + i * 8},
        line:{color:box.color, transparency:38, width:0.42}
      });
      addText(slide, box.title, { x:box.x+0.28, y:box.y+0.34, w:0.72, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
      addText(slide, box.body, { x:box.x+1.32, y:box.y+0.36, w:0.76, h:0.12, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink', align:'right' });
    });
    const values = (s.values || s.items || []).slice(0, 3);
    values.forEach((v, i) => {
      const y = 4.52 + i * 0.46;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:0.92, y:y+0.02, w:0.30, h:0.09, fontSize:6.2, color:accent });
      addText(slide, itemTitle(v, `原则 ${i + 1}`), { x:1.36, y:y, w:1.24, h:0.13, fontSize:8.7, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(v), { x:2.98, y:y, w:3.00, h:0.12, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createCultureCoverSoftGeometry
};
