function createConsumerProofInsightPanel(ctx = {}) {
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;
  const C = ctx.colors();

  function drawConsumerProofInsight(slide, s, insight) {
    addRect(slide, insight.x, insight.y, insight.w, insight.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, 'SHOPPER SIGNAL', {
      x:insight.x+0.30, y:insight.y+0.34, w:1.34, h:0.10,
      fontSize:6.8, color:C.accent, charSpace:0.8
    });
    addText(slide, s.storyTitle || '场景推动复购', {
      x:insight.x+0.30, y:insight.y+0.84, w:1.78, h:0.28,
      fontSize:15.2, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, s.storyBody || s.note || '消费者证据页要让图像承担证明作用：触点、理由、动作和复购信号彼此对应。', {
      x:insight.x+0.30, y:insight.y+1.54, w:2.14, h:0.74,
      fontSize:8.2, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, insight.x+0.30, insight.y+2.72, 0.86, C.accent, 0, 0.62);
    ['SCENE', 'REASON', 'REPEAT'].forEach((label, i) => {
      const color = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, insight.x+0.30+i*0.70, insight.y+3.16, 0.38, 0.10, color, color, {
        line:{color, transparency:100}
      });
      addText(slide, label, {
        x:insight.x+0.30+i*0.70, y:insight.y+3.34, w:0.48, h:0.10,
        fontSize:6.8, color:'94A3B8', align:'center', fit:'shrink'
      });
    });
  }

  return {
    drawConsumerProofInsight
  };
}

module.exports = {
  createConsumerProofInsightPanel
};
