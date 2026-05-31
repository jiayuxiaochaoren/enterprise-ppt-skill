const {
  evidenceGalleryRendererKey
} = require('./evidence-gallery-routing');
const {
  createEvidenceBrandStoryRenderers
} = require('./evidence-brand-stories');
const {
  createEvidenceIndustryRenderers
} = require('./evidence-industry');
const {
  createEvidenceProofBoardRenderers
} = require('./evidence-proof-boards');

function createEvidenceGalleryCoreRenderers(ctx = {}) {
  const {
    addArrowBetweenRects,
    addArrowLine,
    addDarkBreathingCircle,
    addEvidenceCaptionStack,
    addHairline,
    addLabel,
    addNumber,
    addPhotoPanel,
    addPulseCurve,
    addRect,
    addSmartPhotoPanel,
    addText,
    chooseEvidenceImageLayout,
    fileExists,
    footerText,
    galleryImages,
    genericShowcaseField,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    resolveAssetPath,
    sectionKicker,
    stageCanvas
  } = ctx;
  const C = ctx.colors();
  const {
    peopleProofMosaic,
    retailLookbookStory,
    sustainabilityProofSpread
  } = createEvidenceBrandStoryRenderers(ctx);
  const {
    energySiteEvidenceGallery,
    financePortfolioEvidenceGallery,
    healthcareTouchpointEvidenceGallery,
    saasPrototypeFlowGallery
  } = createEvidenceIndustryRenderers(ctx);
  const {
    consumerProofPhotoGrid,
    executiveProofBoard,
    productEvidenceStory
  } = createEvidenceProofBoardRenderers(ctx);

  function caseEvidenceHero(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'CASE PROOF', 0.86, 0.72, false);
    addText(slide, s.title || '案例证据', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.intro) addText(slide, s.subtitle || s.intro, { x:0.86, y:1.52, w:6.0, h:0.20, fontSize:9.2, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const images = galleryImages(plan, s);
    const items = s.items || s.cards || [];
    const hero = images[0];
    if (hero) addPhotoPanel(slide, hero, 0.92, 2.02, 6.38, 3.98, { tone:'dark', transparency:100, stroke:C.line, strokeTransparency:20 });
    else genericShowcaseField(slide, 0.92, 2.02, 6.38, 3.98, 'CASE EVIDENCE');
    addRect(slide, 0.92, 5.06, 6.38, 0.94, C.ink, C.ink, { fill:{color:C.ink, transparency:10}, line:{color:C.ink, transparency:100} });
    const lead = items[0] || { title:s.case || '核心案例', body:s.claim || '以真实项目、现场或客户材料作为证据。' };
    addLabel(slide, 'PRIMARY CASE', { x:1.24, y:5.34, w:1.18, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, itemTitle(lead, '核心案例'), { x:2.70, y:5.30, w:2.00, h:0.14, fontSize:9.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, itemBody(lead), { x:4.82, y:5.30, w:1.70, h:0.13, fontSize:6.6, color:'CBD5E1', fit:'shrink' });
    const facts = (s.facts || items.slice(1)).slice(0,4);
    facts.forEach((f,i)=>{
      const y = 2.14 + i*0.90;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      addRect(slide, 7.86, y, 3.54, 0.62, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.42} });
      addEvidenceCaptionStack(slide, f, `证据 ${i+1}`, { x:8.12, y:y+0.10, w:2.84, h:0.42 }, {
        number:i+1,
        accent,
        titleSize:8.8,
        bodySize:7.8,
        titleH:0.12,
        bodyY:0.24,
        bodyH:0.12,
        maxBodyChars:22
      });
    });
    addText(slide, s.note || '单案例页保留主证据与少量可验证事实，便于客户快速判断落地质量。', { x:7.88, y:5.88, w:3.30, h:0.14, fontSize:7.4, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function caseEvidenceBoard(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'EVIDENCE BOARD', 0.86, 0.72, false);
    addText(slide, s.title || '案例证据板', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.intro) addText(slide, s.subtitle || s.intro, { x:0.86, y:1.52, w:6.0, h:0.20, fontSize:9.2, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const images = galleryImages(plan, s);
    const items = s.items || s.cards || [];
      if (images.length === 4 && items.length <= 4) {
        const layout = chooseEvidenceImageLayout(images, {
          role:'evidence',
          layout:s.galleryLayout || s.imageLayout,
          featured: !!s.heroImage
        });
        if (layout === 'vertical-strip' || layout === 'screenshot-board') {
          const photoW = layout === 'vertical-strip' ? 1.38 : 2.14;
          const slots = [
            { x:0.92, y:2.04, w:2.42, h:3.94 },
            { x:3.64, y:2.04, w:2.42, h:3.94 },
            { x:6.36, y:2.04, w:2.42, h:3.94 },
            { x:9.08, y:2.04, w:2.42, h:3.94 }
          ];
          slots.forEach((slot,i)=>{
            const item = items[i] || {};
            const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
            addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.44} });
            const px = slot.x + (slot.w - photoW) / 2;
            addSmartPhotoPanel(slide, images[i], px, slot.y+0.18, photoW, 2.34, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
            addNumber(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.24, y:slot.y+2.82, w:0.30, h:0.10, fontSize:6.6, color:accent });
            addText(slide, itemTitle(item, `证据 ${i+1}`), { x:slot.x+0.62, y:slot.y+2.76, w:1.14, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
            addText(slide, itemBody(item), { x:slot.x+0.62, y:slot.y+3.20, w:1.24, h:0.20, fontSize:6.8, color:C.body, fit:'shrink', breakLine:true });
          });
          addText(slide, s.note || '不同画幅的现场素材统一进入稳定证据列，保留可读标题与 caption。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
          addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
          return;
        }
        if (layout === 'mosaic-1-3') {
        const hero = { x:0.92, y:2.04, w:5.18, h:3.94 };
        const lead = items[0] || {};
        addRect(slide, hero.x, hero.y, hero.w, hero.h, panelFill(), C.accent, { fill:{color:panelFill(), transparency:0}, line:{color:C.accent, transparency:18, width:0.52} });
        addSmartPhotoPanel(slide, images[0], hero.x+0.16, hero.y+0.16, hero.w-0.32, 2.68, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
        addLabel(slide, 'PRIMARY EVIDENCE', { x:hero.x+0.28, y:hero.y+3.08, w:1.30, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
        addText(slide, itemTitle(lead, '核心证据'), { x:hero.x+0.28, y:hero.y+3.38, w:1.70, h:0.15, fontSize:10.6, bold:true, color:C.text, fit:'shrink' });
        addText(slide, itemBody(lead), { x:hero.x+2.26, y:hero.y+3.34, w:2.34, h:0.18, fontSize:8.0, color:C.body, fit:'shrink' });

        images.slice(1,4).forEach((img,i)=>{
          const y = 2.04 + i*1.34;
          const item = items[i+1] || {};
          const accent = i===0 ? C.cyan : (i===1 ? C.violet : C.muted);
          addRect(slide, 6.42, y, 5.16, 1.08, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.42} });
          addSmartPhotoPanel(slide, img, 6.58, y+0.14, 1.46, 0.80, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:28 });
          addEvidenceCaptionStack(slide, item, `证据 ${i+2}`, { x:8.34, y:y+0.20, w:2.72, h:0.72 }, {
            number:i+2,
            accent,
            titleSize:9.2,
            bodySize:8.2,
            bodyY:0.36,
            maxBodyChars:28,
            dropLongBody:true
          });
        });
        addText(slide, s.note || '主证据与辅助证据分层呈现，避免把关键现场图平均摊平。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
        addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
        return;
      }
      const gridSlots = [
        { x:0.92, y:2.04, w:5.08, h:1.78 },
        { x:6.36, y:2.04, w:5.08, h:1.78 },
        { x:0.92, y:4.14, w:5.08, h:1.78 },
        { x:6.36, y:4.14, w:5.08, h:1.78 }
      ];
      gridSlots.forEach((slot,i)=>{
        const item = items[i] || {};
        const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
        addRect(slide, slot.x, slot.y, slot.w, slot.h, panelFill(), i===0 ? accent : C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?18:16, width:0.44} });
        addSmartPhotoPanel(slide, images[i], slot.x+0.14, slot.y+0.14, 2.06, slot.h-0.28, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:26 });
        addEvidenceCaptionStack(slide, item, `证据 ${i+1}`, { x:slot.x+2.48, y:slot.y+0.24, w:2.06, h:1.06 }, {
          number:i+1,
          accent,
          titleSize:9.4,
          bodySize:8.0,
          bodyY:0.42,
          maxBodyChars:28,
          dropLongBody:true
        });
      });
      addText(slide, s.note || '四组证据保持统一比例、标题和说明，形成稳定的现场判断板。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
      addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
      return;
    }
    const slots = [
      { x:0.92, y:2.06, w:3.36, h:1.58 },
      { x:4.62, y:2.06, w:3.36, h:1.58 },
      { x:8.32, y:2.06, w:3.36, h:1.58 },
      { x:0.92, y:4.42, w:3.36, h:1.58 },
      { x:4.62, y:4.42, w:3.36, h:1.58 },
      { x:8.32, y:4.42, w:3.36, h:1.58 }
    ];
    slots.slice(0, Math.min(6, Math.max(images.length, items.length))).forEach((slot,i)=>{
      const item = items[i] || {};
      const img = images[i];
      if (img) addSmartPhotoPanel(slide, img, slot.x, slot.y, slot.w, 1.04, { role:'evidence', tone:'light', transparency:100, stroke:C.line, strokeTransparency:24 });
      else addRect(slide, slot.x, slot.y, slot.w, 1.04, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:6}, line:{color:C.line, transparency:100} });
      addRect(slide, slot.x, slot.y+1.04, slot.w, 0.54, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:18, width:0.36} });
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.muted);
      addEvidenceCaptionStack(slide, item, `证据 ${i+1}`, { x:slot.x+0.22, y:slot.y+1.14, w:2.80, h:0.36 }, {
        number:i+1,
        accent,
        titleSize:8.8,
        bodySize:7.8,
        titleH:0.13,
        bodyY:0.22,
        bodyH:0.12,
        maxBodyChars:20,
        dropLongBody:true
      });
    });
    addText(slide, s.note || '图片与案例统一裁切比例和 caption，形成可核验的现场证据板。', { x:0.92, y:6.50, w:8.4, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function caseComparisonSlide(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'CASE COMPARISON', 0.86, 0.72, false);
    addText(slide, s.title || '案例前后对比', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:9.4, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const images = galleryImages(plan, s);
    const before = typeof s.before === 'string' ? { title:'Before', image:s.before } : (s.before || {});
    const after = typeof s.after === 'string' ? { title:'After', image:s.after } : (s.after || {});
    const beforeImg = resolveAssetPath(before.image || before.img || images[0] || '');
    const afterImg = resolveAssetPath(after.image || after.img || images[1] || '');
    const panels = [
      { label: before.label || 'BEFORE', title: before.title || '改造前', body: before.body || before.note || '问题、断点或改造前状态。', image:beforeImg, x:0.92, color:C.muted },
      { label: after.label || 'AFTER', title: after.title || '改造后', body: after.body || after.note || '动作、结果或改造后状态。', image:afterImg, x:7.02, color:C.accent }
    ];
    panels.forEach((p,i)=>{
      addRect(slide, p.x, 2.02, 4.82, 3.92, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:i===1?p.color:C.line, transparency:i===1?18:14, width:0.50} });
      if (p.image && fileExists(p.image)) addPhotoPanel(slide, p.image, p.x+0.18, 2.20, 4.46, 2.48, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:24, fit:'cover' });
      else genericShowcaseField(slide, p.x+0.18, 2.20, 4.46, 2.48, p.label);
      addLabel(slide, p.label, { x:p.x+0.28, y:4.94, w:0.90, h:0.10, fontSize:6.8, color:p.color, charSpace:0.8 });
      addText(slide, p.title, { x:p.x+0.28, y:5.22, w:1.68, h:0.15, fontSize:10.4, bold:true, color:C.text, fit:'shrink' });
      addText(slide, p.body, { x:p.x+2.18, y:5.19, w:1.94, h:0.18, fontSize:7.0, color:C.body, fit:'shrink' });
    });
    const beforePanel = { x:panels[0].x, y:2.02, w:4.82, h:3.92 };
    const afterPanel = { x:panels[1].x, y:2.02, w:4.82, h:3.92 };
    const transitionY = 3.44;
    addArrowBetweenRects(slide, beforePanel, afterPanel, 'right', C.accent, {
      gap:0.30,
      y:transitionY,
      endY:transitionY,
      transparency:8,
      width:0.50
    });
    const midX = (beforePanel.x + beforePanel.w + afterPanel.x) / 2;
    slide.addShape('ellipse', { x:midX - 0.06, y:transitionY - 0.06, w:0.12, h:0.12, fill:{color:C.accent}, line:{color:C.accent, transparency:100} });
    addLabel(slide, 'CHANGE', { x:midX - 0.44, y:transitionY+0.52, w:0.88, h:0.10, fontSize:6.2, color:C.accent, charSpace:0.8, align:'center' });

    const metrics = (s.metrics || s.facts || []).slice(0,3);
    metrics.forEach((m,i)=>{
      const x = 3.10 + i*2.04;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, x, 6.18, 1.66, 0.46, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.34} });
      addNumber(slide, m.value || m.title || String(i+1), { x:x+0.14, y:6.31, w:0.62, h:0.12, fontSize:9.0, color:accent, fit:'shrink' });
      addText(slide, m.label || m.body || '', { x:x+0.86, y:6.29, w:0.60, h:0.12, fontSize:8.8, color:C.body, fit:'shrink' });
    });
    addText(slide, s.note || '对比页把改造前后的动作、体验和复盘口径保持同构。', { x:0.94, y:6.72, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function energySiteComparisonSlide(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    addDarkBreathingCircle(slide, 8.28, 0.64, 4.14, 2.28, C.violet);
    sectionKicker(slide, 'SITE BEFORE / AFTER', 0.84, 0.72, true);
    addText(slide, s.title || '站端接入前后对比', { x:0.82, y:1.06, w:6.1, h:0.36, fontSize:23.5, bold:true, color:C.white, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.50, w:6.3, h:0.20, fontSize:9.8, color:'94A3B8', fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.66, y:0.72, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' });

    const images = galleryImages(plan, s);
    const before = typeof s.before === 'string' ? { title:'接入前', image:s.before } : (s.before || {});
    const after = typeof s.after === 'string' ? { title:'接入后', image:s.after } : (s.after || {});
    const panels = [
      { label:before.label || 'BEFORE', title:before.title || '接入前', body:before.body || before.note || '状态、告警和收益复盘分散。', image:resolveAssetPath(before.image || before.img || images[0] || ''), x:0.92, accent:'94A3B8' },
      { label:after.label || 'AFTER', title:after.title || '接入后', body:after.body || after.note || '站端状态、工单和收益口径统一。', image:resolveAssetPath(after.image || after.img || images[1] || ''), x:7.10, accent:C.accent }
    ];
    panels.forEach((p,i)=>{
      addRect(slide, p.x, 2.02, 4.50, 3.56, C.ink2, '334155', { fill:{color:C.ink2, transparency:i===0?12:4}, line:{color:i===1?C.accent:'334155', transparency:i===1?18:44, width:0.46} });
      if (p.image && fileExists(p.image)) addPhotoPanel(slide, p.image, p.x+0.18, 2.22, 4.14, 2.14, { tone:'light', transparency:88, stroke:'334155', strokeTransparency:36, fit:'cover' });
      else genericShowcaseField(slide, p.x+0.18, 2.22, 4.14, 2.14, p.label);
      addLabel(slide, p.label, { x:p.x+0.26, y:4.66, w:0.84, h:0.10, fontSize:6.0, color:p.accent, charSpace:0.85 });
      addText(slide, p.title, { x:p.x+0.26, y:4.94, w:1.22, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
      addText(slide, p.body, { x:p.x+1.72, y:4.92, w:2.02, h:0.18, fontSize:7.0, color:'CBD5E1', fit:'shrink' });
    });
    const midX = 6.22;
    addRect(slide, midX-0.36, 3.08, 0.72, 0.72, C.ink, C.accent, { fill:{color:C.ink, transparency:0}, line:{color:C.accent, transparency:26, width:0.42} });
    addArrowLine(slide, midX-0.18, 3.44, 0.36, 0, C.accent, { transparency:8, width:0.46 });
    addLabel(slide, 'DISPATCH', { x:midX-0.44, y:4.04, w:0.88, h:0.09, fontSize:5.6, color:C.cyan, charSpace:0.65, align:'center' });

    const metrics = (s.metrics || s.facts || []).slice(0,3);
    const metricStart = 2.38;
    metrics.forEach((m,i)=>{
      const x = metricStart + i*2.18;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addText(slide, m.value || m.title || String(i+1), { x, y:6.10, w:0.76, h:0.16, fontSize:12.4, bold:true, color:accent, fit:'shrink' });
      addText(slide, m.label || m.body || '', { x:x+0.96, y:6.12, w:0.88, h:0.12, fontSize:7.8, color:'CBD5E1', fit:'shrink' });
    });
    addText(slide, s.note || '前后对比用于说明站端接入如何把告警、巡检和收益复盘接入同一套调度证据。', { x:0.94, y:6.62, w:8.9, h:0.13, fontSize:7.6, color:'94A3B8', fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
  }

  function caseGallery(slide, plan, s, idx) {
    const C = ctx.colors();
    const variant = ctx.variantOf(s, 'triptych-gallery');
    const variantRenderers = {
      brandWorldBusinessProof: ctx.brandWorldBusinessProof, caseComparisonSlide, caseEvidenceBoard, caseEvidenceHero,
      consumerProofPhotoGrid, energySiteComparisonSlide, energySiteEvidenceGallery, executiveProofBoard,
      financePortfolioEvidenceGallery, healthcareTouchpointEvidenceGallery, peopleProofMosaic, productEvidenceStory,
      retailLookbookStory, saasPrototypeFlowGallery, sustainabilityProofSpread
    };
    const rendererKey = evidenceGalleryRendererKey(variant, plan);
    if (rendererKey) {
      const renderer = variantRenderers[rendererKey];
      if (typeof renderer !== 'function') throw new Error(`missing evidence gallery renderer: ${rendererKey}`);
      return renderer(slide, plan, s, idx);
    }
    ctx.lightCanvas(slide);
    ctx.sectionKicker(slide, 'CASE EVIDENCE', 0.86, 0.72, false);
    ctx.addText(slide, s.title || '案例与素材证据', { x:0.84, y:1.05, w:5.8, h:0.35, fontSize:23.5, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.intro) ctx.addText(slide, s.subtitle || s.intro, { x:0.86, y:1.52, w:5.9, h:0.20, fontSize:9.0, color:C.muted, fit:'shrink' });
    ctx.addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const images = ctx.galleryImages(plan, s);
    const items = s.items || s.cards || [];
    if (images.length >= 3 && items.length <= 4) {
      const slots = [
        { x:0.92, y:2.05, w:3.34, h:3.82 },
        { x:4.52, y:2.05, w:3.34, h:3.82 },
        { x:8.12, y:2.05, w:3.34, h:3.82 }
      ];
      slots.forEach((slot, i) => {
        const item = items[i] || {};
        ctx.addPhotoPanel(slide, images[i], slot.x, slot.y, slot.w, slot.h, { tone:'dark', transparency:100, stroke:'E8DED8', strokeTransparency:10, fit:'cover' });
        ctx.addRect(slide, slot.x, slot.y + slot.h - 0.88, slot.w, 0.88, C.ink, C.ink, { fill:{color:C.ink, transparency:12}, line:{color:C.ink, transparency:100} });
        ctx.addText(slide, String(i+1).padStart(2,'0'), { x:slot.x+0.28, y:slot.y+slot.h-0.58, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i===0?C.accent:C.cyan });
        ctx.addText(slide, item.title || `证据 ${i+1}`, { x:slot.x+0.74, y:slot.y+slot.h-0.62, w:1.56, h:0.15, fontSize:10.0, bold:true, color:C.white, fit:'shrink' });
        if (item.body) ctx.addText(slide, item.body, { x:slot.x+0.74, y:slot.y+slot.h-0.32, w:2.04, h:0.13, fontSize:7.0, color:'CBD5E1', fit:'shrink' });
      });
      ctx.addText(slide, s.note || '现场图、产品图与项目图共同构成交付能力的证据链。', { x:0.94, y:6.38, w:8.40, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
      ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
      return;
    }
    const hero = images[0];
    const heroBox = { x:0.92, y:2.08, w:5.30, h:3.78 };
    const heroCaptionH = 0.98;
    const heroImageH = heroBox.h - heroCaptionH - 0.22;
    if (hero) {
      ctx.addRect(slide, heroBox.x, heroBox.y, heroBox.w, heroBox.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
      ctx.addPhotoPanel(slide, hero, heroBox.x+0.18, heroBox.y+0.18, heroBox.w-0.36, heroImageH, { tone:'light', transparency:96, stroke:'D8E2EF', strokeTransparency:28, fit:'cover' });
      ctx.addRect(slide, heroBox.x, heroBox.y + heroBox.h - heroCaptionH, heroBox.w, heroCaptionH, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
    } else {
      ctx.addRect(slide, heroBox.x, heroBox.y, heroBox.w, heroBox.h, C.ink, C.ink, { line:{color:C.ink, transparency:100} });
      ctx.addDarkBreathingCircle(slide, 2.42, 2.76, 2.74, 1.48, C.accent);
      ctx.addPulseCurve(slide, 1.34, 4.42, 3.20, 0.42, C.cyan, true, { transparency:48, width:0.38, nodes:false });
    }
    const lead = items[0] || { title:'核心案例', body:'以真实图片、现场截图、产品图或客户材料作为证据，不使用无关装饰图。' };
    ctx.addLabel(slide, 'PRIMARY CASE', { x:heroBox.x+0.30, y:heroBox.y+heroBox.h-0.66, w:1.20, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    ctx.addText(slide, lead.title || String(lead), { x:heroBox.x+0.30, y:heroBox.y+heroBox.h-0.38, w:2.72, h:0.16, fontSize:11.6, bold:true, color:C.white, fit:'shrink' });
    if (lead.body) ctx.addText(slide, lead.body, { x:heroBox.x+3.10, y:heroBox.y+heroBox.h-0.40, w:1.62, h:0.14, fontSize:6.7, color:'CBD5E1', fit:'shrink' });

    const slots = [
      { x:6.72, y:2.08, w:2.18, h:1.34 },
      { x:9.24, y:2.08, w:2.18, h:1.34 },
      { x:6.72, y:4.08, w:2.18, h:1.34 },
      { x:9.24, y:4.08, w:2.18, h:1.34 }
    ];
    const slotCount = Math.min(slots.length, Math.max(images.length - 1, items.length - 1, 0));
    slots.slice(0, slotCount).forEach((slot,i)=>{
      const img = images[i+1];
      if (img) {
        ctx.addPhotoPanel(slide, img, slot.x, slot.y, slot.w, slot.h, { tone:'dark', transparency:100, stroke:'E4ECF5', strokeTransparency:12 });
      } else {
        ctx.addRect(slide, slot.x, slot.y, slot.w, slot.h, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.52} });
      }
      const item = items[i+1] || {};
      ctx.addText(slide, String(i+2).padStart(2,'0'), { x:slot.x, y:slot.y+slot.h+0.18, w:0.34, h:0.10, fontSize:6.4, bold:true, color:i===0?C.accent:C.muted });
      ctx.addText(slide, item.title || `证据 ${i+2}`, { x:slot.x+0.46, y:slot.y+slot.h+0.14, w:1.48, h:0.13, fontSize:8.3, bold:true, color:C.text, fit:'shrink' });
      if (item.body) ctx.addText(slide, item.body, { x:slot.x+0.46, y:slot.y+slot.h+0.40, w:1.54, h:0.12, fontSize:6.3, color:C.body, fit:'shrink' });
    });
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'738297' });
  }

  return {
    caseGallery,
    caseComparisonSlide,
    caseEvidenceBoard,
    caseEvidenceHero,
    consumerProofPhotoGrid,
    energySiteComparisonSlide,
    energySiteEvidenceGallery,
    executiveProofBoard,
    financePortfolioEvidenceGallery,
    healthcareTouchpointEvidenceGallery,
    peopleProofMosaic,
    productEvidenceStory,
    retailLookbookStory,
    saasPrototypeFlowGallery,
    sustainabilityProofSpread
  };
}


module.exports = {
  createEvidenceGalleryCoreRenderers
};
