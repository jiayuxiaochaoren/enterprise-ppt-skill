const {
  createRightSideCardRenderer
} = require('./right-side-card');

function createClosingThankYouRenderer(ctx = {}, deps = {}) {
  const { closingMeta, drawFooter } = deps;
  const C = ctx.colors();
  const W = typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333;
  const H = typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5;
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    copyFallback,
    metaDisabled,
    profileFont,
    surfaceFill,
    typeSize
  } = ctx;
  const {
    drawRightSideCard
  } = createRightSideCardRenderer(ctx);

  return function closingThankYou(slide, plan, s, idx) {
    const showMeta = s.showMeta !== false && s.meta !== false;
    const bg = surfaceFill();
    slide.background = { color:bg };
    addRect(slide, 0, 0, W, H, bg, bg);
    addNumber(slide, String(idx || '').padStart(2,'0'), { x:11.54, y:0.72, w:0.62, h:0.20, fontSize:11.2, color:C.accent, align:'right', fit:'shrink' });
    const side = drawRightSideCard(slide, {}, { fill:C.ink, railColor:C.accent, railTransparency:18 });
    const sideWords = Array.isArray(s.thankYouWords)
      ? s.thankYouWords.slice(0, 2)
      : [s.thankYouWordTop || '谢谢', s.thankYouWordBottom || '交流'];
    addText(slide, sideWords[0] || '谢谢', { x:side.x+0.36, y:side.y+0.42, w:1.86, h:0.38, fontFace:profileFont('editorial'), fontSize:22.0, bold:true, color:C.accent, align:'right', fit:'shrink' });
    addText(slide, sideWords[1] || '交流', { x:side.x+0.80, y:side.y+0.88, w:1.42, h:0.38, fontFace:profileFont('editorial'), fontSize:22.0, bold:true, color:C.cyan, align:'right', fit:'shrink' });
    addHairline(slide, side.x+0.54, side.y+2.06, 1.16, C.accent, 0, 0.58);
    const explicitContacts = s.contacts || s.contact;
    const contacts = explicitContacts || (!showMeta || metaDisabled(plan) ? [] : [
      plan.organization,
      plan.audience,
      plan.date
    ].filter(Boolean));
    const contactList = Array.isArray(contacts) ? contacts : String(contacts || '').split(/[｜|/]/).map(v => v.trim()).filter(Boolean);
    const sideItems = contactList.length ? contactList : [
      s.note || s.claim || s.subtitle || copyFallback(plan, 'closingSimpleSubtitle'),
      s.channelNote || '渠道节奏与内容口径确认',
      s.reviewNote || closingMeta(plan) || '责任人与复盘节点同步'
    ].filter(Boolean);
    sideItems.slice(0,3).forEach((v,i)=>{
      const y = side.y + 2.62 + i*0.46;
      addLabel(slide, ['信息', '口径', '复盘'][i] || `信息 ${i+1}`, { x:side.x+0.54, y, w:0.56, h:0.09, fontSize:5.4, color:i===0?C.accent:(i===1?C.cyan:C.violet), charSpace:0 });
      addText(slide, String(v), { x:side.x+1.24, y:y-0.03, w:1.02, h:0.16, fontSize:7.2, color:C.captionOnImage, fit:'shrink', align:'right', breakLine:true });
    });

    addLabel(slide, s.label || '结束页', { x:0.86, y:1.02, w:1.20, h:0.13, fontSize:6.9, color:C.accent, charSpace:0 });
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
