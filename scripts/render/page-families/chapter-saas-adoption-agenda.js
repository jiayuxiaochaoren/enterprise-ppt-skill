const {
  chapterItems
} = require('./chapter-content');
const { createPageFamilyPrimitives } = require('./primitives');

function createChapterSaasAdoptionAgendaRenderer(ctx = {}) {
  const C = ctx.colors();
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    addArrowLine,
    addCardToCardConnector,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill,
    publicSlideNote
  } = ctx;

  return function chapterSaasAdoptionAgenda(slide, plan, s, idx) {
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

    const items = chapterItems(s);
    const list = (items.length ? items : [
      { title:'平台能力', body:'模块、集成、数据。' },
      { title:'客户采用', body:'激活、留存、扩展。' },
      { title:'商业结果', body:'ARR、NRR、毛利。' }
    ]).slice(0, 4);
    const stage = { x:0.92, y:2.18, w:10.64, h:3.64 };
    addRect(slide, stage.x, stage.y, stage.w, stage.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.50} });
    const connectorGap = list.length > 1 ? 0.54 : 0;
    const cardW = Math.min(2.05, (stage.w - 1.16 - connectorGap * Math.max(0, list.length - 1)) / Math.max(1, list.length));
    const totalW = cardW * list.length + connectorGap * Math.max(0, list.length - 1);
    const x0 = stage.x + (stage.w - totalW) / 2;
    const cardBoxes = [];
    list.forEach((it,i)=>{
      const x = x0 + i*(cardW + connectorGap);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      const card = { x, y:stage.y+0.86, w:cardW, h:1.36, accent };
      cardBoxes.push(card);
      addRect(slide, card.x, card.y, card.w, card.h, i===1 ? C.ink : (C.panelAlt || C.softBlue), C.line, {
        fill:{color:i===1 ? C.ink : (C.panelAlt || C.softBlue), transparency:i===1 ? 0 : 10},
        line:{color:i===1 ? accent : C.line, transparency:i===1 ? 22 : 16, width:0.42}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.18, y:stage.y+1.18, w:0.30, h:0.10, fontSize:6.6, color:accent });
      addText(slide, itemTitle(it, `路径 ${i+1}`), { x:x+0.56, y:stage.y+1.10, w:Math.max(0.96, card.w-0.78), h:0.15, fontSize:8.8, bold:true, color:i===1 ? C.white : C.text, fit:'shrink' });
      addText(slide, itemBody(it), { x:x+0.24, y:stage.y+1.58, w:Math.max(1.22, card.w-0.48), h:0.18, fontSize:7.0, color:i===1 ? 'CBD5E1' : C.body, fit:'shrink', breakLine:true });
    });
    cardBoxes.slice(0, -1).forEach((card, i) => {
      const next = cardBoxes[i + 1];
      if (typeof addCardToCardConnector === 'function') {
        addCardToCardConnector(slide, card, next, card.accent, {
          gap:0.12,
          y:stage.y+1.54,
          endY:stage.y+1.54,
          transparency:34,
          width:0.36
        });
      } else {
        const startX = card.x + card.w + 0.12;
        const endX = next.x - 0.12;
        if (endX > startX) addArrowLine(slide, startX, stage.y+1.54, endX - startX, 0, card.accent, { transparency:34, width:0.36 });
      }
    });
    const note = publicSlideNote(s.note);
    if (note) {
      addRect(slide, stage.x+0.44, stage.y+2.76, stage.w-0.88, 0.36, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:8}, line:{color:C.line, transparency:100} });
      addText(slide, note, { x:stage.x+0.66, y:stage.y+2.84, w:stage.w-1.32, h:0.12, fontSize:8.0, color:C.body, fit:'shrink' });
    }
    drawFooter(slide, plan);
  };
}

module.exports = {
  createChapterSaasAdoptionAgendaRenderer
};
