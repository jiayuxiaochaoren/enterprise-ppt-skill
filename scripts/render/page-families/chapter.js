const family = 'chapter';

const types = ['chapter-divider'];

const {
  chapterItems
} = require('./chapter-content');
const {
  createChapterLayoutRenderers
} = require('./chapter-layouts');
const { createPageFamilyPrimitives } = require('./primitives');

function createChapterRenderers(ctx = {}) {
  const C = ctx.colors();
  const { drawDarkStageShell, drawFooter } = createPageFamilyPrimitives(ctx);
  const {
    addHairline,
    addNumber,
    addText,
    itemTitle,
    variantOf
  } = ctx;
  const {
    chapterAgendaBoard,
    chapterBoardBriefing,
    chapterEditorialAgenda,
    chapterManufacturingLineAgenda,
    chapterPathwayMap,
    chapterSaasAdoptionAgenda
  } = createChapterLayoutRenderers(ctx);

  function chapterHeroDivider(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:true },
      kicker:'CHAPTER',
      kickerOpts:{ x:0.86, y:0.94, w:1.38, h:0.14, fontSize:8.2, color:C.darkMuted, charSpace:0.8 }
    });
    const chapter = s.chapter || String(idx).padStart(2, '0');
    addText(slide, chapter, { x:0.82, y:1.54, w:2.10, h:0.70, fontSize:50, bold:true, color:C.accent, fit:'shrink' });
    addText(slide, s.title || '章节标题', { x:3.22, y:1.76, w:6.90, h:0.55, fontSize:29.5, bold:true, color:C.white, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:3.26, y:2.62, w:5.90, h:0.25, fontSize:11.2, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 3.26, 3.18, 0.92, C.accent, 0, 0.72);
    const items = chapterItems(s).slice(0,3);
    items.forEach((it,i)=>{
      const y = 4.22 + i*0.64;
      addNumber(slide, String(i+1).padStart(2,'0'), { x:3.30, y:y-0.01, w:0.48, h:0.18, fontSize:11.8, color:i===0?C.accent:C.cyan });
      addText(slide, itemTitle(it), { x:3.96, y:y-0.05, w:4.70, h:0.22, fontSize:15.0, bold:true, color:C.white, fit:'shrink' });
    });
    drawFooter(slide, plan, { color:C.darkMuted || 'D8CDD0' });
  }

  function chapterDivider(slide, plan, s, idx) {
    const variant = variantOf(s, 'chapter-hero');
    if (variant === 'agenda-board') return chapterAgendaBoard(slide, plan, s, idx);
    if (variant === 'board-briefing') return chapterBoardBriefing(slide, plan, s, idx);
    if (variant === 'pathway-map' || variant === 'service-path') return chapterPathwayMap(slide, plan, s, idx);
    if (variant === 'editorial-agenda' || variant === 'image-agenda') return chapterEditorialAgenda(slide, plan, s, idx);
    if (variant === 'line-agenda' || variant === 'manufacturing-line') return chapterManufacturingLineAgenda(slide, plan, s, idx);
    if (variant === 'adoption-agenda' || variant === 'saas-adoption') return chapterSaasAdoptionAgenda(slide, plan, s, idx);
    return chapterHeroDivider(slide, plan, s, idx);
  }

  return {
    chapterDivider
  };
}

function entries(renderers = {}) {
  return [
    { types, render:renderers.chapterDivider, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createChapterRenderers,
  entries
};
