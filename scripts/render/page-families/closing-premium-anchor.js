const {
  createPremiumClosingActions
} = require('./closing-premium-actions');
const {
  createPremiumClosingVisual
} = require('./closing-premium-visual');

function createPremiumClosingAnchor(ctx = {}, deps = {}) {
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    copyFallback
  } = ctx;
  const C = ctx.colors();
  const {
    closingActions,
    contactItemsForClosing,
    drawDarkStageShell,
    drawFooter
  } = deps;
  const {
    drawPremiumClosingActions,
    drawPremiumClosingContacts
  } = createPremiumClosingActions(ctx, C);
  const {
    drawPremiumClosingVisual
  } = createPremiumClosingVisual(ctx, C);

  return function premiumClosingAnchor(slide, plan, s, idx) {
    drawDarkStageShell(slide, { stageOpts:{ field:false } });
    const hasImage = drawPremiumClosingVisual(slide, plan, s);
    addLabel(slide, 'CLOSING ANCHOR', { x:0.88, y:0.92, w:1.58, h:0.13, fontSize:7.0, color:C.cyan, charSpace:1.0 });
    addText(slide, s.title || copyFallback(plan, 'closingTitle'), {
      x:0.84, y:1.44, w:5.46, h:0.92, fontSize:27.2, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || s.decision || copyFallback(plan, 'closingSubtitle'), {
      x:0.88, y:2.68, w:5.34, h:0.30, fontSize:9.8, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, 0.90, 3.28, 0.92, C.accent, 0, 0.72);
    const decision = s.decision || s.claim || s.subtitle || s.note || copyFallback(plan, 'closingNote');
    const decisionBox = hasImage
      ? { x:0.92, y:5.58, w:4.96, h:0.68, labelY:5.78, textY:5.70, textH:0.28 }
      : { x:0.92, y:3.72, w:4.96, h:0.98, labelY:4.00, textY:3.90, textH:0.46 };
    addRect(slide, decisionBox.x, decisionBox.y, decisionBox.w, decisionBox.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:20},
      line:{color:C.accent, transparency:36, width:0.42}
    });
    addLabel(slide, 'FINAL DECISION', { x:1.18, y:decisionBox.labelY, w:1.20, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8 });
    addText(slide, decision, {
      x:2.42, y:decisionBox.textY, w:3.04, h:decisionBox.textH,
      fontSize:8.8, color:C.captionOnImage, breakLine:true, valign:'mid', fit:false
    });

    drawPremiumClosingActions(slide, closingActions(s), hasImage);
    drawPremiumClosingContacts(slide, contactItemsForClosing(plan, s));
    drawFooter(slide, plan, { color:C.darkMuted || 'D8CDD0' });
  };
}

module.exports = {
  createPremiumClosingAnchor
};
