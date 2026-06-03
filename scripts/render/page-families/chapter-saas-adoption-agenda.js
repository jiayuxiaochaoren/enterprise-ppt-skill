const {
  chapterItems
} = require('./chapter-content');
const { createPageFamilyPrimitives } = require('./primitives');

function createChapterSaasAdoptionAgendaRenderer(ctx = {}) {
  const C = ctx.colors();
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    addArrowLine,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill,
    publicSlideNote
  } = ctx;

  return function chapterSaasAdoptionAgenda(slide, plan, s, idx) {
    const chapter = s.chapter || String(idx).padStart(2, '0');
    drawLightPageHeader(slide, {
      kicker:s.label || 'ADOPTION PATH',
      title:s.title || '平台增长与客户采用',
      titleY:1.06,
      titleW:5.80,
      titleH:0.36,
      subtitle:s.subtitle || s.claim || '把产品能力、客户采用和商业结果放在同一条采用路径上。',
      subtitleW:6.30,
      idx
    });
    addText(slide, chapter, { x:9.92, y:0.92, w:1.32, h:0.46, fontSize:32, bold:true, color:C.softBlue || 'E9F2FA', align:'right', fit:'shrink' });

    const items = chapterItems(s);
    const list = (items.length ? items : [
      { title:'平台能力', body:'模块、集成、数据。' },
      { title:'客户采用', body:'激活、留存、扩展。' },
      { title:'商业结果', body:'ARR、NRR、毛利。' }
    ]).slice(0, 4);
    const stage = { x:0.92, y:2.18, w:10.64, h:3.64 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
    const x0 = stage.x + 0.58;
    const gap = (stage.w - 1.16) / Math.max(1, list.length);
    list.forEach((it,i)=>{
      const x = x0 + i*gap;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addRect(slide, x, stage.y+0.86, Math.min(2.20, gap-0.22), 1.36, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
        fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1 ? 0 : 10},
        line:{color:i===1 ? accent : C.line, transparency:i===1 ? 22 : 16, width:0.42}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.18, y:stage.y+1.18, w:0.30, h:0.10, fontSize:6.6, color:accent });
      addText(slide, itemTitle(it, `路径 ${i+1}`), { x:x+0.62, y:stage.y+1.10, w:1.02, h:0.15, fontSize:9.2, bold:true, color:i===1 ? C.white : C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.24, y:stage.y+1.58, w:1.50, h:0.18, fontSize:7.2, color:i===1 ? 'CBD5E1' : C.body, fit:'shrink', breakLine:true });
      if (i < list.length - 1) addArrowLine(slide, x + Math.min(2.20, gap-0.22) + 0.12, stage.y+1.54, Math.max(0.18, gap - Math.min(2.20, gap-0.22) - 0.46), 0, accent, { transparency:38, width:0.36 });
    });
    addRect(slide, stage.x+0.44, stage.y+2.76, stage.w-0.88, 0.36, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:stage.x+0.66, y:stage.y+2.84, w:stage.w-1.32, h:0.12, fontSize:8.0, color:C.body, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createChapterSaasAdoptionAgendaRenderer
};
