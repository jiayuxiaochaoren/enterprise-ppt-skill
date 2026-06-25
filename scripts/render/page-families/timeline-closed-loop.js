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
    const hasExternalNote = Boolean(String(s.note || '').trim());
    const header = drawDarkPageHeader(slide, {
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
    const contentY = Math.max(2.04, Number(header && header.contentTop) || 2.04);
    const roomyLoop = !hasExternalNote;
    const boardBottom = manufacturing && roomyLoop ? 6.58 : (roomyLoop ? 6.62 : 6.22);
    const board = { x:0.92, y:contentY, w:10.84, h:Math.max(0.10, boardBottom - contentY) };
    const cardW = 2.46;
    const cardH = manufacturing && roomyLoop ? 1.14 : 1.06;
    const topPad = manufacturing && roomyLoop ? 0.44 : (roomyLoop ? 0.52 : 0.70);
    const bottomPad = manufacturing && roomyLoop ? 0.34 : (roomyLoop ? 0.34 : 0.38);
    const topY = board.y + topPad;
    const bottomY = board.y + board.h - cardH - bottomPad;
    const middleGap = Math.max(0.18, bottomY - (topY + cardH));
    const pos = [
      { x:1.22, y:topY }, { x:8.46, y:topY },
      { x:8.46, y:bottomY }, { x:1.22, y:bottomY }
    ];
    drawTimelineClosedLoopBoard(slide, plan, s, board);
    drawTimelineClosedLoopPhaseCards(slide, phases, pos, { cardW, cardH });
    addText(slide, manufacturing ? '资料回流' : '复盘回流', {
      x:1.18,
      y:topY + cardH + Math.max(0.08, (middleGap - 0.10) / 2),
      w:0.74,
      h:0.10,
      fontSize:5.8,
      color:C.accent,
      fit:'shrink'
    });
    if (hasExternalNote) addText(slide, s.note, {
      x:0.92,
      y:board.y + board.h + 0.14,
      w:7.8,
      h:0.18,
      fontSize:9.0,
      color:C.darkMuted || '94A3B8',
      fit:'shrink'
    });
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createTimelineClosedLoop
};
