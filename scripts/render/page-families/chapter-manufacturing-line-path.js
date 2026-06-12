const {
  chapterItems
} = require('./chapter-content');
const {
  createChapterManufacturingLineCard
} = require('./chapter-manufacturing-line-card');

function createChapterManufacturingLinePath(ctx = {}) {
  const C = ctx.colors();
  const W = ctx.canvasWidth();
  const {
    addArrowLine,
    addHairline
  } = ctx;
  const { drawManufacturingLineCard } = createChapterManufacturingLineCard(ctx);

  function manufacturingLineItems(s) {
    const items = chapterItems(s);
    const fallback = [
      { title:'现场状态', body:'设备、报警和点检先进入事实表。' },
      { title:'维修闭环', body:'报修、派工、处置和验收可追踪。' },
      { title:'OEE 复盘', body:'把停机影响回写到策略更新。' }
    ];
    return (items.length ? items : fallback).slice(0, 4);
  }

  function drawManufacturingLinePath(slide, s) {
    const list = manufacturingLineItems(s);
    const cardW = 2.16;
    const cardMargin = 0.86;
    const cardY = 4.08;
    const rail = { x:cardMargin + cardW/2, y:3.42, w:W - (cardMargin + cardW/2) * 2 };
    addHairline(slide, rail.x, rail.y, rail.w, '334155', 12, 0.92);
    list.forEach((it, i) => {
      const step = list.length > 1 ? rail.w / (list.length - 1) : 0;
      const x = rail.x + i * step;
      const cardX = Math.min(Math.max(x - cardW/2, cardMargin), W - cardMargin - cardW);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : '94A3B8'));
      slide.addShape('ellipse', {
        x:x-0.14, y:rail.y-0.14, w:0.28, h:0.28,
        fill:{color:accent},
        line:{color:accent, transparency:100}
      });
      addHairline(slide, x, rail.y+0.20, 0, accent, 18, 0.80);
      slide.addShape('line', {
        x, y:rail.y+0.22, w:0, h:cardY-rail.y-0.22,
        line:{color:accent, transparency:30, width:0.62}
      });
      if (i < list.length - 1) addArrowLine(slide, x+0.32, rail.y, Math.max(0.1, step-0.64), 0, accent, {
        transparency:16,
        width:1.06
      });
      drawManufacturingLineCard(slide, it, i, { x:cardX, y:cardY, w:cardW, accent });
    });
  }

  return {
    drawManufacturingLinePath
  };
}

module.exports = {
  createChapterManufacturingLinePath
};
