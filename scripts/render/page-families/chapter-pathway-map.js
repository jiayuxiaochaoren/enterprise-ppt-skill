const {
  chapterItems
} = require('./chapter-content');

function createChapterPathwayMap(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const { drawFooter, drawLightPageHeader } = deps;
  const {
    addHairline,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill,
    publicSlideNote
  } = ctx;

  return function chapterPathwayMap(slide, plan, s, idx) {
    const chapter = s.chapter || String(idx).padStart(2, '0');
    drawLightPageHeader(slide, {
      kicker:s.label || 'SERVICE PATH',
      title:s.title || '路径与关键议题',
      titleY:1.06,
      titleW:5.80,
      titleH:0.36,
      subtitle:s.subtitle || s.claim || '把本章内容组织成可跟随的路径，而不是普通目录。',
      subtitleW:6.20,
      idx
    });
    addText(slide, chapter, { x:10.10, y:0.98, w:1.28, h:0.48, fontSize:36, bold:true, color:C.softBlue || 'E9F2FA', align:'right', fit:'shrink' });
    const items = chapterItems(s).slice(0,5);
    const list = items.length ? items : [{title:'触点'}, {title:'资源'}, {title:'质量'}];
    addRect(slide, 0.92, 2.20, 10.84, 3.70, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    const startX = 1.42;
    const y = 3.72;
    const step = list.length > 1 ? 9.10 / (list.length - 1) : 0;
    list.forEach((it,i)=>{
      const x = startX + i*step;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      slide.addShape('ellipse', { x:x-0.12, y:y-0.12, w:0.24, h:0.24, fill:{color:accent}, line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x-0.24, y:y-0.58, w:0.48, h:0.12, fontSize:7.0, color:accent, align:'center' });
      addText(slide, itemTitle(it, `阶段 ${i+1}`), { x:x-0.66, y:y+0.42, w:1.32, h:0.16, fontSize:10.2, bold:true, color:C.text, fit:'shrink', align:'center' });
      if (itemBody(it)) addText(slide, itemBody(it), { x:x-0.80, y:y+0.78, w:1.60, h:0.20, fontSize:7.6, color:C.body, fit:'shrink', align:'center' });
      if (i < list.length - 1) {
        const markerSize = 0.10;
        const endX = x + step - 0.34;
        const lineEndX = Math.max(x + 0.42, endX - markerSize * 0.50);
        addHairline(slide, x+0.34, y, lineEndX - (x+0.34), accent, 34, 0.36);
        slide.addShape('triangle', {
          x:endX - markerSize * 0.50,
          y:y - markerSize * 0.50,
          w:markerSize,
          h:markerSize,
          rotate:90,
          fill:{color:accent, transparency:18},
          line:{color:accent, transparency:100}
        });
      }
    });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:0.94, y:6.38, w:8.80, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createChapterPathwayMap
};
