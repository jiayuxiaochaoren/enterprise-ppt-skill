const family = 'evidenceGallery';

const types = [
  'case-gallery',
  'gallery',
  'portfolio'
];

function createEvidenceGalleryRenderers(ctx = {}) {
  function caseGallery(slide, plan, s, idx) {
    const C = ctx.colors();
    const variant = ctx.variantOf(s, 'triptych-gallery');
    if (variant === 'case-hero') return ctx.caseEvidenceHero(slide, plan, s, idx);
    if (variant === 'case-comparison') return plan.industry === 'energy-utility'
      ? ctx.energySiteComparisonSlide(slide, plan, s, idx)
      : ctx.caseComparisonSlide(slide, plan, s, idx);
    if (variant === 'people-proof-mosaic') return ctx.peopleProofMosaic(slide, plan, s, idx);
    if (variant === 'sustainability-proof-spread') return ctx.sustainabilityProofSpread(slide, plan, s, idx);
    if (variant === 'consumer-proof-photo-grid') return ctx.consumerProofPhotoGrid(slide, plan, s, idx);
    if (variant === 'product-evidence-story') return ctx.productEvidenceStory(slide, plan, s, idx);
    if (variant === 'executive-proof-board') return ctx.executiveProofBoard(slide, plan, s, idx);
    if (variant === 'brand-world-and-business-proof') return ctx.brandWorldBusinessProof(slide, plan, s, idx);
    if (variant === 'evidence-board') return ctx.caseEvidenceBoard(slide, plan, s, idx);
    if (variant === 'lookbook-story') return ctx.retailLookbookStory(slide, plan, s, idx);
    if (variant === 'portfolio-evidence') return ctx.financePortfolioEvidenceGallery(slide, plan, s, idx);
    if (variant === 'service-touchpoint') return ctx.healthcareTouchpointEvidenceGallery(slide, plan, s, idx);
    if (variant === 'site-evidence') return ctx.energySiteEvidenceGallery(slide, plan, s, idx);
    if (variant === 'prototype-flow') return ctx.saasPrototypeFlowGallery(slide, plan, s, idx);
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
    caseGallery
  };
}

function entries(renderers = {}) {
  return [
    { types:['case-gallery', 'gallery', 'portfolio'], render:renderers.caseGallery, source:'page-family:evidence-gallery' }
  ];
}

module.exports = {
  family,
  types,
  createEvidenceGalleryRenderers,
  entries
};
