const {
  chapterItems
} = require('./chapter-content');

function createChapterAgendaBoard(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    drawChromePageNumber,
    drawDarkStageShell,
    drawFooter
  } = deps;
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    publicSlideNote
  } = ctx;

  return function chapterAgendaBoard(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:false },
      breathingCircle:{ x:8.52, y:0.28, w:4.38, h:2.42, color:C.accent },
      kicker:s.label || 'MEETING AGENDA',
      kickerOpts:{ x:0.86, y:0.90, w:1.64, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.0 }
    });
    const chapter = s.chapter || String(idx).padStart(2, '0');
    addText(slide, s.title || '议题与判断框架', { x:0.84, y:1.52, w:6.10, h:0.52, fontSize:28.0, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '先明确本章讨论顺序，再进入证据与决策。', { x:0.86, y:2.36, w:5.70, h:0.22, fontSize:10.2, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 0.88, 2.94, 0.92, C.accent, 0, 0.72);
    addText(slide, chapter, { x:10.42, y:1.06, w:1.10, h:0.50, fontSize:36, bold:true, color:C.accent, align:'right', fit:'shrink' });
    drawChromePageNumber(slide, idx, { fontSize:11.5 });
    const items = chapterItems(s).slice(0,4);
    const list = (items.length ? items : [{title:'背景判断'}, {title:'证据复盘'}, {title:'配置选择'}]).slice(0,3);
    addLabel(slide, 'DISCUSSION SEQUENCE', { x:0.92, y:3.78, w:1.64, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8 });
    list.forEach((it, i) => {
      const x = 0.92 + i*3.48;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : C.muted));
      addRect(slide, x, 4.24, 2.92, 1.24, C.ink2, '334155', { fill:{color:C.ink2, transparency:i === 0 ? 22 : 42}, line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 24 : 62, width:0.44} });
      addRect(slide, x, 4.24, 2.92, 0.04, accent, accent, { line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2, '0'), { x:x+0.24, y:4.58, w:0.34, h:0.12, fontSize:7.0, color:accent });
      addText(slide, itemTitle(it, `议题 ${i+1}`), { x:x+0.72, y:4.52, w:1.42, h:0.16, fontSize:10.2, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.24, y:4.96, w:2.20, h:0.20, fontSize:8.2, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:0.94, y:6.18, w:7.40, h:0.14, fontSize:8.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createChapterAgendaBoard
};
