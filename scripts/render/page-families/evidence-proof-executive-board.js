const { createPageFamilyPrimitives } = require('./primitives');

function createExecutiveProofBoardRenderer(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const C = ctx.colors();

  return function executiveProofBoard(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'EXECUTIVE PROOF BOARD',
      title:s.title || '管理层证据板',
      titleW:6.1,
      titleSize:23.5,
      subtitle:s.subtitle || s.claim || '证据集合必须连接到管理层要确认的决策。',
      subtitleW:7.0,
      subtitleSize:9.6,
      idx,
      pageNumber:'chrome'
    });
    const items = (s.cards || s.items || s.facts || []).slice(0, 4);
    const decision = { x:0.92, y:2.04, w:3.22, h:3.98 };
    addRect(slide, decision.x, decision.y, decision.w, decision.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'DECISION IMPLICATION', { x:decision.x+0.30, y:decision.y+0.36, w:1.52, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    const decisionItem = items[3] || { title:'决策含义', body:s.note || '建议进入下一阶段。' };
    addText(slide, itemTitle(decisionItem, '决策含义'), { x:decision.x+0.30, y:decision.y+0.88, w:1.66, h:0.22, fontSize:13.4, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(decisionItem, s.note || '证据必须导向明确的管理动作。'), { x:decision.x+0.30, y:decision.y+1.54, w:1.98, h:0.54, fontSize:8.4, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addHairline(slide, decision.x+0.30, decision.y+2.58, 0.82, C.accent, 0, 0.62);
    addLabel(slide, 'METRIC · CASE · RISK', { x:decision.x+0.30, y:decision.y+3.16, w:1.42, h:0.10, fontSize:5.8, color:'64748B', charSpace:0.7 });

    const board = { x:4.72, y:2.04, w:6.74, h:3.98 };
    const slots = [
      { x:board.x, y:board.y, color:C.accent },
      { x:board.x+3.48, y:board.y, color:C.cyan },
      { x:board.x, y:board.y+2.08, color:C.risk },
      { x:board.x+3.48, y:board.y+2.08, color:C.violet }
    ];
    slots.forEach((slot, i) => {
      const item = items[i] || {};
      addRect(slide, slot.x, slot.y, 3.02, 1.56, panelFill(), i===0 ? slot.color : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?slot.color:C.line, transparency:i===0?20:16, width:0.42} });
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:slot.x+0.24, y:slot.y+0.30, w:0.30, h:0.09, fontSize:6.2, color:slot.color });
      addText(slide, itemTitle(item, `证据 ${i+1}`), { x:slot.x+0.70, y:slot.y+0.24, w:1.18, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, compactEvidenceCaption(itemBody(item), 38), { x:slot.x+0.24, y:slot.y+0.78, w:2.26, h:0.18, fontSize:7.2, color:C.body, fit:'shrink', breakLine:true });
    });
    addText(slide, s.note || '管理层证据板必须让证据连接到一个决策含义。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createExecutiveProofBoardRenderer
};
