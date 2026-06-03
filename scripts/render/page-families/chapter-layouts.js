const {
  createChapterBoardBriefing
} = require('./chapter-board-briefing');
const {
  createChapterDarkLayoutRenderers
} = require('./chapter-dark-layouts');
const {
  createChapterEditorialRenderers
} = require('./chapter-editorial');
const {
  createChapterPathwayMap
} = require('./chapter-pathway-map');
const {
  createChapterSaasAdoptionAgendaRenderer
} = require('./chapter-saas-adoption-agenda');
const { createPageFamilyPrimitives } = require('./primitives');

function createChapterLayoutRenderers(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    chapterEditorialAgenda
  } = createChapterEditorialRenderers(ctx);
  const {
    chapterAgendaBoard,
    chapterManufacturingLineAgenda
  } = createChapterDarkLayoutRenderers(ctx);
  const chapterBoardBriefing = createChapterBoardBriefing(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const chapterPathwayMap = createChapterPathwayMap(ctx, {
    drawFooter,
    drawLightPageHeader
  });
  const chapterSaasAdoptionAgenda = createChapterSaasAdoptionAgendaRenderer(ctx);

  return {
    chapterAgendaBoard,
    chapterBoardBriefing,
    chapterEditorialAgenda,
    chapterManufacturingLineAgenda,
    chapterPathwayMap,
    chapterSaasAdoptionAgenda
  };
}

module.exports = {
  createChapterLayoutRenderers
};
