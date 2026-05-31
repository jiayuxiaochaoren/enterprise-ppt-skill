function createEvidenceProofBoardRenderers(ctx = {}) {
  const {
    PageNumber,
    addHairline,
    addLabel,
    addNumber,
    addPhotoPanel,
    addRect,
    addSmartPhotoPanel,
    addText,
    compactEvidenceCaption,
    footerText,
    galleryImages,
    genericShowcaseField,
    itemBody,
    itemBodyNoEllipsis,
    itemTitle,
    lightCanvas,
    panelFill,
    sectionKicker
  } = ctx;
  const C = ctx.colors();

  function consumerProofPhotoGrid(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'CONSUMER PROOF PHOTO GRID', 0.86, 0.72, false);
    addText(slide, s.title || '消费者场景证据', { x:0.84, y:1.05, w:6.1, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '每个场景都需要一句 caption 说明它证明什么。', { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:9.6, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);
    const images = galleryImages(plan, s);
    const items = (s.cards || s.items || s.lookbook || []).slice(0, 4);
    const slots = [
      { x:0.92, y:2.04, w:2.54, h:3.94, label:'SCENE', color:C.accent, title:'Official campaign image', body:'Source-bound visual proof.' },
      { x:3.74, y:2.04, w:2.54, h:3.94, label:'REASON', color:C.cyan, title:'Next-generation engagement', body:'Campaign logic and audience role.' },
      { x:6.56, y:2.04, w:2.54, h:3.94, label:'CHANNEL', color:C.violet, title:'Instagram / TikTok films', body:'Social-format launch evidence.' },
      { x:9.38, y:2.04, w:2.54, h:3.94, label:'BOUNDARY', color:C.accent, title:'Official source wording', body:'Claims remain source-bound.' }
    ];
    slots.forEach((slot, i) => {
      const item = items[i] || {};
      const slotImage = images[i] || images[0];
      addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? slot.color : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?slot.color:C.line, transparency:i===0?20:16, width:0.42} });
      if (slotImage) addSmartPhotoPanel(slide, slotImage, slot.x+0.14, slot.y+0.14, slot.w-0.28, 2.22, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26 });
      else {
        addRect(slide, slot.x+0.14, slot.y+0.14, slot.w-0.28, 2.22, C.panelAlt || C.softBlue, C.line, {
          fill:{color:C.panelAlt || C.softBlue, transparency:10},
          line:{color:C.line, transparency:28, width:0.36}
        });
        addNumber(slide, String(i + 1).padStart(2, '0'), {
          x:slot.x+0.36, y:slot.y+0.54, w:0.34, h:0.12,
          fontSize:7.0, color:slot.color, fit:'shrink'
        });
        addLabel(slide, slot.label, {
          x:slot.x+0.82, y:slot.y+0.56, w:0.88, h:0.09,
          fontSize:5.6, color:slot.color, charSpace:0.7
        });
        addHairline(slide, slot.x+0.36, slot.y+1.08, slot.w-0.72, slot.color, 22, 0.46);
        addText(slide, compactEvidenceCaption(itemTitle(item, slot.title), 18), {
          x:slot.x+0.36, y:slot.y+1.34, w:slot.w-0.72, h:0.24,
          fontSize:8.0, bold:true, color:C.text, fit:'shrink', align:'center', breakLine:true
        });
      }
      addLabel(slide, slot.label, { x:slot.x+0.20, y:slot.y+2.62, w:0.84, h:0.09, fontSize:5.8, color:slot.color, charSpace:0.7 });
      addText(slide, itemTitle(item, slot.title), {
        x:slot.x+0.20, y:slot.y+2.88, w:1.86, h:0.28,
        fontSize:8.8, bold:true, color:C.text, fit:false, breakLine:true
      });
      addText(slide, itemBodyNoEllipsis(item, slot.body), {
        x:slot.x+0.20, y:slot.y+3.34, w:1.86, h:0.34,
        fontSize:7.6, color:C.body, fit:false, breakLine:true, valign:'top'
      });
    });
    addText(slide, s.note || '消费者图像必须绑定场景、理由、购买或复购信号。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function productEvidenceStory(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'PRODUCT EVIDENCE STORY', 0.86, 0.72, false);
    addText(slide, s.title || '产品证据故事', { x:0.84, y:1.05, w:6.0, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '产品页要同时证明质地、功效和使用场景。', { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:9.6, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);
    const images = galleryImages(plan, s);
    const items = (s.cards || s.items || s.productStory || []).slice(0, 4);
    const hero = { x:0.92, y:2.04, w:5.44, h:4.02 };
    const heroCaptionH = 0.90;
    const heroImageH = hero.h - heroCaptionH - 0.22;
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    if (images[0]) addPhotoPanel(slide, images[0], hero.x+0.18, hero.y+0.18, hero.w-0.36, heroImageH, { tone:'light', transparency:96, stroke:'FFFFFF', strokeTransparency:70, fit:'cover' });
    else genericShowcaseField(slide, hero.x+0.18, hero.y+0.18, hero.w-0.36, heroImageH, 'HERO PRODUCT');
    addRect(slide, hero.x, hero.y+hero.h-0.90, hero.w, 0.90, C.ink, C.ink, { fill:{color:C.ink, transparency:12}, line:{color:C.ink, transparency:100} });
    const lead = items[0] || { title:'明星单品', body:'产品图必须解释购买理由。' };
    addLabel(slide, 'HERO PRODUCT PROOF', { x:hero.x+0.30, y:hero.y+hero.h-0.60, w:1.42, h:0.09, fontSize:5.8, color:C.accent, charSpace:0.7 });
    addText(slide, itemTitle(lead, '明星单品'), { x:hero.x+0.30, y:hero.y+hero.h-0.34, w:1.64, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBodyNoEllipsis(lead, '产品图解释购买理由和功效边界。'), {
      x:hero.x+2.34, y:hero.y+hero.h-0.42, w:2.42, h:0.26,
      fontSize:7.8, color:C.captionOnImage, fit:false, breakLine:true
    });

    const proof = { x:6.86, y:2.04, w:4.72, h:4.02 };
    addRect(slide, proof.x, proof.y, proof.w, proof.h, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:14, width:0.46} });
    ['TEXTURE', 'CLAIM', 'SCENE'].forEach((label, i) => {
      const item = items[i + 1] || {};
      const y = proof.y + 0.48 + i * 1.02;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addLabel(slide, label, { x:proof.x+0.28, y, w:0.82, h:0.09, fontSize:5.8, color:accent, charSpace:0.7 });
      addText(slide, itemTitle(item, i===0 ? '质地证据' : (i===1 ? '功效主张' : '使用场景')), {
        x:proof.x+1.18, y:y-0.04, w:1.42, h:0.22,
        fontSize:8.8, bold:true, color:C.text, fit:false, breakLine:true, valign:'mid'
      });
      addText(slide, itemBodyNoEllipsis(item, i===0 ? '发酵山茶成分主张' : (i===1 ? '长期研发背书' : '建议零售价与税费口径需注明来源')), {
        x:proof.x+2.76, y:y-0.06, w:1.58, h:0.30,
        fontSize:7.4, color:C.body, fit:false, breakLine:true, valign:'top'
      });
      addHairline(slide, proof.x+0.28, y+0.50, 3.86, C.line, 18, 0.30);
    });
    addText(slide, s.note || '产品证据页不能只有漂亮图片，必须解释购买理由和业务作用。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function executiveProofBoard(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'EXECUTIVE PROOF BOARD', 0.86, 0.72, false);
    addText(slide, s.title || '管理层证据板', { x:0.84, y:1.05, w:6.1, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || s.claim || '证据集合必须连接到管理层要确认的决策。', { x:0.86, y:1.52, w:7.0, h:0.20, fontSize:9.6, color:C.muted, fit:'shrink' });
    PageNumber(slide, idx);
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
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  return {
    consumerProofPhotoGrid,
    executiveProofBoard,
    productEvidenceStory
  };
}

module.exports = {
  createEvidenceProofBoardRenderers
};
