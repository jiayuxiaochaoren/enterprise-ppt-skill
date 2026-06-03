const {
  createChapterAgendaBoard
} = require('./chapter-agenda-board');
const {
  createChapterManufacturingLineAgenda
} = require('./chapter-manufacturing-line-agenda');
const { createPageFamilyPrimitives } = require('./primitives');

function createChapterDarkLayoutRenderers(ctx = {}) {
  const { drawChromePageNumber, drawDarkStageShell, drawFooter } = createPageFamilyPrimitives(ctx);
  const chapterAgendaBoard = createChapterAgendaBoard(ctx, {
    drawChromePageNumber,
    drawDarkStageShell,
    drawFooter
  });
  const chapterManufacturingLineAgenda = createChapterManufacturingLineAgenda(ctx, {
    drawDarkStageShell,
    drawFooter
  });

  return {
    chapterAgendaBoard,
    chapterManufacturingLineAgenda
  };
}

module.exports = {
  createChapterDarkLayoutRenderers
};
