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

  function field(item = {}, keys = [], fallback = '') {
    if (typeof item === 'string') return keys.includes('title') ? item : fallback;
    return keys.map(key => item[key]).find(Boolean) || fallback;
  }

  function matrixRows(items = []) {
    return (items || []).slice(0, 4).map(item => ({
      product: field(item, ['product', 'sku', 'name', 'title', 'label'], '单品'),
      scene: field(item, ['scene', 'occasion', 'useCase', 'channel', 'context'], ''),
      proof: field(item, ['benefit', 'efficacy', 'claim', 'sellingPoint', 'body', 'note', 'description'], ''),
      business: field(item, ['businessMeaning', 'business', 'meaning', 'impact', 'outcome', 'value'], '')
    })).filter(row => row.product || row.scene || row.proof || row.business);
  }

  function drawProductEvidenceProofList(slide, items, proof) {
    const rows = matrixRows(items);
    addRect(slide, proof.x, proof.y, proof.w, proof.h, panelFill(), C.line, {
      fill:{color:panelFill(), transparency:0},
      line:{color:C.line, transparency:14, width:0.46}
    });
    addLabel(slide, '产品证据矩阵', {
      x:proof.x+0.28, y:proof.y+0.34, w:1.30, h:0.09,
      fontSize:5.8, color:C.accent, charSpace:0
    });
    addLabel(slide, '产品 / 场景 / 证据 / 经营', {
      x:proof.x+0.28, y:proof.y+0.74, w:2.18, h:0.09,
      fontSize:5.2, color:C.cyan, charSpace:0
    });
    const visibleRows = rows.length ? rows : matrixRows(items && items.length ? items : [{ title:'明星单品', body:'产品图解释购买理由和功效边界。' }]);
    visibleRows.slice(0, 4).forEach((row, rowIndex) => {
      const y = proof.y + 1.06 + rowIndex * 0.70;
      addText(slide, row.product || '', {
        x:proof.x+0.28, y, w:Math.max(1.6, proof.w-0.56), h:0.12,
        fontSize:7.2,
        bold:true,
        color:C.text,
        fit:'shrink'
      });
      const detail = [
        row.scene ? `场景 ${row.scene}` : '',
        row.proof ? `证明 ${row.proof}` : '',
        row.business ? `经营 ${row.business}` : ''
      ].filter(Boolean).join(' · ');
      addText(slide, detail, {
        x:proof.x+0.28, y:y+0.24, w:Math.max(1.6, proof.w-0.56), h:0.16,
        fontSize:6.6,
        color:C.body,
        fit:'shrink'
      });
      addHairline(slide, proof.x+0.28, y+0.48, proof.w-0.56, C.line, 18, 0.30);
    });
  }

  return {
    drawProductEvidenceProofList
  };
}

module.exports = {
  createProductEvidenceProofList
};
