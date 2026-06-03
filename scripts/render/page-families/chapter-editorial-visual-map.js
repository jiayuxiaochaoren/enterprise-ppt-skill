function createChapterEditorialVisualMapRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addDarkBreathingCircle,
    addLabel,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
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
    } else {
      addDarkBreathingCircle(slide, 8.34, 0.78, 4.16, 2.36, C.accent);
    }
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
  }

  return {
    drawChapterEditorialVisualMap
  };
}

module.exports = {
  createChapterEditorialVisualMapRenderer
};
