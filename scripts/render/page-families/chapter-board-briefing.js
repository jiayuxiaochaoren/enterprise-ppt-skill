const {
  chapterItems
} = require('./chapter-content');
const {
  createChapterBoardBriefingMemo
} = require('./chapter-board-briefing-memo');
const {
  createChapterBoardBriefingSequence
} = require('./chapter-board-briefing-sequence');

function createChapterBoardBriefing(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const { drawFooter, drawLightPageHeader } = deps;
  const {
    addText,
    publicSlideNote
  } = ctx;
  const { drawMeetingMemo } = createChapterBoardBriefingMemo(ctx);
  const { drawDecisionSequence } = createChapterBoardBriefingSequence(ctx);

  return function chapterBoardBriefing(slide, plan, s, idx) {
    const chapter = s.chapter || String(idx).padStart(2, '0');
    drawLightPageHeader(slide, {
      kicker:s.label || 'BOARD BRIEFING',
      title:s.title || '董事会汇报重点',
      titleY:1.06,
      titleW:6.20,
      titleH:0.40,
      titleSize:24.2,
      subtitle:s.subtitle || s.claim || '先明确审议事项、判断依据和下一步投入边界。',
      subtitleY:1.56,
      subtitleW:6.70,
      idx
    });
    const items = chapterItems(s);
    const list = (items.length ? items : [
      { title:'关键判断', body:'本轮需要形成的管理层共识。' },
      { title:'风险约束', body:'需要被董事会看见的边界条件。' },
      { title:'资源投入', body:'下一阶段投入、节奏和责任。' }
    ]).slice(0, 4);
    const memo = { x:0.92, y:2.14, w:10.64, h:1.28 };
    drawMeetingMemo(slide, s, chapter, memo);
    const board = { x:0.92, y:4.02, w:10.64, h:1.84 };
    drawDecisionSequence(slide, list, board);
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:0.94, y:6.34, w:8.90, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createChapterBoardBriefing
};
