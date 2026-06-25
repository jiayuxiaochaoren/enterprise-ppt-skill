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

  function isGovernmentMateriality(plan = {}, s = {}) {
    return plan.industry === 'government-public-sector'
      && /materiality-matrix-board/i.test(String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || ''));
  }

  function isGeneralOperationsMateriality(plan = {}, s = {}) {
    return plan.industry === 'general-operations'
      && /materiality-matrix-board/i.test(String(s.layoutVariant || s.variant || s.proofObject || s.proof_object || ''));
  }

  return function materialityMatrixBoard(slide, plan, s, idx) {
    const governmentMateriality = isGovernmentMateriality(plan, s);
    const generalOperationsMateriality = isGeneralOperationsMateriality(plan, s);
    drawRiskLightHeader(slide, s, idx, {
      kicker:governmentMateriality ? '园区治理矩阵' : (generalOperationsMateriality ? '经营议题矩阵' : 'MATERIALITY MATRIX'),
      fallbackTitle:'重要议题矩阵',
      titleW:6.1,
      titleSize:23.5,
      subtitle:s.claim || s.subtitle || (governmentMateriality
        ? '矩阵页要同时判断政策影响、经营影响和年度推进优先级。'
        : (generalOperationsMateriality
          ? '把经营影响、相关方关注和推进优先级放在同一张议题矩阵里。'
          : '矩阵页必须有双轴、优先区和可定位议题。')),
      subtitleW:7.0,
      chrome:true
    });
    const rows = (s.rows || []).slice(0, 6);
    const axes = s.axes || {};
    const matrix = { x:0.92, y:2.02, w:6.18, h:4.10 };
    drawMaterialityMatrixPlot(slide, plan, s, rows, axes, matrix);
    const readout = { x:7.62, y:2.02, w:3.78, h:4.10 };
    drawMaterialityTopicReadout(slide, plan, s, rows, readout);
    addText(slide, s.note || (governmentMateriality
      ? '议题定位必须解释年度优先级，而不是只列清单。'
      : (generalOperationsMateriality
        ? '议题位置必须能解释优先级、推进动作和结果影响。'
        : '议题位置必须能解释优先级，而不是只列清单。')), { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawRiskBoardFooter(slide, plan);
  };
}

module.exports = {
  createMaterialityMatrixBoard
};
