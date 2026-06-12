function createCaseTriptychGallery(ctx = {}, deps = {}) {
  const {
    addPhotoPanel,
    addRect,
    addText
  } = ctx;
  const C = ctx.colors();
  const { drawFooter } = deps;

  function renderCaseTriptychGallery(slide, plan, s, images, items) {
    const slots = [
      { x:0.92, y:2.05, w:3.34, h:3.82 },
      { x:4.52, y:2.05, w:3.34, h:3.82 },
      { x:8.12, y:2.05, w:3.34, h:3.82 }
    ];
    slots.forEach((slot, i) => {
      const item = items[i] || {};
      addPhotoPanel(slide, images[i], slot.x, slot.y, slot.w, slot.h, { tone:'dark', transparency:100, stroke:'E8DED8', strokeTransparency:10, fit:'cover' });
      addRect(slide, slot.x, slot.y + slot.h - 0.88, slot.w, 0.88, C.ink, C.ink, { fill:{color:C.ink, transparency:12}, line:{color:C.ink, transparency:100} });
      addText(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.28, y:slot.y+slot.h-0.58, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i===0?C.accent:C.cyan });
      addText(slide, item.title || `证据 ${i+1}`, { x:slot.x+0.74, y:slot.y+slot.h-0.62, w:1.56, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
      if (item.body) addText(slide, item.body, { x:slot.x+0.74, y:slot.y+slot.h-0.32, w:2.04, h:0.13, fontSize:7.0, color:'CBD5E1', fit:'shrink' });
    });
    addText(slide, s.note || '现场图、产品图与项目图共同构成交付能力的证据链。', { x:0.94, y:6.38, w:8.40, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { color:'738297' });
  }

  return {
    renderCaseTriptychGallery
  };
}

module.exports = {
  createCaseTriptychGallery
};
