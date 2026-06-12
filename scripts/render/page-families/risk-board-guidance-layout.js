const {
  createGuidanceAssumptionCore
} = require('./risk-board-guidance-core');
const {
  createGuidanceRiskActionBoard
} = require('./risk-board-guidance-action-board');

function createGuidanceAndRiskBoardRenderer(ctx = {}, helpers = {}) {
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const { drawGuidanceAssumptionCore } = createGuidanceAssumptionCore(ctx);
  const { drawGuidanceRiskActionBoard } = createGuidanceRiskActionBoard(ctx);

  return function guidanceAndRiskBoard(slide, plan, s, idx) {
    const header = drawRiskLightHeader(slide, s, idx, {
      kicker:'GUIDANCE AND RISK BOARD',
      fallbackTitle:'指引与风险边界',
      titleW:6.0,
      titleSize:23.5,
      subtitle:s.claim || s.subtitle || '把增长假设、触发条件、责任和动作放在同一张管理板上。',
      subtitleW:7.0,
      chrome:true
    });
    const rows = (s.rows || []).slice(0, 4);
    const assumptions = Array.isArray(s.assumptions) ? s.assumptions : [];
    const contentY = Math.max(2.04, Number(header && header.contentTop) || 2.04);
    const contentH = Math.max(3.48, 6.04 - contentY);
    const core = { x:0.92, y:contentY, w:2.82, h:contentH };
    drawGuidanceAssumptionCore(slide, s, rows, assumptions, core);
    const board = { x:4.02, y:contentY, w:7.54, h:contentH };
    drawGuidanceRiskActionBoard(slide, rows, board);
    drawRiskBoardFooter(slide, plan);
  };
}

module.exports = {
  createGuidanceAndRiskBoardRenderer
};
