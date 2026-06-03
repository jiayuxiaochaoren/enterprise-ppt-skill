const {
  chapterItems
} = require('./chapter-content');
const {
  createChapterEditorialCopyRenderer
} = require('./chapter-editorial-copy');
const {
  createChapterEditorialVisualMapRenderer
} = require('./chapter-editorial-visual-map');
const { createPageFamilyPrimitives } = require('./primitives');

function createChapterEditorialRenderers(ctx = {}) {
  const { drawDarkStageShell, drawFooter } = createPageFamilyPrimitives(ctx);
  const {
    galleryImages,
  } = ctx;
  const { drawChapterEditorialCopy } = createChapterEditorialCopyRenderer(ctx);
  const { drawChapterEditorialVisualMap } = createChapterEditorialVisualMapRenderer(ctx);

  function chapterEditorialAgenda(slide, plan, s, idx) {
    drawDarkStageShell(slide, { stageOpts:{ field:false } });
    const chapter = s.chapter || String(idx).padStart(2, '0');
    const images = galleryImages(plan, s);
    const items = chapterItems(s).slice(0,3);
    const visual = { x:6.36, y:1.02, w:5.72, h:4.98 };
    drawChapterEditorialVisualMap(slide, items, images[0], visual);
    drawChapterEditorialCopy(slide, s, chapter, items);
    drawFooter(slide, plan);
  }

  return {
    chapterEditorialAgenda
  };
}

module.exports = {
  createChapterEditorialRenderers
};
