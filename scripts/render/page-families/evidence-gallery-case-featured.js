function createCaseFeaturedGallery(ctx = {}, deps = {}) {
  const {
    addDarkBreathingCircle,
    addLabel,
    addPhotoPanel,
    addPulseCurve,
    addRect,
    addText
  } = ctx;
  const C = ctx.colors();
  const { drawFooter } = deps;

  function renderCaseFeaturedGallery(slide, plan, s, images, items) {
    const hero = images[0];
    const heroBox = { x:0.92, y:2.08, w:5.30, h:3.78 };
    const heroCaptionH = 0.98;
    const heroImageH = heroBox.h - heroCaptionH - 0.22;
    if (hero) {
      addRect(slide, heroBox.x, heroBox.y, heroBox.w, heroBox.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
      addPhotoPanel(slide, hero, heroBox.x+0.18, heroBox.y+0.18, heroBox.w-0.36, heroImageH, { tone:'light', transparency:96, stroke:'D8E2EF', strokeTransparency:28, fit:'cover' });
      addRect(slide, heroBox.x, heroBox.y + heroBox.h - heroCaptionH, heroBox.w, heroCaptionH, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
    } else {
      addRect(slide, heroBox.x, heroBox.y, heroBox.w, heroBox.h, C.ink, C.ink, { line:{color:C.ink, transparency:100} });
      addDarkBreathingCircle(slide, 2.42, 2.76, 2.74, 1.48, C.accent);
      addPulseCurve(slide, 1.34, 4.42, 3.20, 0.42, C.cyan, true, { transparency:48, width:0.38, nodes:false });
    }
    const lead = items[0] || { title:'核心案例', body:'以真实图片、现场截图、产品图或客户材料作为证据，不使用无关装饰图。' };
    addLabel(slide, 'PRIMARY CASE', { x:heroBox.x+0.30, y:heroBox.y+heroBox.h-0.66, w:1.20, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, lead.title || String(lead), { x:heroBox.x+0.30, y:heroBox.y+heroBox.h-0.38, w:2.72, h:0.16, fontSize:11.6, bold:true, color:C.white, fit:'shrink' });
    if (lead.body) addText(slide, lead.body, { x:heroBox.x+3.10, y:heroBox.y+heroBox.h-0.40, w:1.62, h:0.14, fontSize:6.7, color:'CBD5E1', fit:'shrink' });

    const slots = [
      { x:6.72, y:2.08, w:2.18, h:1.34 },
      { x:9.24, y:2.08, w:2.18, h:1.34 },
      { x:6.72, y:4.08, w:2.18, h:1.34 },
      { x:9.24, y:4.08, w:2.18, h:1.34 }
    ];
    const slotCount = Math.min(slots.length, Math.max(images.length - 1, items.length - 1, 0));
    slots.slice(0, slotCount).forEach((slot,i)=>{
      const img = images[i+1];
      if (img) {
        addPhotoPanel(slide, img, slot.x, slot.y, slot.w, slot.h, { tone:'dark', transparency:100, stroke:'E4ECF5', strokeTransparency:12 });
      } else {
        addRect(slide, slot.x, slot.y, slot.w, slot.h, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.52} });
      }
      const item = items[i+1] || {};
      addText(slide, String(i+2).padStart(2,'0'), { x:slot.x, y:slot.y+slot.h+0.18, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i===0?C.accent:C.muted });
      addText(slide, item.title || `证据 ${i+2}`, { x:slot.x+0.46, y:slot.y+slot.h+0.14, w:1.48, h:0.13, fontSize:8.3, bold:true, color:C.text, fit:'shrink' });
      if (item.body) addText(slide, item.body, { x:slot.x+0.46, y:slot.y+slot.h+0.40, w:1.54, h:0.12, fontSize:6.3, color:C.body, fit:'shrink' });
    });
    drawFooter(slide, plan, { color:'738297' });
  }

  return {
    renderCaseFeaturedGallery
  };
}

module.exports = {
  createCaseFeaturedGallery
};
