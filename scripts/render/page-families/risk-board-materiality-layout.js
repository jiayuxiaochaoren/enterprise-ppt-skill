const {
  createRiskBoardMaterialityMatrixPlot
} = require('./risk-board-materiality-matrix-plot');
const {
  createRiskBoardMaterialityReadout
} = require('./risk-board-materiality-readout');

function createMaterialityMatrixBoard(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const { addText } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const { drawMaterialityMatrixPlot } = createRiskBoardMaterialityMatrixPlot(ctx);
  const { drawMaterialityTopicReadout } = createRiskBoardMaterialityReadout(ctx);

  return function materialityMatrixBoard(slide, plan, s, idx) {
    drawRiskLightHeader(slide, s, idx, {
      kicker:'MATERIALITY MATRIX',
      fallbackTitle:'重要议题矩阵',
      titleW:6.1,
      titleSize:23.5,
      subtitle:s.claim || s.subtitle || '矩阵页必须有双轴、优先区和可定位议题。',
      subtitleW:7.0,
      chrome:true
    });
    const rows = (s.rows || []).slice(0, 6);
    const axes = s.axes || {};
    const matrix = { x:0.92, y:2.02, w:6.18, h:4.10 };
    drawMaterialityMatrixPlot(slide, rows, axes, matrix);
    const readout = { x:7.62, y:2.02, w:3.78, h:4.10 };
    drawMaterialityTopicReadout(slide, rows, readout);
    addText(slide, s.note || '议题位置必须能解释优先级，而不是只列清单。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawRiskBoardFooter(slide, plan);
  };
}

module.exports = {
  createMaterialityMatrixBoard
};
