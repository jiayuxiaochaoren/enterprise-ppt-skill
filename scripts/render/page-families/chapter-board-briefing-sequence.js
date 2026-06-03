function createChapterBoardBriefingSequence(ctx = {}) {
  const C = ctx.colors();
  const {
    addArrowLine,
    addLabel,
    addNumber,
    addRect,
    addText,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;

  function drawDecisionSequence(slide, list, board) {
    addLabel(slide, 'DECISION SEQUENCE', {
      x:board.x, y:3.62, w:1.48, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.7
    });
    list.forEach((it,i)=>{
      const x = board.x + i*2.72;
      const w = i === 3 ? 2.18 : 2.36;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, x, board.y, w, board.h, i===0 ? (C.panelAlt || C.softBlue) : panelFill(), C.line, {
        fill:{color:i===0 ? (C.panelAlt || C.softBlue) : panelFill(), transparency:i===0?8:0},
        line:{color:i===0?accent:C.line, transparency:i===0?22:18, width:0.38}
      });
      addRect(slide, x, board.y, w, 0.04, accent, accent, {
        line:{color:accent, transparency:100}
      });
      addNumber(slide, String(i+1).padStart(2,'0'), {
        x:x+0.22, y:board.y+0.34, w:0.32, h:0.10, fontSize:6.8, color:accent
      });
      addText(slide, itemTitle(it, `议题 ${i+1}`), {
        x:x+0.22, y:board.y+0.72, w:1.34, h:0.15, fontSize:9.0, bold:true, color:C.text, fit:'shrink'
      });
      addText(slide, itemBody(it), {
        x:x+0.22, y:board.y+1.16, w:1.66, h:0.20, fontSize:8.2, color:C.body, fit:'shrink', breakLine:true
      });
      if (i < list.length - 1) addArrowLine(slide, x+w+0.10, board.y+0.92, 0.22, 0, accent, {
        transparency:34, width:0.32
      });
    });
  }

  return {
    drawDecisionSequence
  };
}

module.exports = {
  createChapterBoardBriefingSequence
};
