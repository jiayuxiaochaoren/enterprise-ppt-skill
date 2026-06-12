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
    const allItems = chapterItems(s);
    const visualItems = allItems.slice(0, images[0] ? 3 : 5);
    const copyItems = images[0] ? allItems.slice(0, 3) : [];
    const visual = { x:6.36, y:1.02, w:5.72, h:4.98 };
    drawChapterEditorialVisualMap(slide, visualItems, images[0], visual);
    drawChapterEditorialCopy(slide, s, chapter, copyItems);
    drawFooter(slide, plan);
  }

  return {
    chapterEditorialAgenda
  };
}

module.exports = {
  createChapterEditorialRenderers
};
