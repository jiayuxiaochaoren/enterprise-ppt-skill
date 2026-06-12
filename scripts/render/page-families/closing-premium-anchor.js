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
    drawPremiumClosingVisual,
    resolvePremiumClosingImage
  } = createPremiumClosingVisual(ctx, C);

  return function premiumClosingAnchor(slide, plan, s, idx) {
    const imagePath = resolvePremiumClosingImage(plan, s);
    const premiumActions = Array.isArray(s.actions)
      ? s.actions.slice(0, 5).map(v => typeof v === 'string' ? { title:v, body:'' } : v)
      : closingActions(s);
    if (imagePath) {
      const W = ctx.canvasWidth ? ctx.canvasWidth() : 13.333;
      const H = ctx.canvasHeight ? ctx.canvasHeight() : 7.5;
      const paper = C.paper || 'FBF3EF';
      const textColor = C.text || '1C1A20';
      const muted = C.muted || '8A7A7F';
      slide.background = { color:paper };
      addRect(slide, 0, 0, W, H, paper, paper, {
        fill:{ color:paper, transparency:0 },
        line:{ color:paper, transparency:100 }
      });
      addRect(slide, 7.04, 0.60, 5.42, 6.28, C.white || 'FFFFFF', C.line || 'E8DED8', {
        fill:{ color:C.white || 'FFFFFF', transparency:100 },
        line:{ color:C.line || 'E8DED8', transparency:16, width:0.38 }
      });
      slide.addImage({
        path:imagePath,
        x:7.04,
        y:0.60,
        w:5.42,
        h:6.28,
        sizing:{ type:'cover', w:5.42, h:6.28 }
      });
      addText(slide, `上市收束 / ${String(idx || 11).padStart(2, '0')}`, {
        x:0.86, y:0.66, w:1.72, h:0.14, fontSize:7.4, bold:true, color:C.accent, fit:'shrink'
      });
      if (typeof ctx.markPageFolioRendered === 'function') ctx.markPageFolioRendered(slide);
      else slide.__codexPageFolioRendered = true;
      addText(slide, s.title || copyFallback(plan, 'closingTitle'), {
        x:0.82, y:1.06, w:5.72, h:1.04, fontSize:29.0, bold:true, color:textColor, fit:'shrink', breakLine:true
      });
      addText(slide, s.subtitle || s.decision || copyFallback(plan, 'closingSubtitle'), {
        x:0.88, y:2.42, w:5.28, h:0.28, fontSize:9.8, color:C.body || '5D5156', fit:'shrink', breakLine:true
      });
      addHairline(slide, 0.90, 2.92, 1.10, C.accent, 0, 0.72);
      drawPremiumClosingActions(slide, premiumActions, true);

      const decision = s.decision || s.claim || s.subtitle || s.note || copyFallback(plan, 'closingNote');
      addRect(slide, 0.88, 6.18, 5.80, 0.42, C.white || 'FFFFFF', C.accent, {
        fill:{ color:C.white || 'FFFFFF', transparency:0 },
        line:{ color:C.accent, transparency:32, width:0.42 }
      });
      addLabel(slide, 'FINAL DECISION', {
        x:1.10, y:6.32, w:1.10, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8
      });
      addText(slide, decision, {
        x:2.32, y:6.28, w:3.82, h:0.16,
        fontSize:8.3, color:C.body || '5D5156', breakLine:true, valign:'mid', fit:'shrink'
      });
      drawFooter(slide, plan, { color:muted });
      return;
    }

    drawDarkStageShell(slide, { stageOpts:{ field:false } });
    const hasImage = drawPremiumClosingVisual(slide, plan, s);
    addLabel(slide, hasImage ? '上市执行' : 'CLOSING ANCHOR', { x:0.88, y:0.62, w:1.58, h:0.13, fontSize:7.0, color:C.cyan, charSpace:hasImage ? 0 : 1.0 });
    addText(slide, s.title || copyFallback(plan, 'closingTitle'), {
      x:0.84, y:hasImage ? 0.98 : 1.18, w:hasImage ? 7.66 : 5.10, h:hasImage ? 0.90 : 1.22,
      fontSize:hasImage ? 29.2 : 32.0, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || s.decision || copyFallback(plan, 'closingSubtitle'), {
      x:0.88, y:hasImage ? 2.02 : 2.84, w:hasImage ? 6.44 : 4.80, h:hasImage ? 0.30 : 0.36,
      fontSize:hasImage ? 9.8 : 10.2, color:C.captionOnImage, fit:'shrink', breakLine:true
    });
    addHairline(slide, 0.90, hasImage ? 2.48 : 3.36, hasImage ? 1.26 : 1.04, C.accent, 0, 0.72);
    const decision = s.decision || s.claim || s.subtitle || s.note || copyFallback(plan, 'closingNote');
    const decisionBox = hasImage
      ? { x:0.92, y:6.02, w:11.50, h:0.50, labelX:1.20, labelY:6.20, textX:2.52, textY:6.13, textW:8.92, textH:0.18 }
      : { x:0.92, y:3.72, w:4.96, h:0.98, labelY:4.00, textY:3.90, textH:0.46 };
    addRect(slide, decisionBox.x, decisionBox.y, decisionBox.w, decisionBox.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:hasImage ? 10 : 20},
      line:{color:C.accent, transparency:36, width:0.42}
    });
    addLabel(slide, 'FINAL DECISION', {
      x:decisionBox.labelX || 1.18, y:decisionBox.labelY, w:1.20, h:0.10, fontSize:6.0, color:C.accent, charSpace:0.8
    });
    addText(slide, decision, {
      x:decisionBox.textX || 2.42, y:decisionBox.textY, w:decisionBox.textW || 3.04, h:decisionBox.textH,
      fontSize:8.6, color:C.captionOnImage, breakLine:true, valign:'mid', fit:'shrink'
    });

    drawPremiumClosingActions(slide, closingActions(s), hasImage);
    drawPremiumClosingContacts(slide, contactItemsForClosing(plan, s));
    drawFooter(slide, plan, { color:C.darkMuted || 'D8CDD0' });
  };
}

module.exports = {
  createPremiumClosingAnchor
};
