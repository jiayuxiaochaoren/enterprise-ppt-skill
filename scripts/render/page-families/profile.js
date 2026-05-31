const family = 'profile';

const types = ['company-profile-spread', 'profile-proof', 'quote-proof'];

function createProfileRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    EvidenceImageFrame,
    MetricStrip,
    addDarkBreathingCircle,
    addEquipmentNameplate,
    addHairline,
    addLabel,
    addNumber,
    addPhotoPanel,
    addRect,
    addText,
    designForSlide,
    fileExists,
    footerText,
    galleryImages,
    imageAspect,
    isCompanyIntroPlan,
    lightCanvas,
    mediaForRole,
    panelFill,
    publicSlideNote,
    resolveAssetPath,
    sectionKicker,
    stageCanvas
  } = ctx;

  function financeProfileProof(slide, plan, s, idx) {
    stageCanvas(slide);
    sectionKicker(slide, 'INVESTMENT PLATFORM PROOF', 0.84, 0.72, true);
    addText(slide, s.title || '管理团队与投后能力证明', { x:0.82, y:1.06, w:6.3, h:0.38, fontSize:24, bold:true, color:C.white, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.84, y:1.54, w:6.4, h:0.20, fontSize:10.2, color:C.darkMuted || '94A3B8', fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:C.accent, align:'right' });

    const left = { x:0.92, y:2.08, w:4.18, h:4.00 };
    addRect(slide, left.x, left.y, left.w, left.h, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:22},
      line:{color:'334155', transparency:54, width:0.52}
    });
    addLabel(slide, 'MANAGER CREDENTIALS', { x:left.x+0.34, y:left.y+0.38, w:1.86, h:0.11, fontSize:6.2, color:C.accent, charSpace:0.85 });
    addText(slide, s.company || plan.organization || '产业投资与投后管理团队', { x:left.x+0.34, y:left.y+0.88, w:2.74, h:0.42, fontSize:20, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.description || s.body || '以投资纪律、产业研究、投后经营和退出管理支撑组合决策。', {
      x:left.x+0.34, y:left.y+1.70, w:2.86, h:0.78, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink'
    });
    addHairline(slide, left.x+0.34, left.y+2.92, 0.86, C.accent, 0, 0.68);
    addText(slide, s.tagline || '以历史业绩、项目经验和复盘机制建立长期信任。', {
      x:left.x+0.34, y:left.y+3.26, w:2.74, h:0.18, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink'
    });

    const metrics = (s.metrics || s.cards || []).slice(0,4);
    const cards = metrics.length ? metrics : [
      { value:'6', label:'覆盖赛道' },
      { value:'42', label:'在管项目' },
      { value:'18轮', label:'投后复盘' },
      { value:'9', label:'退出案例' }
    ];
    const grid = { x:5.62, y:2.08, w:5.88, h:4.00 };
    addLabel(slide, 'TRACK RECORD SIGNALS', { x:grid.x, y:grid.y+0.10, w:1.86, h:0.11, fontSize:6.2, color:'64748B', charSpace:0.85 });
    cards.forEach((m,i)=>{
      const x = grid.x + (i%2)*3.02;
      const y = grid.y + 0.48 + Math.floor(i/2)*1.62;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : '94A3B8'));
      addRect(slide, x, y, 2.62, 1.20, C.ink, '334155', {
        fill:{color:C.ink, transparency:i===0?0:18},
        line:{color:accent, transparency:i===0?24:62, width:0.46}
      });
      addLabel(slide, `PROOF 0${i+1}`, { x:x+0.24, y:y+0.22, w:0.86, h:0.09, fontSize:5.4, color:accent, charSpace:0.75 });
      addNumber(slide, m.value || m.title || String(i+1).padStart(2,'0'), { x:x+0.24, y:y+0.48, w:1.26, h:0.30, fontSize:22, color:accent, fit:'shrink' });
      addText(slide, m.label || m.body || m.note || '', { x:x+1.36, y:y+0.56, w:0.86, h:0.16, fontSize:8.0, bold:true, color:C.white, fit:'shrink' });
    });
    addRect(slide, grid.x, 6.34, 4.98, 0.34, C.ink2, '334155', {
      fill:{color:C.ink2, transparency:36},
      line:{color:'334155', transparency:70, width:0.34}
    });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, {
      x:grid.x+0.24, y:6.44, w:4.46, h:0.10, fontSize:6.8, color:C.darkMuted || '94A3B8', fit:'shrink'
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
  }

  function manufacturingCompanyProfileSpread(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, '公司概况', 0.86, 0.72, false);
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const company = s.company || plan.organization || plan.title || '公司名称';
    addText(slide, s.title || company, { x:0.84, y:1.04, w:5.40, h:0.36, fontSize:24.0, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.subtitle || '以制造基础、产品谱系和现场交付经验建立合作信任。', {
      x:0.86, y:1.52, w:6.20, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink'
    });

    const dark = { x:0.92, y:2.10, w:3.06, h:3.72 };
    addRect(slide, dark.x, dark.y, dark.w, dark.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, '制造基础', { x:dark.x+0.30, y:dark.y+0.34, w:1.02, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    addText(slide, company, { x:dark.x+0.30, y:dark.y+0.82, w:2.16, h:0.38, fontSize:17.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.description || s.body || '围绕装备制造、输送系统和现场交付形成综合服务能力。', {
      x:dark.x+0.30, y:dark.y+1.56, w:2.22, h:0.68, fontSize:8.4, color:C.captionOnImage, breakLine:true, fit:'shrink'
    });
    addHairline(slide, dark.x+0.30, dark.y+2.72, 0.82, C.accent, 0, 0.62);
    addText(slide, s.tagline || '以可核验制造事实建立合作信任', {
      x:dark.x+0.30, y:dark.y+3.02, w:2.14, h:0.13, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink'
    });

    const metrics = (s.metrics || []).slice(0, 4);
    const profileCards = (s.cards || s.items || []).map(v => typeof v === 'string' ? { title:v } : v).slice(0, 4);
    const proofCards = metrics.length ? metrics : profileCards;
    proofCards.slice(0,4).forEach((m, i) => {
      const x = 4.34 + (i % 2) * 1.94;
      const y = 2.18 + Math.floor(i / 2) * 1.34;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : (i===2 ? C.violet : C.muted));
      const value = m.value || m.title || String(i + 1).padStart(2,'0');
      const label = m.label || m.body || m.note || '';
      addRect(slide, x, y, 1.58, 1.08, panelFill(), C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:C.line, transparency:16, width:0.42}
      });
      addRect(slide, x, y, 1.58, 0.035, accent, accent, { line:{color:accent, transparency:100} });
      addLabel(slide, `事实 ${String(i+1).padStart(2,'0')}`, { x:x+0.20, y:y+0.24, w:0.66, h:0.09, fontSize:5.2, color:accent, charSpace:0 });
      addNumber(slide, value, { x:x+0.20, y:y+0.48, w:1.10, h:0.24, fontSize:20.5, color:accent, fit:'shrink' });
      addText(slide, label, { x:x+0.22, y:y+0.84, w:1.10, h:0.12, fontSize:7.0, color:C.body, fit:'shrink' });
    });

    const images = galleryImages(plan, s);
    const hero = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : (images[0] || mediaForRole(plan, s, 'situation'));
    if (hero && fileExists(hero)) {
      EvidenceImageFrame(slide, hero, 8.42, 2.10, 2.94, 3.72, {
        dark:false,
        role:'evidence',
        inset:0.12,
        captionH:0.48,
        label:'现场图片',
        labelWidth:0.72,
        caption:(s.visual && s.visual.caption) || '图片仅作为制造证据入口，事实以材料可核验内容为准。',
        fontSize:6.0
      });
    } else {
      addEquipmentNameplate(slide, 8.42, 2.34, 2.94, {
        label:'制造证据',
        text:'补充厂区、车间、设备或项目图片后，可形成更完整的企业画册式证据页。'
      });
    }

    addText(slide, s.note || '公司基础页先建立可信身份，再用少量事实和一张证据图承接能力证明。', {
      x:0.96, y:6.36, w:7.70, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink'
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function companyProfileSpread(slide, plan, s, idx) {
    if (plan.industry === 'manufacturing-operations') return manufacturingCompanyProfileSpread(slide, plan, s, idx);
    lightCanvas(slide);
    sectionKicker(slide, '公司概况', 0.86, 0.72, false);
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });

    const company = s.company || plan.organization || plan.title || '公司名称';
    addText(slide, company, { x:0.84, y:1.14, w:4.62, h:0.72, fontSize:24.5, bold:true, color:C.text, fit:'shrink', breakLine:true });
    addText(slide, s.subtitle || '以制造基础、产品谱系和现场交付经验建立合作信任。', {
      x:0.86, y:2.06, w:4.60, h:0.22, fontSize:10.6, color:C.body, fit:'shrink'
    });
    addRect(slide, 0.86, 2.54, 0.92, 0.045, C.accent, C.accent);
    addRect(slide, 1.94, 2.54, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:34}, line:{color:C.cyan, transparency:100} });
    addText(slide, s.description || s.body || '围绕装备制造、输送系统和现场交付形成综合服务能力。', {
      x:0.86, y:3.04, w:4.68, h:0.74, fontSize:9.2, color:C.body, breakLine:true, fit:'shrink', valign:'mid'
    });
    if (plan.industry === 'manufacturing-operations') {
      addEquipmentNameplate(slide, 0.86, 4.08, 4.48, {
        label:'制造证据',
        text:'厂区、车间、设备与项目图像统一作为外发证据，而非装饰背景。'
      });
    }

    const images = galleryImages(plan, s);
    const profileCards = (s.cards || s.items || []).map(v => typeof v === 'string' ? { title:v } : v);
    const hero = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : (images[0] || mediaForRole(plan, s, 'situation'));
    EvidenceImageFrame(slide, hero, 6.10, 0.98, 5.62, 3.24, {
      dark:true,
      role:'showcase',
      label:'现场 / 产品图像',
      labelWidth:1.30,
      caption:(s.visual && s.visual.caption) || itemTitle(profileCards[0], '以真实图片承接企业基础与制造能力证明。'),
      fallbackLabel:company
    });

    const secondary = images.filter(p => p !== hero).slice(0, 2);
    secondary.forEach((img, i) => {
      const x = 6.10 + i * 2.86;
      EvidenceImageFrame(slide, img, x, 4.54, 2.60, 1.12, {
        dark:false,
        role:'evidence',
        inset:0.10,
        captionH:0.28,
        label:`图像 ${i + 2}`,
        labelWidth:0.68,
        caption:itemTitle(profileCards[i + 1], `现场图片 ${i + 2}`),
        fontSize:6.0
      });
    });

    const metrics = (s.metrics || []).slice(0, 4);
    MetricStrip(slide, metrics, 0.86, 5.90, 10.84, { h:0.74 });
    if (!metrics.length) {
      addRect(slide, 0.86, 5.88, 4.84, 0.42, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.38} });
      addText(slide, '补充始建年份、厂区规模、车间面积、核心设备等可核验事实后，可形成更完整的外发公司页。', {
        x:1.08, y:6.02, w:4.20, h:0.10, fontSize:6.8, color:C.muted, fit:'shrink'
      });
    }
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function profileProof(slide, plan, s, idx) {
    if (plan.industry === 'finance-investment') return financeProfileProof(slide, plan, s, idx);
    const companyIntro = isCompanyIntroPlan(plan);
    lightCanvas(slide);
    sectionKicker(slide, companyIntro ? '公司概况' : 'PROFILE PROOF', 0.86, 0.72, false);
    addText(slide, s.title || '公司与能力证明', { x:0.84, y:1.05, w:5.5, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    if (s.subtitle || s.claim) addText(slide, s.subtitle || s.claim, { x:0.86, y:1.52, w:6.2, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const metrics = (s.metrics || []).slice(0,4);
    addRect(slide, 0.92, 2.10, 3.18, 3.72, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, companyIntro ? '企业信息' : 'IDENTITY', { x:1.20, y:2.44, w:1.0, h:0.10, fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
    addText(slide, s.company || plan.organization || '组织名称', { x:1.20, y:2.90, w:2.12, h:0.36, fontSize:18.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.description || s.body || '围绕企业基础、产品能力、制造交付和长期服务建立合作信任。', { x:1.20, y:3.58, w:2.30, h:0.70, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, 1.20, 4.72, 0.86, C.accent, 0, 0.72);
    addText(slide, s.tagline || (companyIntro ? '以制造基础和项目经验建立合作信任' : '以可验证经验建立决策信任'), { x:1.20, y:5.05, w:2.12, h:0.14, fontSize:7.4, color:C.darkMuted, fit:'shrink' });
    const proofDesign = designForSlide(plan, s, 'situation');
    const hasProofImage = proofDesign.imagePath && fileExists(proofDesign.imagePath);
    const proofIsPortrait = hasProofImage && imageAspect(proofDesign.imagePath) < 0.9;
    if (hasProofImage) {
      if (proofIsPortrait) {
        addPhotoPanel(slide, proofDesign.imagePath, 9.10, 2.08, 2.36, 3.74, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:26, fit:'cover' });
        addRect(slide, 9.10, 5.18, 2.36, 0.64, panelFill(), panelFill(), { fill:{color:panelFill(), transparency:10}, line:{color:panelFill(), transparency:100} });
        addLabel(slide, companyIntro ? '现场图片' : 'BRAND PROOF', { x:9.34, y:5.40, w:1.04, h:0.09, fontSize:5.5, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
      } else {
        addPhotoPanel(slide, proofDesign.imagePath, 4.64, 1.98, 6.40, 1.44, { tone:'light', transparency:72, stroke:C.line, strokeTransparency:26, fit:'cover' });
        addRect(slide, 4.64, 3.06, 6.40, 0.36, panelFill(), panelFill(), { fill:{color:panelFill(), transparency:10}, line:{color:panelFill(), transparency:100} });
        addLabel(slide, companyIntro ? '现场图片' : 'BRAND PROOF', { x:4.92, y:3.18, w:1.04, h:0.09, fontSize:5.5, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
      }
    }
    const cards = metrics.length ? metrics : (s.cards || []).slice(0,4);
    cards.forEach((m,i)=>{
      const cardW = proofIsPortrait ? 1.86 : 2.70;
      const x = proofIsPortrait ? (4.48 + (i%2)*2.18) : (4.64 + (i%2)*3.04);
      const y = proofIsPortrait ? (2.26 + Math.floor(i/2)*1.54) : ((hasProofImage ? 3.72 : 2.18) + Math.floor(i/2)*1.24);
      const cardH = proofIsPortrait ? 1.18 : (hasProofImage ? 1.00 : 1.16);
      const value = m.value || m.title || String(i+1).padStart(2,'0');
      const label = m.label || m.body || m.note || '';
      const accent = i===0?C.accent:(i===1?C.cyan:(i===2?C.tertiary || C.violet:C.muted));
      addRect(slide, x, y, cardW, cardH, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.5} });
      addRect(slide, x, y, cardW, 0.035, accent, accent, { line:{color:accent, transparency:100} });
      addLabel(slide, companyIntro ? `事实 ${String(i+1).padStart(2,'0')}` : `PROOF 0${i+1}`, { x:x+0.22, y:y+0.28, w:0.92, h:0.09, fontSize:5.4, color:accent, charSpace:companyIntro ? 0 : 0.75 });
      addNumber(slide, value, { x:x+0.22, y:y+0.48, w:cardW-0.42, h:0.28, fontSize:hasProofImage ? 21.5 : 24, color:accent, fit:'shrink' });
      addText(slide, label, { x:x+0.24, y:y+0.86, w:cardW-0.46, h:0.16, fontSize:8.2, color:C.body, fit:'shrink' });
    });
    const note = publicSlideNote(s.note);
    if (note) addText(slide, note, { x:4.68, y:6.28, w:6.10, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function quoteProof(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    addDarkBreathingCircle(slide, 8.72, 0.70, 3.88, 2.10, C.accent);
    addLabel(slide, 'CUSTOMER VOICE', { x:0.86, y:0.94, w:1.92, h:0.14, fontSize:8.2, color:C.darkMuted, charSpace:0.8 });
    addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.76, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' });
    const quote = s.quote || s.statement || s.title || '一句来自用户、客户或团队的关键声音。';
    addText(slide, `“${quote}”`, { x:0.82, y:1.72, w:6.90, h:1.05, fontSize:27, bold:true, color:C.white, fit:'shrink', breakLine:true });
    addText(slide, s.attribution || s.subtitle || '', { x:0.88, y:3.12, w:4.20, h:0.16, fontSize:9.2, color:C.captionOnImage, fit:'shrink' });
    addHairline(slide, 0.88, 3.54, 0.86, C.accent, 0, 0.75);
    const proofs = (s.items || s.cards || []).slice(0,3);
    proofs.forEach((p,i)=>{
      const x = 0.92 + i*3.18;
      addRect(slide, x, 4.70, 2.62, 0.90, C.ink2, C.darkLine, { fill:{color:C.ink2, transparency:32}, line:{color:C.darkLine, transparency:56, width:0.45} });
      addText(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:4.98, w:0.32, h:0.12, fontSize:7.0, bold:true, color:i===0?C.accent:C.cyan });
      addText(slide, typeof p === 'string' ? p : (p.title || ''), { x:x+0.62, y:4.94, w:1.58, h:0.15, fontSize:9.2, bold:true, color:C.white, fit:'shrink' });
      const body = typeof p === 'string' ? '' : (p.body || p.note || '');
      if (body) addText(slide, body, { x:x+0.62, y:5.24, w:1.68, h:0.12, fontSize:6.5, color:C.darkMuted, fit:'shrink' });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }


  return {
    companyProfileSpread,
    profileProof,
    quoteProof
  };
}

function entries(renderers = {}) {
  return [
    { types:['company-profile-spread'], render:renderers.companyProfileSpread, source:`page-family:${family}` },
    { types:['profile-proof'], render:renderers.profileProof, source:`page-family:${family}` },
    { types:['quote-proof'], render:renderers.quoteProof, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createProfileRenderers,
  entries
};
