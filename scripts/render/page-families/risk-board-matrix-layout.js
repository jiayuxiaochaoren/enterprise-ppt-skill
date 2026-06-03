const {
  createRiskMatrixGateRenderer
} = require('./risk-board-matrix-gate');
const {
  createRiskMatrixGridRenderer
} = require('./risk-board-matrix-grid');
const {
  createRiskMatrixQueueRenderer
} = require('./risk-board-matrix-queue');

function createRiskBoardMatrixRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    addRect,
    addText,
  } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const { drawRiskMatrixGate } = createRiskMatrixGateRenderer(ctx);
  const { drawRiskMatrixGrid } = createRiskMatrixGridRenderer(ctx);
  const { drawRiskMatrixQueue } = createRiskMatrixQueueRenderer(ctx);

  function riskMatrixSlide(slide, plan, s, idx) {
    const darkRisk = false;
    drawRiskLightHeader(slide, s, idx, { kicker:'RISK MATRIX', fallbackTitle:'风险矩阵', titleW:5.5, chrome:true });
    const rows = (s.rows || []).slice(0,6);
    const gate = { x:0.92, y:2.12, w:2.48, h:3.96 };
    drawRiskMatrixGate(slide, plan, s, gate, darkRisk);

    const box = { x:3.78, y:2.14, w:3.78, h:3.74 };
    const { lineColor } = drawRiskMatrixGrid(slide, rows, box, darkRisk);
    drawRiskMatrixQueue(slide, rows, lineColor, darkRisk);
    addRect(slide, 0.92, 6.32, 8.96, 0.30, darkRisk ? (C.ink2 || C.ink) : (C.panelAlt || C.softBlue), lineColor, { fill:{color:darkRisk ? (C.ink2 || C.ink) : (C.panelAlt || C.softBlue), transparency:darkRisk ? 0 : 16}, line:{color:lineColor, transparency:100} });
    addRect(slide, 0.92, 6.32, 1.08, 0.30, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addText(slide, s.note || '先判断风险优先级，再展开重点处置动作。', { x:2.18, y:6.40, w:7.24, h:0.10, fontSize:7.6, color:darkRisk ? (C.darkMuted || '94A3B8') : C.body, fit:'shrink' });
    drawRiskBoardFooter(slide, plan, { dark:darkRisk });
  }

  return riskMatrixSlide;
}

module.exports = {
  createRiskBoardMatrixRenderer
};
