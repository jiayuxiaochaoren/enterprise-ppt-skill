function createCaseEvidenceHero(ctx = {}, deps = {}) {
  const {
    addEvidenceCaptionStack,
    addLabel,
    addPhotoPanel,
    addRect,
    addText,
    galleryImages,
    genericShowcaseField,
    itemBody,
    itemTitle,
    panelFill
  } = ctx;
  const C = ctx.colors();
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;

  return function caseEvidenceHero(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'CASE PROOF',
      title:s.title || '案例证据',
      titleSize:23.5,
      subtitle:s.subtitle || s.intro,
      subtitleW:6.0,
      subtitleSize:9.2,
      idx
    });
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
    drawFooter(slide, plan);
  };
}

module.exports = {
  createCaseEvidenceHero
};
