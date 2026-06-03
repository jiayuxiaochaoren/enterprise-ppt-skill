function createProductEvidenceProofList(ctx = {}) {
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    itemBodyNoEllipsis,
    itemTitle,
    panelFill
  } = ctx;
  const C = ctx.colors();

  function drawProductEvidenceProofList(slide, items, proof) {
    addRect(slide, proof.x, proof.y, proof.w, proof.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.46}
    });
    ['TEXTURE', 'CLAIM', 'SCENE'].forEach((label, i) => {
      const item = items[i + 1] || {};
      const y = proof.y + 0.48 + i * 1.02;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addLabel(slide, label, {
        x:proof.x+0.28, y, w:0.82, h:0.09,
        fontSize:5.8, color:accent, charSpace:0.7
      });
      addText(slide, itemTitle(item, i === 0 ? '质地证据' : (i === 1 ? '功效主张' : '使用场景')), {
        x:proof.x+1.18, y:y-0.04, w:1.42, h:0.22,
        fontSize:8.8, bold:true, color:C.text, fit:false, breakLine:true, valign:'mid'
      });
      addText(slide, itemBodyNoEllipsis(item, i === 0 ? '发酵山茶成分主张' : (i === 1 ? '长期研发背书' : '建议零售价与税费口径需注明来源')), {
        x:proof.x+2.76, y:y-0.06, w:1.58, h:0.30,
        fontSize:7.4, color:C.body, fit:false, breakLine:true, valign:'top'
      });
      addHairline(slide, proof.x+0.28, y+0.50, 3.86, C.line, 18, 0.30);
    });
  }

  return {
    drawProductEvidenceProofList
  };
}

module.exports = {
  createProductEvidenceProofList
};
