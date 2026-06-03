function createChapterBoardBriefingMemo(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    publicSlideNote
  } = ctx;

  function drawMeetingMemo(slide, s, chapter, memo) {
    addRect(slide, memo.x, memo.y, memo.w, memo.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, 'MEETING MEMO', {
      x:memo.x+0.30, y:memo.y+0.30, w:1.14, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7
    });
    addText(slide, chapter, {
      x:memo.x+1.72, y:memo.y+0.30, w:0.60, h:0.24, fontSize:16, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.coreTitle || '审议路径', {
      x:memo.x+2.76, y:memo.y+0.28, w:1.34, h:0.16, fontSize:10.6, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.coreBody || publicSlideNote(s.note) || '围绕关键判断、约束条件和资源投入组织审议顺序。', {
      x:memo.x+4.56, y:memo.y+0.28, w:4.88, h:0.18, fontSize:8.8, color:C.captionOnImage, fit:'shrink'
    });
    addHairline(slide, memo.x+9.74, memo.y+0.62, 0.58, C.accent, 0, 0.54);
  }

  return {
    drawMeetingMemo
  };
}

module.exports = {
  createChapterBoardBriefingMemo
};
