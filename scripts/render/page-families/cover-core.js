function createCoverCoreRenderers(ctx = {}) {
  const colors = () => ctx.colors();
  const canvasWidth = () => typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const canvasHeight = () => typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const profile = () => typeof ctx.profile === 'function' ? ctx.profile() : {};
  const fileExists = file => typeof ctx.fileExists === 'function' ? ctx.fileExists(file) : false;

  function coverKickerText(plan = {}, industry = {}) {
    if (plan.coverKicker === false || plan.kicker === false) return '';
    if (ctx.isCompanyIntroPlan(plan) && plan.coverKicker == null && plan.kicker == null) return '';
    const label = typeof plan.coverKicker === 'string' ? plan.coverKicker
      : (typeof plan.kicker === 'string' ? plan.kicker : (industry.label || 'DIGITAL OPERATIONS'));
    if (!label) return '';
    const metadata = (plan.metadata && typeof plan.metadata === 'object') ? plan.metadata : {};
    const date = ctx.metaDisabled(plan) ? '' : (metadata.date || plan.date || '');
    const year = date ? String(date).slice(0, 4) : '';
    if (year && plan.showYear !== false) return `${label}  /  ${year}`;
    return label;
  }

  function addCoverKicker(slide, plan, industry, opts = {}) {
    const text = coverKickerText(plan, industry);
    if (!text) return false;
    ctx.addLabel(slide, text, opts);
    return true;
  }

  function drawCoverBreathingCircle(slide) {
    ctx.addDarkBreathingCircle(slide, 8.30, 0.84, 4.38, 2.54);
  }

  function drawGenericCoverField(slide) {
    drawCoverBreathingCircle(slide);
  }

  function drawManufacturingCoverField(slide, plan = {}) {
    const C = colors();
    const coverMetrics = Array.isArray(plan.coverMetrics) ? plan.coverMetrics.filter(Boolean) : [];
    const primary = coverMetrics[0] || { label:'制造基础', value:'—', note:'以材料事实为准' };
    const tags = Array.isArray(plan.coverTags) && plan.coverTags.length ? plan.coverTags : ['设计', '制造', '安调', '复盘'];
    const proofRows = (coverMetrics.length ? coverMetrics.slice(1, 4) : [
      { label:'产品谱系', value:'多类型', note:'' },
      { label:'控制集成', value:'PLC', note:'' },
      { label:'交付闭环', value:'现场', note:'' }
    ]);
    ctx.addDarkBreathingCircle(slide, 8.42, 0.78, 4.12, 2.30, C.accent);
    const panel = { x:7.34, y:1.32, w:4.82, h:4.70 };
    ctx.addRect(slide, panel.x, panel.y, panel.w, panel.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:34},
      line:{color:'334155', transparency:68, width:0.38}
    });
    ctx.addLabel(slide, 'MANUFACTURING PROOF', { x:panel.x+0.34, y:panel.y+0.34, w:1.58, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    ctx.addText(slide, primary.value || '—', { x:panel.x+0.32, y:panel.y+0.84, w:1.20, h:0.38, fontSize:28, bold:true, color:C.white, fit:'shrink' });
    ctx.addText(slide, primary.label || '核心事实', { x:panel.x+1.62, y:panel.y+1.02, w:1.06, h:0.12, fontSize:7.2, color:'94A3B8', fontFace:ctx.profileFont('latin'), fit:'shrink' });
    ctx.addPulseCurve(slide, panel.x+2.42, panel.y+0.92, 1.92, 0.42, C.cyan, true, { transparency:34, width:0.42, nodes:false });
    ctx.addHairline(slide, panel.x+0.34, panel.y+1.64, panel.w-0.68, '334155', 44, 0.34);

    const stations = tags.slice(0, 4).map((label, i) => ({
      label,
      x: panel.x + 0.48 + i * 1.14,
      y: panel.y + 2.08,
      color: [C.accent, C.cyan, C.violet, '94A3B8'][i] || C.accent
    }));
    stations.forEach((st, i) => {
      ctx.addRect(slide, st.x, st.y, 0.64, 0.40, C.ink, st.color, {
        fill:{color:C.ink, transparency:i === 0 ? 6 : 22},
        line:{color:st.color, transparency:i === 0 ? 18 : 48, width:0.38}
      });
      ctx.addText(slide, st.label, { x:st.x+0.08, y:st.y+0.14, w:0.48, h:0.08, fontSize:5.8, bold:true, color:i === 0 ? C.white : 'A8B3C3', align:'center', fit:'shrink' });
      if (i < stations.length - 1) ctx.addArrowLine(slide, st.x+0.72, st.y+0.20, 0.32, 0, st.color, { transparency:44, width:0.34 });
    });

    proofRows.slice(0, 3).forEach((row, i) => {
      const y = panel.y + 3.10 + i * 0.42;
      const dot = [C.cyan, C.violet, '94A3B8'][i] || C.cyan;
      slide.addShape('ellipse', { x:panel.x+0.42, y:y+0.04, w:0.08, h:0.08, fill:{color:dot}, line:{color:dot, transparency:100} });
      ctx.addText(slide, row.label || row.title || `事实 ${i + 1}`, { x:panel.x+0.64, y, w:1.26, h:0.12, fontSize:7.2, color:'A8B3C3', fit:'shrink' });
      ctx.addText(slide, row.value || '—', { x:panel.x+3.10, y:y-0.02, w:1.02, h:0.12, fontSize:8.4, bold:true, color:C.white, align:'right', fit:'shrink' });
      ctx.addHairline(slide, panel.x+2.02, y+0.19, 1.16, '334155', 56, 0.30);
    });
  }

  function drawParkCoverField(slide) {
    drawCoverBreathingCircle(slide);
  }

  function drawEnergyCoverField(slide, plan = {}) {
    const C = colors();
    if (!plan.motionBackdrop || !ctx.addEnergyMotionBackdrop(slide)) {
      ctx.addEnergyPhotoBackdrop(slide);
    }
    ctx.addEnergyLens(slide, 7.78, 0.70, 4.50, C.accent);
  }

  function coverFieldRendererFor(industry = {}) {
    if (typeof industry.coverField === 'function') return industry.coverField;
    const coverFields = {
      generic: drawGenericCoverField,
      manufacturing: drawManufacturingCoverField,
      park: drawParkCoverField,
      energy: drawEnergyCoverField
    };
    return coverFields[industry.coverField] || drawGenericCoverField;
  }

  function splitEnergyTitle(title) {
    const text = String(title || '').replace(/\n/g, '').trim();
    const index = text.indexOf('智能');
    if (index > 3 && text.length <= 18) return [text.slice(0, index), text.slice(index)];
    return [text, ''];
  }

  function premiumTitle(title, opts = {}) {
    const text = String(title || '').trim();
    if (opts.mode === 'none') return text.replace(/\s*\n\s*/g, ' ');
    const threshold = opts.threshold || 20;
    if (text.length > threshold && !text.includes('\n')) {
      const cut = Math.min(Math.max(8, Math.round(text.length * 0.58)), text.length - 4);
      return `${text.slice(0, cut)}\n${text.slice(cut)}`;
    }
    return text;
  }

  function coverTitleText(title) {
    const spec = ctx.presentationSpec();
    const token = ctx.typeToken('coverTitle', { breakAt:22 });
    const mode = spec.coverTitleBreak === 'none' ? 'none' : 'auto';
    return premiumTitle(title, { mode, threshold:spec.coverTitleBreakAt || token.breakAt || 22 });
  }

  function coverShowcase(slide, plan, s, industry, title) {
    const C = colors();
    const design = ctx.designForSlide(plan, s, 'cover');
    const companyIntro = ctx.isCompanyIntroPlan(plan);
    if (!design.wantsImage) return false;
    const imagePath = design.imagePath;
    if (!imagePath || !fileExists(imagePath)) return false;
    ctx.stageCanvas(slide, { field:false });
    ctx.addDarkBreathingCircle(slide, 8.72, 0.62, 3.72, 2.04, C.accent);
    addCoverKicker(slide, plan, industry, { x:0.84, y:0.96, w:3.80, h:0.14, fontSize:7.0, color:C.cyan, charSpace:1.1 });
    ctx.addText(slide, title, { x:0.82, y:1.76, w:4.82, h:1.08, fontSize:ctx.typeSize('coverTitle', 29.0), bold:true, color:C.white, breakLine:true, fit:'shrink' });
    const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
    ctx.addText(slide, insight, { x:0.86, y:3.28, w:4.24, h:0.26, fontSize:10.7, color:'CBD5E1', fit:'shrink' });
    ctx.addRect(slide, 0.86, 3.78, 0.82, 0.045, C.accent, C.accent);
    ctx.addRect(slide, 1.82, 3.78, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:40}, line:{color:C.cyan, transparency:100} });

    ctx.addRect(slide, 6.16, 0.74, 6.22, 5.42, C.ink2, '334155', { fill:{color:C.ink2, transparency:12}, line:{color:'334155', transparency:62, width:0.45} });
    ctx.addPhotoPanel(slide, imagePath, 6.36, 0.96, 5.82, 4.64, { transparency:100, stroke:'334155', strokeTransparency:56 });
    ctx.addRect(slide, 6.36, 5.60, 5.82, 0.56, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    ctx.addLabel(slide, companyIntro ? '现场图像' : 'VISUAL EVIDENCE', { x:6.66, y:5.82, w:1.12, h:0.10, fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
    const fallbackCaption = ctx.copyFallback(plan, 'fallbackCaption', companyIntro ? '产品与现场能力展示' : '');
    ctx.addText(slide, (s.visual && s.visual.caption) || fallbackCaption, { x:8.02, y:5.81, w:3.24, h:0.12, fontSize:6.8, color:'CBD5E1', fit:'shrink' });

    ctx.addDeckMeta(slide, plan, { x:0.86, y:6.34, w:5.50, h:0.16, fontSize:7.3, color:C.muted, fit:'shrink' });
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.5, color:C.muted });
    return true;
  }

  function coverLightEditorial(slide, plan, s, industry, title) {
    const C = colors();
    const W = canvasWidth();
    const H = canvasHeight();
    const bg = ctx.surfaceFill();
    const panel = ctx.panelFill();
    const motif = ctx.presentationSpec().coverMotif || 'editorial-rule';
    const companyIntro = ctx.isCompanyIntroPlan(plan);
    slide.background = { color:bg };
    ctx.addRect(slide, 0, 0, W, H, bg, bg);

    if (motif === 'ivory-editorial') {
      ctx.addRect(slide, 0, 0, 3.68, H, C.ink, C.ink);
      ctx.addRect(slide, 3.68, 0, 0.035, H, C.accent, C.accent, { fill:{color:C.accent, transparency:12}, line:{color:C.accent, transparency:100} });
      ctx.addLabel(slide, 'SOLID PALETTE', { x:0.78, y:0.92, w:1.68, h:0.12, fontSize:6.8, color:'A8B3C3', charSpace:1.0 });
      ctx.addText(slide, profile().palette || '', { x:0.78, y:6.58, w:1.92, h:0.12, fontSize:6.8, color:'A8B3C3', fit:'shrink' });
    } else {
      ctx.addRect(slide, 0.82, 0.76, 2.42, 0.035, C.accent, C.accent);
      if (motif === 'redline-editorial') {
        ctx.addRect(slide, 0, 0, W, 0.10, C.accent, C.accent);
        ctx.addRect(slide, 8.52, 0, 0.10, H, C.accent, C.accent, { fill:{color:C.accent, transparency:16}, line:{color:C.accent, transparency:100} });
      } else if (motif === 'calm-field') {
        ctx.addLightBreathingCircle(slide, 8.92, 0.62, 3.76, C.softBlue, 34);
      } else {
        ctx.addLightBreathingCircle(slide, 8.92, 0.62, 3.76, C.softBlue, 44);
      }
    }

    const x0 = motif === 'ivory-editorial' ? 4.72 : 0.84;
    const metaColor = motif === 'ivory-editorial' ? C.muted : C.muted;
    addCoverKicker(slide, plan, industry, { x:x0, y:1.02, w:3.80, h:0.14, fontSize:7.1, color:metaColor, charSpace:1.1 });
    ctx.addText(slide, title, { x:x0, y:1.92, w:5.92, h:1.02, fontSize:ctx.typeSize('coverTitle', 31.0), bold:true, color:C.text, breakLine:true, fit:'shrink' });
    const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
    ctx.addText(slide, insight, { x:x0+0.02, y:3.34, w:5.55, h:0.20, fontSize:10.8, color:C.body, fit:'shrink' });
    ctx.addRect(slide, x0+0.02, 3.82, 0.88, 0.045, C.accent, C.accent);
    ctx.addRect(slide, x0+1.02, 3.82, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

    if (motif !== 'ivory-editorial') {
      ctx.addRect(slide, 8.98, 1.28, 2.74, 3.96, panel, C.line, { fill:{color:panel, transparency:18}, line:{color:C.line, transparency:16, width:0.45} });
      const design = ctx.designForSlide(plan, s, 'cover');
      const hasPanelImage = design.imagePath && fileExists(design.imagePath);
      if (hasPanelImage) {
        ctx.addPhotoPanel(slide, design.imagePath, 8.98, 1.28, 2.74, 3.96, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:24 });
        ctx.addRect(slide, 8.98, 4.24, 2.74, 1.00, panel, panel, { fill:{color:panel, transparency:10}, line:{color:panel, transparency:100} });
        ctx.addLabel(slide, companyIntro ? '现场图像' : 'VISUAL PROOF', { x:9.24, y:4.58, w:1.08, h:0.10, fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
        const imageCaption = ctx.copyFallback(plan, 'fallbackCaption');
        ctx.addText(slide, (s.visual && s.visual.caption) || imageCaption, { x:9.24, y:4.82, w:1.88, h:0.15, fontSize:7.4, color:C.body, fit:'shrink' });
      } else {
        ctx.addText(slide, '01', { x:9.28, y:1.64, w:0.44, h:0.18, fontSize:10, bold:true, color:C.accent });
        ctx.addText(slide, s.coverProofTitle || plan.coverProofTitle || ctx.copyFallback(plan, 'coverProofTitle'), { x:9.28, y:2.20, w:1.78, h:0.18, fontSize:11.2, bold:true, color:C.text, fit:'shrink' });
        ctx.addText(slide, s.coverProof || plan.coverProof || insight || ctx.copyFallback(plan, 'coverProof'), { x:9.28, y:2.80, w:1.74, h:0.52, fontSize:7.6, color:C.body, breakLine:true, fit:'shrink' });
      }
    }

    ctx.addDeckMeta(slide, plan, { x:x0+0.02, y:6.38, w:5.70, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:ctx.typeSize('caption', 7.4), color:C.muted });
  }

  function beautyBrandEditorialCover(slide, plan, s) {
    const C = colors();
    ctx.lightCanvas(slide);
    ctx.addLabel(slide, 'BEAUTY BRAND WORLD', { x:0.86, y:0.48, w:2.00, h:0.13, fontSize:7.0, color:C.accent, charSpace:1.0 });
    ctx.addText(slide, s.title || plan.title || ctx.copyFallback(plan, 'coverTitle'), {
      x:0.84, y:1.54, w:5.40, h:0.84, fontSize:ctx.typeSize('coverTitle', 30.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    ctx.addText(slide, s.subtitle || s.coverInsight || plan.subtitle || ctx.copyFallback(plan, 'industryInsight'), {
      x:0.86, y:2.70, w:4.62, h:0.30, fontSize:11.0, color:C.body, fit:'shrink'
    });
    ctx.addRect(slide, 0.88, 3.28, 0.86, 0.05, C.accent, C.accent);
    ctx.addRect(slide, 1.88, 3.28, 0.34, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

    const imagePath = ctx.designForSlide(plan, s, 'cover').imagePath;
    const hero = { x:6.46, y:1.16, w:4.92, h:3.86 };
    ctx.addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    if (imagePath && fileExists(imagePath)) {
      ctx.addPhotoPanel(slide, imagePath, hero.x+0.18, hero.y+0.18, hero.w-0.36, 2.56, { tone:'light', transparency:88, stroke:'FFFFFF', strokeTransparency:70, fit:'cover' });
    } else {
      ctx.genericShowcaseField(slide, hero.x+0.22, hero.y+0.24, hero.w-0.44, 2.50, 'PRODUCT TEXTURE');
    }
    ctx.addRect(slide, hero.x, hero.y+hero.h-0.98, hero.w, 0.98, C.ink, C.ink, { fill:{color:C.ink, transparency:8}, line:{color:C.ink, transparency:100} });
    ctx.addLabel(slide, 'PRODUCT · TEXTURE · PROOF', { x:hero.x+0.30, y:hero.y+hero.h-0.64, w:1.72, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
    ctx.addText(slide, (s.visual && s.visual.caption) || ctx.copyFallback(plan, 'fallbackCaption'), {
      x:hero.x+0.30, y:hero.y+hero.h-0.36, w:3.50, h:0.14, fontSize:7.5, color:'CBD5E1', fit:'shrink'
    });

    const proof = Array.isArray(s.coverIndex) ? s.coverIndex : (Array.isArray(plan.coverIndex) ? plan.coverIndex : []);
    proof.slice(0, 3).forEach((row, i) => {
      const item = Array.isArray(row) ? row : [ctx.itemTitle(row), ctx.itemBody(row)];
      const y = 4.22 + i * 0.54;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      ctx.addNumber(slide, String(i + 1).padStart(2, '0'), { x:0.92, y:y+0.04, w:0.30, h:0.10, fontSize:6.5, color:accent });
      ctx.addText(slide, item[0], { x:1.38, y, w:0.98, h:0.14, fontSize:8.8, bold:true, color:C.text, fit:'shrink' });
      ctx.addText(slide, item[1], { x:2.76, y, w:2.56, h:0.14, fontSize:7.5, color:C.body, fit:'shrink' });
    });
    ctx.addDeckMeta(slide, plan, { x:0.88, y:6.36, w:5.50, h:0.14, fontSize:7.4, color:C.muted, fit:'shrink' });
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.6, color:C.muted });
  }

  function airyConceptOpening(slide, plan, s) {
    const C = colors();
    ctx.lightCanvas(slide);
    const imagePath = ctx.designForSlide(plan, s, 'cover').imagePath;
    ctx.addLabel(slide, 'CONCEPT OPENING', { x:0.88, y:0.92, w:1.62, h:0.13, fontSize:7.0, color:C.accent, charSpace:1.0 });
    ctx.addText(slide, s.title || plan.title || ctx.copyFallback(plan, 'coverTitle'), {
      x:0.86, y:1.70, w:6.52, h:0.86, fontSize:ctx.typeSize('coverTitle', 31.0), bold:true, color:C.text, fit:'shrink', breakLine:true
    });
    ctx.addText(slide, s.subtitle || s.coverInsight || plan.subtitle || ctx.copyFallback(plan, 'industryInsight'), {
      x:0.90, y:2.86, w:4.88, h:0.22, fontSize:11.0, color:C.body, fit:'shrink'
    });
    ctx.addRect(slide, 0.92, 3.44, 0.92, 0.04, C.accent, C.accent);
    ctx.addRect(slide, 2.00, 3.44, 0.32, 0.04, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:36}, line:{color:C.cyan, transparency:100} });

    const object = { x:7.70, y:1.28, w:2.78, h:2.78 };
    slide.addShape('ellipse', { x:object.x-0.54, y:object.y-0.54, w:object.w+1.08, h:object.h+1.08, fill:{color:C.softBlue || 'EFF6FF', transparency:34}, line:{color:C.softBlue || 'EFF6FF', transparency:100} });
    ctx.addRect(slide, object.x, object.y, object.w, object.h, ctx.panelFill(), C.line, { fill:{color:ctx.panelFill(), transparency:0}, line:{color:C.line, transparency:18, width:0.44} });
    if (imagePath && fileExists(imagePath)) {
      ctx.addPhotoPanel(slide, imagePath, object.x+0.20, object.y+0.20, object.w-0.40, object.h-0.40, { tone:'light', transparency:100, stroke:C.line, strokeTransparency:28, fit:'cover' });
    } else {
      ctx.genericShowcaseField(slide, object.x+0.20, object.y+0.20, object.w-0.40, object.h-0.40, 'CORE OBJECT');
    }
    ctx.addLabel(slide, 'ONE OBJECT', { x:7.82, y:4.52, w:0.98, h:0.09, fontSize:5.6, color:C.accent, charSpace:0.8 });
    ctx.addText(slide, (s.visual && s.visual.caption) || ctx.copyFallback(plan, 'fallbackCaption'), { x:8.98, y:4.48, w:1.86, h:0.12, fontSize:7.4, color:C.body, fit:'shrink' });

    const proof = s.coverProof || s.note || ctx.copyFallback(plan, 'coverProof');
    ctx.addRect(slide, 0.92, 5.46, 7.20, 0.48, C.panelAlt || C.softBlue, C.line, { fill:{color:C.panelAlt || C.softBlue, transparency:10}, line:{color:C.line, transparency:100} });
    ctx.addLabel(slide, 'PROOF DIRECTION', { x:1.16, y:5.63, w:1.30, h:0.09, fontSize:5.6, color:C.accent, charSpace:0.7 });
    ctx.addText(slide, proof, { x:2.82, y:5.60, w:4.64, h:0.12, fontSize:7.8, color:C.body, fit:'shrink' });
    ctx.addDeckMeta(slide, plan, { x:0.90, y:6.42, w:5.60, h:0.14, fontSize:7.2, color:C.muted, fit:'shrink' });
    ctx.addText(slide, ctx.footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.6, color:C.muted });
  }

  function coverDark(slide, plan, s) {
    const C = colors();
    ctx.masterDark(slide, plan, '', null, '', { field:false });
    const coverVariant = ctx.variantOf(s, '');
    if (coverVariant === 'beauty-brand-editorial-cover') return beautyBrandEditorialCover(slide, plan, s);
    if (coverVariant === 'airy-concept-opening') return airyConceptOpening(slide, plan, s);
    const industry = ctx.industryProfile(plan);
    const rawTitle = String(s.title || plan.title || '');
    const title = plan.industry === 'energy-utility' ? rawTitle.replace(/\n/g, '') : coverTitleText(rawTitle);
    const coverDesign = ctx.designForSlide(plan, s, 'cover');
    const coverTone = ctx.presentationSpec().coverTone || 'dark';
    const hasCoverImage = coverDesign.imagePath && fileExists(coverDesign.imagePath);
    if (plan.industry === 'finance-investment' && plan.visualIntent === 'case-led' && hasCoverImage) {
      if (coverShowcase(slide, plan, s, industry, title)) return;
    }
    if (plan.industry !== 'energy-utility' && (coverTone === 'light' || coverTone === 'split')) {
      return coverLightEditorial(slide, plan, s, industry, title);
    }
    if (plan.industry !== 'energy-utility' && coverDesign.imageRole !== 'background' && coverShowcase(slide, plan, s, industry, title)) {
      return;
    }
    const genericPhotoCover = plan.industry !== 'energy-utility' && ctx.addVisualPhotoBackdrop(slide, plan, s, 'cover', { transparency:70 });
    if (!genericPhotoCover) {
      coverFieldRendererFor(industry)(slide, plan);
    } else {
      ctx.addDarkBreathingCircle(slide, 8.42, 0.82, 4.08, 2.30, C.accent);
    }

    if (plan.industry === 'energy-utility') {
      const [primaryTitle, secondaryTitle] = splitEnergyTitle(title);
      addCoverKicker(slide, plan, industry, { x:0.86, y:1.10, w:3.8, h:0.16, fontSize:7.6, color:C.cyan, charSpace:1.15 });
      if (secondaryTitle) {
        ctx.addText(slide, primaryTitle, { x:0.84, y:2.02, w:5.15, h:0.58, fontSize:ctx.typeSize('coverHeroTitle', 41.0), bold:true, color:C.white, fit:'shrink', breakLine:false });
        ctx.addText(slide, secondaryTitle, { x:0.88, y:2.78, w:5.80, h:0.42, fontSize:24.5, bold:true, color:C.white, fit:'shrink', breakLine:false });
      } else {
        ctx.addText(slide, title, { x:0.84, y:2.30, w:7.25, h:0.62, fontSize:ctx.typeSize('coverTitle', 33.0), bold:true, color:C.white, fit:'shrink', breakLine:false });
      }
      const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
      ctx.addText(slide, insight, { x:0.88, y:3.48, w:5.85, h:0.22, fontSize:11.2, color:'CBD5E1', fit:'shrink' });
      ctx.addRect(slide, 0.88, 3.92, 0.82, 0.035, C.accent, C.accent);
      ctx.addRect(slide, 1.82, 3.92, 0.34, 0.035, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:40}, line:{color:C.cyan, transparency:100} });
      ctx.addDeckMeta(slide, plan, { x:0.88, y:6.24, w:7.3, h:0.16, fontSize:7.8, color:'CBD5E1', fit:'shrink' });
      return;
    }

    addCoverKicker(slide, plan, industry, { x:0.92, y:1.18, w:3.8, h:0.16, fontSize:8.6, color:C.cyan, charSpace:1.1 });
    ctx.addText(slide, title, { x:0.88, y:2.05, w:6.55, h:1.08, fontSize:ctx.typeSize('coverTitle', 31.0), bold:true, color:C.white, breakLine:true, fit:'shrink' });
    const insight = s.coverInsight || plan.coverInsight || industry.insight || s.subtitle || plan.subtitle;
    ctx.addText(slide, insight, { x:0.92, y:3.36, w:5.7, h:0.20, fontSize:11.5, color:'CBD5E1', fit:'shrink' });
    ctx.addHairline(slide, 0.92, 3.78, 0.82, C.accent, 0, 0.65);
    ctx.addHairline(slide, 1.86, 3.78, 0.34, C.cyan, 38, 0.50);
    ctx.addDeckMeta(slide, plan, { x:0.92, y:6.30, w:7.1, h:0.16, fontSize:8.2, color:'CBD5E1' });
  }

  return {
    coverDark
  };
}


module.exports = {
  createCoverCoreRenderers
};
