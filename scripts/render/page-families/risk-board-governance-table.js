const {
  createRiskBoardGovernanceIntro
} = require('./risk-board-governance-intro');
const {
  createRiskBoardGovernanceTableGrid
} = require('./risk-board-governance-table-grid');

function createGovernanceTableEditorialRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const { addText } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const { drawGovernanceEditorialCore } = createRiskBoardGovernanceIntro(ctx);
  const { drawGovernanceActionTable } = createRiskBoardGovernanceTableGrid(ctx);

  return function governanceTableEditorial(slide, plan, s, idx) {
    drawRiskLightHeader(slide, s, idx, {
      kicker:'GOVERNANCE TABLE EDITORIAL',
      fallbackTitle:'治理机制表',
      titleW:6.1,
      titleSize:23.5,
      subtitle:s.claim || s.subtitle || '治理页把责任、节奏、证据和决策放到同一行。',
      subtitleW:7.0,
      chrome:true
    });
    const rows = (s.rows || []).slice(0, 4);
    const intro = { x:0.92, y:2.06, w:2.36, h:3.86 };
    drawGovernanceEditorialCore(slide, plan, s, intro);
    const table = { x:3.54, y:2.06, w:8.00, h:3.86 };
    drawGovernanceActionTable(slide, plan, rows, table);
    addText(slide, s.note || '治理表格不是风险清单，而是可追踪的管理机制。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawRiskBoardFooter(slide, plan);
  };
}

module.exports = {
  createGovernanceTableEditorialRenderer
};
