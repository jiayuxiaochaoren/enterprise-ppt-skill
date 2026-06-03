function createClosingThankYouRenderer(ctx = {}, deps = {}) {
  const { closingMeta, drawFooter } = deps;
  const C = ctx.colors();
  const W = typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const {
    addHairline,
    addLabel,
    addLightBreathingCircle,
    addNumber,
    addRect,
    addText,
    copyFallback,
    metaDisabled,
    profileFont,
    surfaceFill,
    typeSize
  } = ctx;

  return function closingThankYou(slide, plan, s, idx) {
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
    drawFooter(slide, plan, { x:0.86, y:6.98, w:7.80, h:0.13, fontSize:7.2, fit:'shrink' });
  };
}

module.exports = {
  createClosingThankYouRenderer
};
