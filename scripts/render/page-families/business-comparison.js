function createBusinessComparisonRenderer(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    panelFill,
    profileFont,
    publicSlideNote
  } = ctx;
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;

  return function comparisonSlide(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'COMPARISON',
      title:s.title || '对比分析',
      titleW:5.5,
      subtitle:s.subtitle || s.claim,
      subtitleW:6.4,
      idx
    });
    const columns = (s.columns || [
      { title:s.leftTitle || '当前状态', body:(s.left || []).join(' / ') },
      { title:s.rightTitle || '升级后', body:(s.right || []).join(' / ') }
    ]).slice(0,2);
    const left = columns[0] || {};
    const right = columns[1] || {};
    const leftItems = Array.isArray(left.items) ? left.items : String(left.body || '').split(/[、/；;。]/).filter(Boolean).slice(0,3);
    const rightItems = Array.isArray(right.items) ? right.items : String(right.body || '').split(/[、/；;。]/).filter(Boolean).slice(0,3);
    const rows = Math.max(leftItems.length, rightItems.length, 3);
    const panelH = rows >= 5 ? 4.48 : (rows === 4 ? 4.08 : 3.88);
    const panel = { x:0.92, y:2.08, w:10.82, h:panelH };
    const rowStart = rows >= 5 ? 3.30 : 3.36;
    const maxStep = rows >= 5 ? 0.72 : 0.66;
    const rowStep = rows <= 1 ? maxStep : Math.min(maxStep, (panel.y + panel.h - rowStart - 0.22) / Math.max(1, rows - 1));
    const rowTextH = rows >= 5 ? 0.22 : 0.18;
    addRect(slide, panel.x, panel.y, panel.w, panel.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.55}
    });
    addRect(slide, 7.66, panel.y, 0.06, panel.h, C.accent, C.accent, { line:{color:C.accent, transparency:100} });
    addLabel(slide, 'CURRENT EXPERIENCE', { x:1.26, y:2.42, w:1.75, h:0.10, fontSize:5.8, color:C.muted, charSpace:0.8 });
    addLabel(slide, 'TARGET EXPERIENCE', { x:8.08, y:2.42, w:1.70, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, left.title || '升级前', { x:1.26, y:2.76, w:2.20, h:0.22, fontSize:15.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, right.title || '升级后', { x:8.08, y:2.76, w:2.20, h:0.22, fontSize:15.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, 'FROM', { x:4.54, y:2.74, w:0.48, h:0.10, fontSize:5.6, color:C.muted, charSpace:0.8, fontFace:profileFont('latin') });
    slide.addShape('line', { x:5.10, y:2.80, w:1.58, h:0, line:{color:C.accent, transparency:8, width:0.62, endArrowType:'triangle'} });
    addText(slide, 'TO', { x:6.84, y:2.74, w:0.28, h:0.10, fontSize:5.6, color:C.accent, charSpace:0.8, fontFace:profileFont('latin') });

    for (let i=0; i<rows; i++) {
      const y = rowStart + i * rowStep;
      const l = typeof leftItems[i] === 'string' ? leftItems[i] : ((leftItems[i] || {}).title || '');
      const r = typeof rightItems[i] === 'string' ? rightItems[i] : ((rightItems[i] || {}).title || '');
      addHairline(slide, 1.26, y-0.17, 9.70, C.line, 16, 0.45);
      addNumber(slide, String(i+1).padStart(2,'0'), { x:1.26, y:y-0.04, w:0.34, h:0.12, fontSize:7.2, color:i===0?C.accent:C.muted });
      addText(slide, l, { x:1.82, y:y-0.08, w:2.62, h:rowTextH, fontSize:9.4, color:C.body, fit:'shrink' });
      slide.addShape('line', { x:4.82, y:y+0.02, w:1.62, h:0, line:{color:C.line, transparency:2, width:0.48, endArrowType:'triangle'} });
      slide.addShape('ellipse', { x:6.72, y:y-0.035, w:0.10, h:0.10, fill:{color:C.accent}, line:{color:C.accent, transparency:100} });
      addText(slide, r, { x:8.08, y:y-0.08, w:2.62, h:rowTextH, fontSize:9.6, bold:i===0, color:C.text, fit:'shrink' });
    }
    const note = publicSlideNote(s.note);
    const noteY = Math.min(6.44, panel.y + panel.h + 0.18);
    if (note && noteY < 6.62) addText(slide, note, { x:0.96, y:noteY, w:8.8, h:0.14, fontSize:8.2, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createBusinessComparisonRenderer
};
