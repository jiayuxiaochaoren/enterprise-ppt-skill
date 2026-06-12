const {
  createRiskResponsibilityBoardRenderer
} = require('./risk-board-responsibility-board');
const {
  riskResponsibilityItems
} = require('./risk-board-responsibility-data');

function createRiskResponsibilityLoopRenderer(ctx = {}, helpers = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;
  const {
    drawRiskBoardFooter,
    drawRiskLightHeader
  } = helpers;
  const drawRiskResponsibilityBoard = createRiskResponsibilityBoardRenderer(ctx, C);

  return function riskResponsibilityLoop(slide, plan, s, idx) {
    const header = drawRiskLightHeader(slide, s, idx, { kicker:'RESPONSIBILITY LOOP', fallbackTitle:'责任闭环与治理机制', titleW:5.8 });
    const contentY = Math.max(2.04, header.contentTop || 2.04);
    const contentH = Math.max(3.60, 6.20 - contentY);
    const dy = contentY - 2.04;

    const items = riskResponsibilityItems(s);
    const core = { x:0.92, y:contentY, w:2.86, h:contentH };
    addRect(slide, core.x, core.y, core.w, core.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'GOVERNANCE CORE', { x:core.x+0.30, y:core.y+0.38, w:1.36, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8 });
    addText(slide, s.coreTitle || '责任不落空', { x:core.x+0.30, y:core.y+0.86, w:1.72, h:0.28, fontSize:15.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.coreBody || '把风险、动作、责任人、证据和复盘节奏绑定在同一条治理链上。', {
      x:core.x+0.30, y:core.y+1.44, w:1.92, h:0.62, fontSize:8.8, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, core.x+0.30, core.y+2.36, 0.82, C.accent, 0, 0.62);
    [
      ['OWNER', s.ownerLabel || '唯一责任人'],
      ['SLA', s.slaLabel || '处置时限'],
      ['EVIDENCE', s.evidenceLabel || '过程留痕']
    ].forEach((row,i)=>{
      const y = core.y + 2.72 + i*0.52;
      addLabel(slide, row[0], { x:core.x+0.32, y, w:0.84, h:0.09, fontSize:5.4, color:i===0?C.accent:(i===1?C.cyan:C.violet), charSpace:0.42 });
      addText(slide, row[1], { x:core.x+1.18, y:y-0.015, w:1.22, h:0.12, fontSize:7.6, color:'CBD5E1', fit:'shrink' });
    });

    const board = { x:4.24, y:contentY, w:7.28, h:contentH };
    drawRiskResponsibilityBoard(slide, s, items, board);

    const note = s.note || '每项责任都有责任人、处置动作、过程证据和复盘节奏。';
    addText(slide, note, { x:0.94, y:Math.min(6.52, 6.52 + dy), w:9.2, h:0.14, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawRiskBoardFooter(slide, plan);
  };
}

module.exports = {
  createRiskResponsibilityLoopRenderer
};
