const {
  createChapterManufacturingLineNote
} = require('./chapter-manufacturing-line-note');
const {
  createChapterManufacturingLinePath
} = require('./chapter-manufacturing-line-path');

function createChapterManufacturingLineAgenda(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    drawDarkStageShell,
    drawFooter
  } = deps;
  const {
    addNumber,
    addText
  } = ctx;
  const { drawManufacturingLineNote } = createChapterManufacturingLineNote(ctx);
  const { drawManufacturingLinePath } = createChapterManufacturingLinePath(ctx);

  return function chapterManufacturingLineAgenda(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:false },
      breathingCircle:{ x:8.40, y:0.70, w:4.10, h:2.24, color:C.accent },
      kicker:s.label || 'LINE OPERATING PATH',
      kickerOpts:{ x:0.84, y:0.82, w:1.84, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.05 }
    });
    const titleText = String(s.title || '');
    const isNavigationSlide = /汇报路径|导览|目录/.test(titleText);
    const chapter = s.chapter || String(idx).padStart(2, '0');
    addText(slide, s.title || '从关键产线开始建立闭环', { x:0.82, y:1.24, w:5.90, h:0.46, fontSize:25.0, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '先用一条产线跑通对象、工单、指标和复盘，再扩展到多车间协同。', { x:0.84, y:1.82, w:6.10, h:0.20, fontSize:9.8, color:C.captionOnImage, fit:'shrink' });
    if (!isNavigationSlide) {
      addNumber(slide, chapter, { x:10.82, y:0.92, w:0.72, h:0.28, fontSize:19.0, color:C.accent, align:'right', fit:'shrink' });
    }

    drawManufacturingLinePath(slide, s);
    drawManufacturingLineNote(slide, s);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createChapterManufacturingLineAgenda
};
