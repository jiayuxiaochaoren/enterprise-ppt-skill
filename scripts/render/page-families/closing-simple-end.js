const {
  createRightSideCardRenderer
} = require('./right-side-card');

function createClosingSimpleEndRenderer(ctx = {}, deps = {}) {
  const { closingMeta, drawFooter } = deps;
  const C = ctx.colors();
  const W = typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    copyFallback,
    profileFont,
    surfaceFill,
    typeSize
  } = ctx;
  const {
    drawRightSideCard
  } = createRightSideCardRenderer(ctx);

  return function closingSimpleEnd(slide, plan, s, idx) {
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addRect(slide, 0.88, 0.84, 0.045, 5.72, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addLabel(slide, s.label || '结束页', { x:1.22, y:1.02, w:1.12, h:0.13, fontSize:6.9, color:C.accent, charSpace:0 });
    addText(slide, s.title || copyFallback(plan, 'closingSimpleTitle'), {
      x:1.18, y:2.02, w:5.90, h:0.82,
      fontSize:typeSize('coverTitle', 34.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || s.claim || copyFallback(plan, 'closingSimpleSubtitle'), {
      x:1.22, y:3.18, w:5.28, h:0.24,
      fontSize:11.4, color:C.body, fit:'shrink'
    });
    addRect(slide, 1.22, 3.78, 0.96, 0.045, C.accent, C.accent);
    addRect(slide, 2.32, 3.78, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:36}, line:{color:C.cyan, transparency:100} });
    if (s.note) addText(slide, s.note, { x:1.22, y:4.42, w:5.70, h:0.22, fontSize:9.0, color:C.muted, fit:'shrink' });

    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.54, y:0.72, w:0.62, h:0.20, fontSize:11.2, color:C.accent, align:'right', fit:'shrink' });
    const side = drawRightSideCard(slide, {}, { fill:C.ink, railColor:C.accent, railTransparency:18 });
    const sideWord = s.endWord || s.sideWord || '收束';
    const sideMeta = closingMeta(plan);
    const sideNote = s.note || s.claim || s.subtitle || copyFallback(plan, 'closingSimpleSubtitle');
    addText(slide, sideWord, { x:side.x+0.46, y:side.y+0.42, w:1.50, h:0.46, fontFace:profileFont('editorial'), fontSize:25.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
    addLabel(slide, '下一步', { x:side.x+0.56, y:side.y+1.10, w:1.22, h:0.10, fontSize:5.8, color:C.darkMuted || 'A8B3C3', align:'right', charSpace:0 });
    addHairline(slide, side.x+0.50, side.y+1.88, 1.04, C.accent, 0, 0.56);
    addText(slide, sideNote, { x:side.x+0.50, y:side.y+2.30, w:1.62, h:0.46, fontSize:8.0, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    const sideRows = Array.isArray(s.actions) && s.actions.length
      ? s.actions.map(item => typeof item === 'string' ? { title:item, body:'' } : item)
      : [
        { title:'范围', body:'试点验证' },
        { title:'口径', body:'统一复盘' },
        { title:'节奏', body:'进入倒计时' }
      ];
    sideRows.slice(0, 3).forEach((row, i) => {
      const y = side.y + 3.36 + i * 0.36;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addText(slide, String(i + 1).padStart(2, '0'), { x:side.x+0.50, y, w:0.28, h:0.10, fontSize:5.8, bold:true, color:accent, fit:'shrink' });
      addText(slide, row.title || '', { x:side.x+0.88, y:y-0.03, w:0.58, h:0.12, fontSize:7.0, bold:true, color:C.captionOnImage, fit:'shrink' });
      addText(slide, row.body || '', { x:side.x+1.48, y:y-0.03, w:0.70, h:0.12, fontSize:6.6, color:C.darkMuted || '94A3B8', fit:'shrink', align:'right' });
    });
    if (sideMeta) addText(slide, sideMeta, { x:side.x+0.50, y:side.y+4.58, w:1.62, h:0.16, fontSize:6.8, color:C.darkMuted || '94A3B8', fit:'shrink' });
    addHairline(slide, 1.18, 6.42, 6.82, C.line, 16, 0.55);
    drawFooter(slide, plan, { x:1.18, y:6.72, w:7.0, h:0.14, fontSize:7.4, fit:'shrink' });
  };
}

module.exports = {
  createClosingSimpleEndRenderer
};
