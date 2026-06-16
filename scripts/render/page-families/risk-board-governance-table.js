const {
  createRiskBoardGovernanceIntro
} = require('./risk-board-governance-intro');
const {
  createRiskBoardGovernanceTableGrid
} = require('./risk-board-governance-table-grid');

function createGovernanceTableEditorialRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const { addLabel, addRect, addText } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const { drawGovernanceEditorialCore } = createRiskBoardGovernanceIntro(ctx);
  const { drawGovernanceActionTable } = createRiskBoardGovernanceTableGrid(ctx);

  return function governanceTableEditorial(slide, plan, s, idx) {
    const header = drawRiskLightHeader(slide, s, idx, {
      kicker:'GOVERNANCE TABLE EDITORIAL',
      fallbackTitle:'治理机制表',
      titleW:6.1,
      titleSize:23.5,
      subtitle:s.claim || s.subtitle || '治理页把责任、节奏、证据和决策放到同一行。',
      subtitleW:7.0,
      chrome:true
    });
    const contentY = Math.max(2.06, Number(header && header.contentTop) || 2.06);
    const rows = (s.rows || []).slice(0, 4);
    const isPeopleCulture = plan && plan.industry === 'people-culture-company';
    if (isPeopleCulture) {
      const tableRows = rows.slice(0, 3);
      const overflow = rows.slice(3, 4)[0];
      const overflowRisk = overflow ? (Array.isArray(overflow) ? overflow[0] : overflow.title || overflow.label || '') : '';
      addRect(slide, 0.92, contentY, 10.64, 1.20, C.ink, C.ink, {
        fill:{ color:C.ink, transparency:0 },
        line:{ color:C.ink, transparency:100 }
      });
      addLabel(slide, '招聘治理', {
        x:1.18, y:contentY+0.22, w:1.08, h:0.10,
        fontSize:5.8, color:C.accent, charSpace:0
      });
      addText(slide, s.coreTitle || '表达与授权', {
        x:1.18, y:contentY+0.50, w:2.08, h:0.20,
        fontSize:13.6, bold:true, color:C.white, fit:'shrink'
      });
      addText(slide, s.coreBody || '岗位口径、人物授权和联系人信息需要在外发前统一校准。', {
        x:1.18, y:contentY+0.80, w:4.42, h:0.16,
        fontSize:7.2, color:C.captionOnImage, fit:'shrink', breakLine:true
      });
      [
        ['授权', C.accent, 7.06],
        ['口径', C.cyan, 8.04],
        ['联系人', C.violet, 9.02],
        ['下一步', '94A3B8', 10.00]
      ].forEach(item => {
        addRect(slide, item[2], contentY+0.42, 0.74, 0.24, item[1], item[1], {
          fill:{ color:item[1], transparency:22 },
          line:{ color:item[1], transparency:100 }
        });
        addLabel(slide, item[0], {
          x:item[2]+0.10, y:contentY+0.50, w:0.50, h:0.06,
          fontSize:4.8, color:item[1], charSpace:0
        });
      });
      const table = { x:0.92, y:contentY + 1.48, w:10.64, h:2.38 };
      drawGovernanceActionTable(slide, plan, tableRows, table);
      const note = overflowRisk
        ? `${s.note || '治理表格不是风险清单，而是招聘沟通的管理机制。'} 补充治理 ${overflowRisk}。`
        : (s.note || '治理表格不是风险清单，而是招聘沟通的管理机制。');
      addText(slide, note, { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:8.8, color:C.muted, fit:'shrink' });
      drawRiskBoardFooter(slide, plan);
      return;
    }
    const intro = { x:0.92, y:contentY, w:2.36, h:3.86 };
    drawGovernanceEditorialCore(slide, plan, s, intro);
    const table = { x:3.54, y:contentY, w:8.00, h:3.86 };
    drawGovernanceActionTable(slide, plan, rows, table);
    addText(slide, s.note || '治理表格不是风险清单，而是可追踪的管理机制。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawRiskBoardFooter(slide, plan);
  };
}

module.exports = {
  createGovernanceTableEditorialRenderer
};
