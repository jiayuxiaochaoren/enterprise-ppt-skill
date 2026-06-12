function createCatalogNote(ctx = {}) {
  const C = ctx.colors();
  const { addText } = ctx;

  function drawCatalogNote(slide, s, y = 6.42) {
    addText(slide, s.note || '产品对象、应用场景和证据说明保持在同一张产品谱系页。', {
      x:0.92, y, w:8.0, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink'
    });
  }

  return {
    drawCatalogNote
  };
}

module.exports = {
  createCatalogNote
};
