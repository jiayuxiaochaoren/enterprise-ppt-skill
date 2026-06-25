function createRiskBoardMaterialityReadout(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addNumber,
    addRect,
    addText,
    compactEvidenceCaption,
    itemBody,
    itemTitle
  } = ctx;

  function governmentActionCopy(body = '') {
    return `年度动作：${body || '纳入年度推进机制。'}`;
  }

  function generalOperationsActionCopy(body = '') {
    return `推进动作：${body || '纳入季度经营推进表。'}`;
  }

  function drawMaterialityTopicReadout(slide, plan, s, rows, readout) {
    const governmentMateriality = plan && plan.industry === 'government-public-sector'
      && /materiality-matrix-board/i.test(String(s && (s.layoutVariant || s.variant || s.proofObject || s.proof_object) || ''));
    const generalOperationsMateriality = plan && plan.industry === 'general-operations'
      && /materiality-matrix-board/i.test(String(s && (s.layoutVariant || s.variant || s.proofObject || s.proof_object) || ''));
    addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, governmentMateriality ? '治理读数' : (generalOperationsMateriality ? '议题读数' : 'TOPIC READOUT'), {
      x:readout.x+0.28, y:readout.y+0.34, w:1.16, h:0.10,
      fontSize:5.8, color:C.accent, charSpace:(governmentMateriality || generalOperationsMateriality) ? 0 : 0.8
    });
    rows.slice(0, 4).forEach((r, i) => {
      const y = readout.y + 0.92 + i * 0.62;
      const accent = i === 0 ? C.risk : (i === 1 ? C.accent : C.cyan);
      addNumber(slide, String(i + 1).padStart(2, '0'), {
        x:readout.x+0.28, y:y+0.02, w:0.28, h:0.09,
        fontSize:6.2, color:accent
      });
      addText(slide, itemTitle(Array.isArray(r) ? { title:r[0] } : r, `议题 ${i+1}`), {
        x:readout.x+0.70, y, w:1.04, h:0.13,
        fontSize:8.4, bold:true, color:C.white, fit:'shrink'
      });
      const actionText = governmentMateriality
        ? governmentActionCopy(Array.isArray(r) ? (r[2] || '') : itemBody(r))
        : (generalOperationsMateriality
          ? generalOperationsActionCopy(Array.isArray(r) ? (r[2] || '') : itemBody(r))
          : (Array.isArray(r) ? (r[2] || '') : itemBody(r)));
      addText(slide, compactEvidenceCaption(actionText, (governmentMateriality || generalOperationsMateriality) ? 30 : 24), {
        x:readout.x+1.88, y, w:1.48, h:0.12,
        fontSize:6.8, color:C.captionOnImage, fit:'shrink'
      });
    });
  }

  return {
    drawMaterialityTopicReadout
  };
}

module.exports = {
  createRiskBoardMaterialityReadout
};
