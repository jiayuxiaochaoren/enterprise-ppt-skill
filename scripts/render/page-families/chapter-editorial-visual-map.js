function createChapterEditorialVisualMapRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addDarkBreathingCircle,
    addLabel,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    itemBody,
    itemTitle
  } = ctx;

  function drawChapterEditorialVisualMap(slide, items, image, visual) {
    addRect(slide, visual.x, visual.y, visual.w, visual.h, C.ink2 || C.ink, '45222A', {
      fill:{ color:C.ink2 || C.ink, transparency:20 },
      line:{ color:'45222A', transparency:42, width:0.42 }
    });
    if (image) {
      addPhotoPanel(slide, image, visual.x+0.18, visual.y+0.18, visual.w-0.36, 3.18, {
        tone:'dark', transparency:30, stroke:'45222A', strokeTransparency:46, fit:'cover'
      });
      addRect(slide, visual.x, visual.y+3.66, visual.w, 1.32, C.ink, C.ink, {
        fill:{ color:C.ink, transparency:10 },
        line:{ color:C.ink, transparency:100 }
      });
      addLabel(slide, 'PATHWAY MAP', {
        x:visual.x+0.34, y:visual.y+3.96, w:1.18, h:0.10,
        fontSize:5.8, color:C.accent, charSpace:0.8
      });
      items.forEach((it,i)=>{
        const x = visual.x + 0.34 + i * 1.58;
        const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
        addNumber(slide, String(i+1).padStart(2,'0'), {
          x, y:visual.y+4.44, w:0.28, h:0.10,
          fontSize:6.4, color:accent
        });
        addText(slide, itemTitle(it), {
          x:x+0.40, y:visual.y+4.39, w:0.82, h:0.14,
          fontSize:8.2, bold:true, color:C.white, fit:'shrink'
        });
      });
      return;
    }

    addLabel(slide, '汇报路径', {
      x:visual.x+0.34, y:visual.y+0.34, w:1.18, h:0.12,
      fontSize:6.4, color:C.accent, charSpace:0
    });
    addDarkBreathingCircle(slide, visual.x+2.42, visual.y+0.20, 2.64, 1.50, C.accent);
    const list = (items || []).slice(0, 5);
    const startX = visual.x + 0.42;
    const startY = visual.y + 0.94;
    const gapY = list.length >= 5 ? 0.12 : 0.16;
    const cardW = visual.w - 0.84;
    const availableH = Math.max(0.82, visual.h - 1.04);
    const cardH = Math.min(0.68, Math.max(0.48, (availableH - gapY * Math.max(0, list.length - 1)) / Math.max(1, list.length)));
    list.forEach((it, i) => {
      const x = startX;
      const y = startY + i * (cardH + gapY);
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.darkMuted || C.muted));
      addRect(slide, x, y, cardW, cardH, C.ink, accent, {
        fill:{ color:C.ink, transparency:i === 0 ? 6 : 18 },
        line:{ color:accent, transparency:i === 0 ? 24 : 44, width:0.32 }
      });
      addNumber(slide, String(i+1).padStart(2,'0'), {
        x:x+0.18, y:y+0.22, w:0.26, h:0.10,
        fontSize:6.4, color:accent
      });
      addText(slide, itemTitle(it), {
        x:x+0.58, y:y+0.14, w:Math.max(0.84, cardW-0.86), h:0.16,
        fontSize:cardH < 0.58 ? 7.8 : 8.4, bold:true, color:C.white, fit:'shrink'
      });
      const body = itemBody(it);
      if (body) addText(slide, body, {
        x:x+0.58, y:y+Math.min(0.40, cardH - 0.24), w:Math.max(0.84, cardW-0.86), h:0.12,
        fontSize:cardH < 0.58 ? 5.8 : 6.3, color:C.darkMuted || 'A8B3C3', fit:'shrink'
      });
    });
  }

  return {
    drawChapterEditorialVisualMap
  };
}

module.exports = {
  createChapterEditorialVisualMapRenderer
};
