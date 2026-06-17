const {
  createTimelineClosedLoopBoardRenderer
} = require('./timeline-closed-loop-board');
const {
  timelineClosedLoopPhases
} = require('./timeline-closed-loop-data');
const {
  createTimelineClosedLoopPhaseCardsRenderer
} = require('./timeline-closed-loop-phase-cards');

function createTimelineClosedLoop(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addText,
  } = ctx;
  const {
    drawDarkPageHeader,
    drawFooter
  } = deps;
  const { drawTimelineClosedLoopBoard } = createTimelineClosedLoopBoardRenderer(ctx);
  const { drawTimelineClosedLoopPhaseCards } = createTimelineClosedLoopPhaseCardsRenderer(ctx);

  return function timelineClosedLoop(slide, plan, s, idx) {
    const manufacturing = plan.industry === 'manufacturing-operations';
    drawDarkPageHeader(slide, {
      kicker:manufacturing ? '制造交付闭环' : '经营动作闭环',
      title:s.title || '流程闭环',
      titleW:manufacturing ? 5.66 : 6.2,
      titleH:0.40,
      subtitle:s.subtitle || s.claim,
      subtitleW:manufacturing ? 5.18 : 5.9,
      subtitleSize:manufacturing ? 9.8 : 10.4,
      idx
    });
    const phases = timelineClosedLoopPhases(s);
    const board = { x:0.92, y:2.04, w:10.84, h:4.18 };
    const pos = [
      { x:1.22, y:2.74 }, { x:8.46, y:2.74 },
      { x:8.46, y:4.78 }, { x:1.22, y:4.78 }
    ];
    const cardW = 2.46;
    const cardH = 1.06;
    drawTimelineClosedLoopBoard(slide, plan, s, board);
    drawTimelineClosedLoopPhaseCards(slide, phases, pos, { cardW, cardH });
    addText(slide, manufacturing ? '资料回流' : '复盘回流', { x:1.18, y:4.06, w:0.74, h:0.10, fontSize:5.8, color:C.accent, fit:'shrink' });
    if (s.note) addText(slide, s.note, { x:0.92, y:6.36, w:7.8, h:0.18, fontSize:9.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createTimelineClosedLoop
};
