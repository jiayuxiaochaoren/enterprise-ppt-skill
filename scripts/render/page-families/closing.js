const family = 'closing';
const {
  closingRendererKey,
  closingTextForSlide
} = require('./closing-routing');
const {
  createClosingIndustryRenderers
} = require('./closing-industry');

const types = [
  'closing',
  'closing-dark'
];

function createClosingRenderers(ctx = {}) {
  const C = ctx.colors();
  const W = typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const {
    ContactBlock,
    activePlan,
    addArrowLine,
    addDarkBreathingCircle,
    addEnergyLens,
    addEnergyMotionBackdrop,
    addEnergyPhotoBackdrop,
    addHairline,
    addLabel,
    addLightBreathingCircle,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    addVisualPhotoBackdrop,
    copyFallback,
    copyPolicyList,
    coverMetaText,
    designForSlide,
    fileExists,
    footerText,
    galleryImages,
    isCompanyIntroPlan,
    itemBody,
    itemTitle,
    lightCanvas,
    mediaForRole,
    metaDisabled,
    panelFill,
    profileFont,
    resolveAssetPath,
    sectionKicker,
    smartPhotoFit,
    stageCanvas,
    surfaceFill,
    typeSize
  } = ctx;

  function closingDark(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    if (plan.industry === 'energy-utility') {
      if (!plan.motionBackdrop || !addEnergyMotionBackdrop(slide)) {
        addEnergyPhotoBackdrop(slide);
      }
      addEnergyLens(slide, 7.90, 0.72, 4.42, C.accent);
    } else if (addVisualPhotoBackdrop(slide, plan, s, 'closing', { transparency:72 })) {
      addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
    } else {
      addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
    }
    addLabel(slide, 'FINAL ALIGNMENT', { x:0.92, y:1.26, w:1.70, h:0.14, fontSize:7.2, color:C.cyan, charSpace:1.1 });
    addNumber(slide, String(idx || 10).padStart(2,'0'), { x:11.58, y:0.82, w:0.56, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
    addText(slide, s.title || copyFallback(plan, 'closingTitle'), { x:0.90, y:2.12, w:7.36, h:0.72, fontSize:32.5, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.subtitle || copyFallback(plan, 'closingSubtitle'), { x:0.92, y:3.02, w:5.90, h:0.22, fontSize:12.2, color:'CBD5E1', fit:'shrink' });
    addRect(slide, 0.94, 3.52, 0.96, 0.05, C.accent, C.accent);
    addRect(slide, 2.02, 3.52, 0.34, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:40}, line:{color:C.cyan, transparency:100} });
    const note = s.note || copyFallback(plan, 'closingNote');
    addRect(slide, 0.92, 5.46, 8.95, 0.76, C.ink2, '334155', { fill:{color:C.ink2, transparency:22}, line:{color:'334155', transparency:54, width:0.36} });
    addLabel(slide, 'NEXT DECISION', { x:1.18, y:5.74, w:1.22, h:0.11, fontSize:6.6, bold:true, color:C.accent, charSpace:0.8 });
    addText(slide, note, { x:2.58, y:5.71, w:6.58, h:0.18, fontSize:9.2, color:'CBD5E1', fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.darkMuted || 'D8CDD0' });
  }

  function closingMeta(plan) {
    if (isCompanyIntroPlan(plan)) return footerText(plan);
    return coverMetaText(plan) || footerText(plan);
  }
  function closingActions(s) {
    if (Array.isArray(s.actions)) return s.actions.slice(0, 3).map(v => typeof v === 'string' ? { title:v, body:'' } : v);
    if (Array.isArray(s.items)) return s.items.slice(0, 3).map(v => typeof v === 'string' ? { title:v, body:'' } : v);
    const plan = activePlan();
    const actions = copyPolicyList(plan, 'closingActions', []);
    if (actions.length) return actions.slice(0, 3);
    const note = s.note || s.nextStep || copyFallback(plan, 'closingNote');
    return [{ title:'Scope', body:note }];
  }
  const {
    closingFinanceInvestmentDecision,
    closingHealthcareQualityHandoff,
    closingManufacturingPilotRollout,
    closingSaasAdoptionClose
  } = createClosingIndustryRenderers(ctx, { closingActions, closingMeta });
  function closingThankYou(slide, plan, s, idx) {
    const showMeta = s.showMeta !== false && s.meta !== false;
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addLightBreathingCircle(slide, 8.20, 0.38, 4.28, C.softBlue, 36);
    addRect(slide, 8.72, 0.86, 2.86, 5.44, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addText(slide, 'THANK', { x:9.04, y:1.26, w:1.86, h:0.38, fontFace:profileFont('latin'), fontSize:22.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
    addText(slide, 'YOU', { x:9.72, y:1.72, w:1.18, h:0.38, fontFace:profileFont('latin'), fontSize:22.0, bold:true, color:C.cyan, align:'right', fit:'shrink' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:10.82, y:2.34, w:0.36, h:0.12, fontSize:7.6, color:C.darkMuted || 'A8B3C3', align:'right' });
    addHairline(slide, 9.26, 3.20, 1.16, C.accent, 0, 0.58);
    const explicitContacts = s.contacts || s.contact;
    const contacts = explicitContacts || (!showMeta || metaDisabled(plan) ? [] : [
      plan.organization,
      plan.audience,
      plan.date
    ].filter(Boolean));
    const contactList = Array.isArray(contacts) ? contacts : String(contacts || '').split(/[｜|/]/).map(v => v.trim()).filter(Boolean);
    contactList.slice(0,3).forEach((v,i)=>{
      const y = 3.76 + i*0.46;
      addLabel(slide, ['ORG', 'AUD', 'DATE'][i] || `INFO ${i+1}`, { x:9.26, y, w:0.56, h:0.09, fontSize:5.4, color:i===0?C.accent:(i===1?C.cyan:C.violet), charSpace:0.6 });
      addText(slide, String(v), { x:10.00, y:y-0.02, w:0.82, h:0.12, fontSize:7.2, color:C.captionOnImage, fit:'shrink', align:'right' });
    });

    addLabel(slide, s.label || 'CLOSING', { x:0.86, y:1.02, w:1.20, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.0 });
    addText(slide, s.title || copyFallback(plan, 'closingSimpleTitle'), {
      x:0.84, y:2.16, w:5.86, h:0.78,
      fontSize:typeSize('coverTitle', 34.0), bold:true, color:C.text, fit:'shrink'
    });
    addText(slide, s.subtitle || s.claim || copyFallback(plan, 'closingSimpleSubtitle'), {
      x:0.88, y:3.24, w:5.52, h:0.24,
      fontSize:11.4, color:C.body, fit:'shrink'
    });
    addRect(slide, 0.88, 3.86, 0.96, 0.045, C.accent, C.accent);
    if (s.note) {
      addText(slide, s.note, { x:0.88, y:4.42, w:5.80, h:0.22, fontSize:9.0, color:C.muted, fit:'shrink' });
    }
    addHairline(slide, 0.86, 6.40, 7.32, C.line, 16, 0.55);
    addText(slide, showMeta ? closingMeta(plan) : '', { x:0.86, y:6.70, w:7.40, h:0.16, fontSize:7.6, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  }
  function closingSimpleEnd(slide, plan, s, idx) {
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addLightBreathingCircle(slide, 8.24, 0.36, 4.36, C.softBlue, 38);
    addRect(slide, 0.88, 0.84, 0.045, 5.72, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addLabel(slide, s.label || 'END', { x:1.22, y:1.02, w:1.12, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.05 });
    addText(slide, s.title || copyFallback(plan, 'closingSimpleTitle'), {
      x:1.18, y:2.02, w:5.90, h:0.82,
      fontSize:typeSize('coverTitle', 34.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || s.claim || copyFallback(plan, 'closingSimpleSubtitle'), {
      x:1.22, y:3.18, w:5.28, h:0.24,
      fontSize:11.4, color:C.body, fit:'shrink'
    });
    addRect(slide, 1.22, 3.78, 0.96, 0.045, C.accent, C.accent);
    addRect(slide, 2.32, 3.78, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:36}, line:{color:C.cyan, transparency:100} });
    if (s.note) addText(slide, s.note, { x:1.22, y:4.42, w:5.70, h:0.22, fontSize:9.0, color:C.muted, fit:'shrink' });

    addRect(slide, 8.70, 0.94, 2.66, 5.34, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addText(slide, 'END', { x:9.12, y:1.30, w:1.54, h:0.46, fontFace:profileFont('latin'), fontSize:27.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:10.54, y:1.94, w:0.42, h:0.16, fontSize:9.2, color:C.darkMuted || 'A8B3C3', align:'right' });
    addHairline(slide, 9.20, 3.02, 1.04, C.accent, 0, 0.56);
    addText(slide, closingMeta(plan), { x:9.20, y:3.48, w:1.62, h:0.34, fontSize:7.6, bold:true, color:C.captionOnImage, fit:'shrink', breakLine:true });
    addText(slide, metaDisabled(plan) ? '' : (plan.date || ''), { x:9.20, y:5.26, w:1.34, h:0.12, fontSize:7.0, color:C.darkMuted || '94A3B8', fit:'shrink' });
    addHairline(slide, 1.18, 6.42, 6.82, C.line, 16, 0.55);
    addText(slide, footerText(plan), { x:1.18, y:6.72, w:7.0, h:0.14, fontSize:7.4, color:C.muted, fit:'shrink' });
  }
  function closingEditorialLight(slide, plan, s, idx) {
    const bg = surfaceFill();
    const panel = panelFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addRect(slide, 0, 0, W, 0.10, C.accent, C.accent, { fill:{color:C.accent, transparency:0}, line:{color:C.accent, transparency:100} });
    addLightBreathingCircle(slide, 8.30, 0.34, 4.38, C.softBlue, 38);
    addRect(slide, 8.92, 1.10, 2.60, 4.70, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addText(slide, 'END', { x:9.20, y:1.42, w:1.92, h:0.48, fontFace:profileFont('latin'), fontSize:26, bold:true, color:C.accent, fit:'shrink', align:'right' });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:10.72, y:1.42, w:0.42, h:0.16, fontSize:9.6, color:C.darkMuted || 'A8B3C3', align:'right' });
    addLabel(slide, s.label || 'FINAL DECISION', { x:0.86, y:1.02, w:1.54, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.05 });
    addText(slide, s.title || plan.closingTitle || copyFallback(plan, 'closingTitle'), {
      x:0.84, y:1.96, w:6.92, h:0.92,
      fontSize:typeSize('coverTitle', 31.5), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || plan.closingSubtitle || copyFallback(plan, 'closingSubtitle'), {
      x:0.88, y:3.12, w:5.92, h:0.22,
      fontSize:11.4, color:C.body, fit:'shrink'
    });
    addRect(slide, 0.88, 3.68, 0.96, 0.045, C.accent, C.accent);
    addRect(slide, 1.98, 3.68, 0.36, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

    const actions = closingActions(s);
    const startX = 0.86;
    const y = 4.72;
    const cardW = 2.52;
    actions.forEach((a, i) => {
      const x = startX + i * (cardW + 0.20);
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addRect(slide, x, y, cardW, 0.98, panel, C.line, { fill:{color:panel, transparency:i === 2 ? 10 : 0}, line:{color:C.line, transparency:12, width:0.45} });
      addRect(slide, x, y, cardW, 0.035, accent, accent, { line:{color:accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:y+0.30, w:0.32, h:0.12, fontSize:7.2, color:accent });
      addText(slide, a.title || '', { x:x+0.66, y:y+0.25, w:0.92, h:0.18, fontSize:9.4, bold:true, color:C.text, fit:'shrink' });
      addText(slide, a.body || '', { x:x+0.66, y:y+0.56, w:1.48, h:0.20, fontSize:7.3, color:C.body, fit:'shrink', breakLine:true });
    });
    addLabel(slide, 'NEXT DECISION', { x:9.28, y:3.12, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, s.note || copyFallback(plan, 'closingNote'), {
      x:9.28, y:3.48, w:1.76, h:0.42,
      fontSize:8.0, color:C.captionOnImage || 'CBD5E1', fit:'shrink', breakLine:true
    });
    addHairline(slide, 9.28, 4.38, 1.18, C.accent, 0, 0.58);
    addText(slide, copyFallback(plan, 'closingSubtitle'), {
      x:9.28, y:4.78, w:1.68, h:0.30,
      fontSize:8.4, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    addHairline(slide, 0.86, 6.42, 7.60, C.line, 16, 0.55);
    addText(slide, closingMeta(plan), { x:0.86, y:6.70, w:7.60, h:0.16, fontSize:7.6, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  }
  function closingImageStatement(slide, plan, s, idx) {
    const design = designForSlide(plan, s, 'closing');
    const imagePath = design.imagePath;
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addRect(slide, 0.72, 0.66, 5.42, 6.00, C.ink, C.ink);
    addPhotoPanel(slide, imagePath, 0.92, 0.90, 5.02, 5.42, { transparency:100, stroke:C.line, strokeTransparency:70, tone:'dark' });
    addRect(slide, 0.92, 5.72, 5.02, 0.60, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
    addLabel(slide, s.imageLabel || 'CLOSING VISUAL', { x:1.18, y:5.94, w:1.28, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    addText(slide, (s.visual && s.visual.caption) || copyFallback(plan, 'fallbackCaption'), {
      x:2.62, y:5.93, w:2.72, h:0.12, fontSize:6.6, color:C.captionOnImage, fit:'shrink'
    });

    addLabel(slide, s.label || 'FINAL POSITION', { x:6.72, y:1.02, w:1.80, h:0.13, fontSize:6.9, color:C.accent, charSpace:1.05 });
    addText(slide, String(idx || '').padStart(2,'0'), { x:11.62, y:1.00, w:0.58, h:0.16, fontSize:9.8, bold:true, color:C.muted, align:'right' });
    addText(slide, s.title || plan.closingTitle || copyFallback(plan, 'closingTitle'), {
      x:6.68, y:2.06, w:4.88, h:0.98,
      fontSize:typeSize('coverTitle', 29.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || plan.closingSubtitle || copyFallback(plan, 'closingSubtitle'), {
      x:6.72, y:3.28, w:4.24, h:0.24,
      fontSize:10.8, color:C.body, fit:'shrink'
    });
    addRect(slide, 6.72, 3.86, 0.92, 0.045, C.accent, C.accent);
    const actions = closingActions(s).slice(0, 2);
    actions.forEach((a, i) => {
      const y = 4.70 + i * 0.62;
      addText(slide, String(i+1).padStart(2,'0'), { x:6.72, y, w:0.28, h:0.10, fontSize:6.2, bold:true, color:i === 0 ? C.accent : C.cyan });
      addText(slide, a.title || '', { x:7.20, y:y-0.01, w:1.08, h:0.13, fontSize:8.4, bold:true, color:C.text, fit:'shrink' });
      addText(slide, a.body || '', { x:8.52, y:y-0.01, w:2.42, h:0.16, fontSize:7.2, color:C.body, fit:'shrink' });
    });
    addText(slide, closingMeta(plan), { x:6.72, y:6.76, w:4.74, h:0.14, fontSize:7.0, color:C.muted, fit:'shrink' });
  }
  function closingDecisionBoard(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    addDarkBreathingCircle(slide, 8.16, 0.72, 4.18, 2.44, C.accent);
    addLabel(slide, s.label || 'FINAL POSITION', { x:0.92, y:0.98, w:1.70, h:0.13, fontSize:6.9, color:C.cyan, charSpace:1.05 });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.58, y:0.92, w:0.56, h:0.18, fontSize:10.8, color:C.accent, align:'right' });
    addText(slide, s.title || plan.closingTitle || copyFallback(plan, 'closingTitle'), {
      x:0.90, y:1.94, w:6.66, h:0.86,
      fontSize:31.0, bold:true, color:C.darkText || C.white, fit:'shrink', breakLine:true
    });
    addText(slide, s.subtitle || plan.closingSubtitle || copyFallback(plan, 'closingSubtitle'), {
      x:0.92, y:3.14, w:5.50, h:0.22,
      fontSize:11.4, color:C.darkMuted || 'CBD5E1', fit:'shrink'
    });
    addRect(slide, 0.94, 3.68, 0.96, 0.05, C.accent, C.accent);
    const actions = closingActions(s);
    actions.forEach((a, i) => {
      const y = 4.88 + i * 0.48;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addHairline(slide, 0.94, y-0.12, 6.20, C.darkLine || '334155', 42, 0.45);
      addText(slide, String(i+1).padStart(2,'0'), { x:0.94, y, w:0.32, h:0.10, fontSize:6.2, bold:true, color:accent });
      addText(slide, a.title || '', { x:1.48, y:y-0.02, w:1.20, h:0.13, fontSize:8.5, bold:true, color:C.darkText || C.white, fit:'shrink' });
      addText(slide, a.body || '', { x:3.00, y:y-0.02, w:3.78, h:0.14, fontSize:7.2, color:C.darkMuted || 'CBD5E1', fit:'shrink' });
    });
    addText(slide, closingMeta(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.4, color:C.muted, fit:'shrink' });
  }
  function contactItemsForClosing(plan={}, s={}) {
    const raw = s.contacts || s.contact || plan.contacts || plan.contact || [];
    if (Array.isArray(raw)) {
      return raw
        .map(v => typeof v === 'string' ? v : [v.label, v.value || v.text].filter(Boolean).join('：'))
        .filter(Boolean);
    }
    return String(raw || '').split(/[｜|/]/).map(v => v.trim()).filter(Boolean);
  }

  function closingCompanyThanks(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    addDarkBreathingCircle(slide, 8.54, 0.40, 4.18, 2.36, C.accent);
    addLabel(slide, s.label || '致谢', { x:0.86, y:0.82, w:1.10, h:0.12, fontSize:7.0, color:C.accent, charSpace:0 });
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.72, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const imagePath = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : mediaForRole(plan, s, 'closing');
    if (imagePath && fileExists(imagePath)) {
      addRect(slide, 7.02, 0.00, 6.32, H, C.ink2, C.ink2);
      slide.addImage({ path:imagePath, x:7.12, y:0.62, w:5.16, h:5.78, sizing:{ type:smartPhotoFit(imagePath, { w:5.16, h:5.78 }, 'showcase'), w:5.16, h:5.78 } });
      addRect(slide, 7.12, 0.62, 5.16, 5.78, C.ink, C.ink, { fill:{color:C.ink, transparency:20}, line:{color:C.darkLine || '334155', transparency:42, width:0.46} });
      addRect(slide, 7.12, 5.94, 5.16, 0.46, C.ink, C.ink, { fill:{color:C.ink, transparency:4}, line:{color:C.ink, transparency:100} });
      addLabel(slide, '现场图像', { x:7.42, y:6.10, w:0.88, h:0.09, fontSize:5.4, color:C.accent, charSpace:0 });
    } else {
      addRect(slide, 7.22, 0.82, 4.70, 5.52, C.ink2, C.darkLine || '334155', { fill:{color:C.ink2, transparency:0}, line:{color:C.darkLine || '334155', transparency:42, width:0.46} });
      addText(slide, plan.organization || plan.title || '', { x:7.72, y:2.64, w:3.00, h:0.56, fontSize:18.6, bold:true, color:C.white, fit:'shrink', breakLine:true });
      addHairline(slide, 7.74, 3.68, 1.16, C.accent, 0, 0.58);
    }

    addText(slide, s.title || copyFallback(plan, 'closingSimpleTitle'), {
      x:0.84, y:1.72, w:5.54, h:0.82,
      fontSize:typeSize('coverTitle', 35.0), bold:true, color:C.darkText || C.white, fit:'shrink'
    });
    addText(slide, s.subtitle || plan.organization || plan.title || copyFallback(plan, 'closingSimpleSubtitle'), {
      x:0.88, y:2.86, w:5.44, h:0.24,
      fontSize:12.4, bold:true, color:C.captionOnImage || 'CBD5E1', fit:'shrink'
    });
    addRect(slide, 0.88, 3.40, 0.98, 0.05, C.accent, C.accent);
    addRect(slide, 2.02, 3.40, 0.36, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:28}, line:{color:C.cyan, transparency:100} });

    const contacts = contactItemsForClosing(plan, s).slice(0, 4);
    if (!ContactBlock(slide, contacts, 0.90, 4.46, { dark:true })) {
      addText(slide, copyFallback(plan, 'closingContactFallback'), { x:0.90, y:4.78, w:4.82, h:0.16, fontSize:8.8, color:C.darkMuted || '94A3B8', fit:'shrink' });
    }
    addHairline(slide, 0.86, 6.42, 5.76, C.darkLine || '334155', 42, 0.55);
    addText(slide, footerText(plan), { x:0.86, y:6.76, w:5.80, h:0.14, fontSize:7.8, color:C.darkMuted || '94A3B8', fit:'shrink' });
  }

  function premiumClosingAnchor(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    const imagePath = (s.visual && s.visual.image)
      ? resolveAssetPath(s.visual.image)
      : (galleryImages(plan, s)[0] || mediaForRole(plan, s, 'closing'));
    const hasImage = imagePath && fileExists(imagePath);
    if (hasImage) {
      addPhotoPanel(slide, imagePath, 6.22, 0.74, 5.64, 5.82, {
        tone:'dark',
        transparency:50,
        stroke:C.accent,
        strokeTransparency:62,
        strokeWidth:0.40,
        fit:'cover'
      });
      addRect(slide, 6.22, 0.74, 5.64, 5.82, C.ink, C.ink, {
        fill:{color:C.ink, transparency:82},
        line:{color:C.ink, transparency:100}
      });
      addLabel(slide, 'DECISION MATERIALS', { x:6.54, y:1.02, w:1.76, h:0.10, fontSize:5.8, color:C.cyan, charSpace:0.8 });
    } else {
      addDarkBreathingCircle(slide, 8.62, 0.96, 3.70, 2.08, C.accent);
    }
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

    const actions = closingActions(s).slice(0, 3);
    actions.forEach((action, i) => {
      const x = hasImage ? 0.92 : 7.06;
      const y = hasImage ? (3.58 + i * 0.62) : (2.10 + i * 1.12);
      const w = hasImage ? 4.96 : 4.56;
      const h = hasImage ? 0.50 : 0.86;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      const title = itemTitle(action, `行动 ${i + 1}`);
      const body = itemBody(action);
      addRect(slide, x, y, w, h, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:hasImage ? (i === 0 ? 6 : 18) : (i === 0 ? 14 : 34)},
        line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 22 : 58, width:0.42}
      });
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:x+0.28, y:y+(hasImage ? 0.18 : 0.31), w:0.30, h:0.11, fontSize:6.7, color:accent });
      if (body) {
        addText(slide, title, {
          x:x+0.76, y:y+(hasImage ? 0.10 : 0.21), w:hasImage ? 1.64 : 1.46, h:hasImage ? 0.20 : 0.28,
          fontSize:hasImage ? 9.4 : 10.8, bold:true, color:C.white, breakLine:true, valign:'mid', fit:false
        });
        addText(slide, body, {
          x:x+(hasImage ? 2.62 : 2.48), y:y+(hasImage ? 0.10 : 0.19), w:hasImage ? 1.82 : 1.78, h:hasImage ? 0.22 : 0.34,
          fontSize:hasImage ? 7.6 : 8.8, color:C.darkMuted || 'D8CDD0', breakLine:true, valign:'mid', fit:false
        });
      } else {
        addText(slide, title, {
          x:x+0.76, y:y+(hasImage ? 0.10 : 0.20), w:hasImage ? 3.80 : 3.34, h:hasImage ? 0.22 : 0.34,
          fontSize:hasImage ? 10.0 : 11.2, bold:true, color:C.white, breakLine:true, valign:'mid', fit:false
        });
      }
    });
    const contacts = contactItemsForClosing(plan, s).slice(0, 3);
    if (contacts.length) {
      addLabel(slide, 'OWNER / CONTACT', { x:7.34, y:5.70, w:1.28, h:0.09, fontSize:5.6, color:C.cyan, charSpace:0.7 });
      contacts.forEach((contact, i) => {
        addText(slide, contact, { x:8.64 + i * 1.06, y:5.66, w:0.98, h:0.12, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
      });
    }
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.darkMuted || 'D8CDD0' });
  }

  function closingDecisionSummary(slide, plan, s, idx) {
    const C = ctx.colors();
    ctx.lightCanvas(slide);
    ctx.sectionKicker(slide, s.label || 'FINAL DECISION', 0.86, 0.72, false);
    ctx.addText(slide, s.title || plan.closingTitle || ctx.copyFallback(plan, 'closingTitle'), {
      x:0.84, y:1.18, w:6.72, h:0.72,
      fontSize:ctx.typeSize('coverTitle', 30.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    ctx.addText(slide, s.subtitle || plan.closingSubtitle || ctx.copyFallback(plan, 'closingSubtitle'), {
      x:0.86, y:2.20, w:5.88, h:0.22, fontSize:11.0, color:C.body, fit:'shrink'
    });
    ctx.addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    ctx.addRect(slide, 8.60, 0.96, 2.92, 5.58, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    ctx.addText(slide, 'DECISION', { x:9.00, y:1.32, w:1.88, h:0.36, fontFace:ctx.profileFont('latin'), fontSize:23.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
    ctx.addLabel(slide, 'BOARD READY', { x:9.58, y:1.86, w:1.14, h:0.10, fontSize:5.8, color:C.darkMuted || '94A3B8', align:'right', charSpace:0.8 });
    ctx.addHairline(slide, 9.02, 2.54, 1.28, C.accent, 0, 0.58);
    ctx.addText(slide, s.decision || s.note || ctx.copyFallback(plan, 'closingNote'), {
      x:9.02, y:3.02, w:1.88, h:0.56, fontSize:9.0, bold:true, color:C.white, breakLine:true, fit:'shrink'
    });
    ctx.addText(slide, ctx.copyFallback(plan, 'closingDecisionOutcome'), { x:9.02, y:4.72, w:1.72, h:0.22, fontSize:7.4, color:C.captionOnImage, fit:'shrink' });
    const actions = closingActions(s);
    actions.forEach((a,i)=>{
      const x = 0.92 + i*2.50;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      ctx.addRect(slide, x, 4.02, 2.10, 1.30, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:i===0?accent:C.line, transparency:i===0?22:16, width:0.46} });
      ctx.addRect(slide, x, 4.02, 2.10, 0.04, accent, accent, { line:{color:accent, transparency:100} });
      ctx.addNumber(slide, String(i+1).padStart(2,'0'), { x:x+0.22, y:4.36, w:0.34, h:0.12, fontSize:7.0, color:accent });
      ctx.addText(slide, a.title || '', { x:x+0.68, y:4.30, w:0.98, h:0.15, fontSize:9.2, bold:true, color:C.text, fit:'shrink' });
      ctx.addText(slide, a.body || '', { x:x+0.22, y:4.78, w:1.56, h:0.18, fontSize:7.1, color:C.body, fit:'shrink' });
    });
    ctx.addHairline(slide, 0.92, 6.18, 6.80, C.line, 14, 0.45);
    ctx.addText(slide, closingMeta(plan), { x:0.92, y:6.46, w:6.40, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    ctx.addText(slide, ctx.footerText(plan), { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, color:C.muted, fit:'shrink' });
  }

  function closingAdaptive(slide, plan, s, idx) {
    const design = ctx.designForSlide(plan, s, 'closing');
    const closingVariant = ctx.variantOf(s) || s.closingVariant || '';
    const tone = ctx.presentationSpec().coverTone || 'dark';
    const rendererKey = closingRendererKey(plan, s, {
      variant: closingVariant,
      closingText: closingTextForSlide(s),
      isCompanyIntro: ctx.isCompanyIntroPlan(plan),
      hasImageStatement: Boolean(design.wantsImage && design.imagePath && ctx.fileExists(design.imagePath)),
      coverTone: tone
    });
    const renderers = {
      closingCompanyThanks, closingDark, closingDecisionBoard, closingDecisionSummary, closingEditorialLight,
      closingFinanceInvestmentDecision, closingHealthcareQualityHandoff, closingImageStatement,
      closingManufacturingPilotRollout, closingSaasAdoptionClose, closingSimpleEnd, closingThankYou,
      premiumClosingAnchor
    };
    return renderers[rendererKey](slide, plan, s, idx);
  }

  return {
    closingAdaptive,
    closingDecisionSummary,
    closingCompanyThanks,
    closingDark,
    closingDecisionBoard,
    closingEditorialLight,
    closingFinanceInvestmentDecision,
    closingHealthcareQualityHandoff,
    closingImageStatement,
    closingManufacturingPilotRollout,
    closingSaasAdoptionClose,
    closingSimpleEnd,
    closingThankYou,
    premiumClosingAnchor
  };
}

function entries(renderers = {}) {
  return [
    { types:['closing', 'closing-dark'], render:renderers.closingAdaptive, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createClosingRenderers,
  entries
};
