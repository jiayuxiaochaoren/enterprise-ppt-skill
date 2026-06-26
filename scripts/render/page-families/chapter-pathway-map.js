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

  function wrapPathBody(value = '', perLine = 12) {
    const text = String(value || '').trim().replace(/\s+/g, '');
    const tokens = text.match(/[A-Za-z0-9.+%/-]+|[\u3400-\u9fff]|[^\u3400-\u9fffA-Za-z0-9.+%/-]/g) || [];
    const unitOf = token => /[A-Za-z0-9.+%/-]+/.test(token)
      ? Math.max(1, Math.ceil(token.length * 0.55))
      : 1;
    const lines = [];
    let line = '';
    let units = 0;
    tokens.forEach(token => {
      const tokenUnits = unitOf(token);
      if (line && units + tokenUnits > perLine) {
        lines.push(line);
        line = token;
        units = tokenUnits;
      } else {
        line += token;
        units += tokenUnits;
      }
    });
    if (line) lines.push(line);
    return lines.join('\n');
  }

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
    const board = { x:0.92, y:2.20, w:10.84, h:3.70 };
    addRect(slide, board.x, board.y, board.w, board.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.52} });
    const cardGap = 0.16;
    const cardW = (board.w - 0.68 - cardGap * Math.max(0, list.length - 1)) / Math.max(1, list.length);
    const cardY = 4.02;
    const cardH = 1.52;
    const startX = board.x + 0.34 + cardW / 2;
    const y = 3.34;
    const step = list.length > 1 ? cardW + cardGap : 0;
    list.forEach((it,i)=>{
      const x = startX + i*step;
      const cardX = x - cardW / 2;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, cardX, cardY, cardW, cardH, i === 0 ? 'F3FAF7' : 'FBFEFC', C.line, {
        fill:{color:i === 0 ? 'F3FAF7' : 'FBFEFC', transparency:0},
        line:{color:i === 0 ? accent : C.line, transparency:i === 0 ? 22 : 36, width:0.30}
      });
      slide.addShape('ellipse', { x:x-0.12, y:y-0.12, w:0.24, h:0.24, fill:{color:accent}, line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x-0.24, y:y-0.58, w:0.48, h:0.12, fontSize:7.0, color:accent, align:'center' });
      addText(slide, itemTitle(it, `阶段 ${i+1}`), {
        x:cardX+0.14, y:cardY+0.18, w:cardW-0.28, h:0.16,
        fontSize:9.6, bold:true, color:C.text, fit:'shrink', align:'center'
      });
      if (itemBody(it)) addText(slide, wrapPathBody(itemBody(it), 12), {
        x:cardX+0.16, y:cardY+0.48, w:cardW-0.32, h:0.90,
        fontSize:8.8, color:C.body, fit:false, breakLine:true, align:'center', valign:'mid'
      });
      if (i < list.length - 1) {
        const markerSize = 0.10;
        const endX = x + step - 0.22;
        const lineEndX = Math.max(x + 0.42, endX - markerSize * 0.50);
        addHairline(slide, x+0.34, y, lineEndX - (x+0.34), accent, 30, 0.36);
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
