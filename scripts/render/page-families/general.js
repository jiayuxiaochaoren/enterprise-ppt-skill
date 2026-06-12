const family = 'general';

const types = [
  'two-column',
  'two-column-clean'
];

function createGeneralRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText,
    addVisualPhotoPanel,
    masterLight,
    profileFont
  } = ctx;

  function twoColumnClean(slide, plan, s, idx) {
    masterLight(slide, plan, s.title, idx);
    addText(slide, 'SITUATION READOUT', { x:0.94, y:1.76, w:1.82, h:0.12, fontSize:7.2, color:C.muted, charSpace:1.0 });
    const hasEvidenceImage = addVisualPhotoPanel(slide, plan, s, 'situation', 0.92, 2.08, 4.36, 2.40, { transparency:100, stroke:'E8EEF6', strokeTransparency:18 });
    if (hasEvidenceImage) {
      addRect(slide, 0.92, 4.68, 4.36, 1.24, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
      addLabel(slide, 'FIELD EVIDENCE', { x:1.20, y:4.96, w:1.08, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.7 });
      addText(slide, s.leftTitle || '现场证据', { x:1.20, y:5.24, w:1.38, h:0.14, fontSize:9.8, bold:true, color:C.white, fit:'shrink' });
      const evidenceText = (s.visual && s.visual.caption) || (s.left || []).slice(0,1).join(' ');
      addText(slide, evidenceText || '图片用于说明现场对象与业务语境，不承载长段正文。', { x:2.72, y:5.18, w:2.18, h:0.22, fontSize:6.8, color:'CBD5E1', fit:'shrink' });
    } else {
      addRect(slide, 0.92, 2.08, 4.36, 3.86, C.white, 'E8EEF6', { fill:{color:C.white, transparency:0}, line:{color:'E8EEF6', transparency:12, width:0.48} });
      addText(slide, s.leftTitle || '管理现状', { x:1.20, y:2.44, w:2.56, h:0.22, fontSize:14.8, bold:true, color:C.text, valign:'mid' });
      const runs = (s.left || []).slice(0,4).map(v => ({ text:String(v), options:{ bullet:{type:'bullet'}, breakLine:true } }));
      slide.addText(runs, { x:1.20, y:3.02, w:3.44, h:1.76, fontFace:profileFont(), fontSize:10.8, color:C.body, fit:'shrink', valign:'mid', paraSpaceAfterPt:7, margin:0.02 });
      addHairline(slide, 1.20, 5.30, 0.82, C.accent, 0, 0.72);
      addText(slide, '从业务事实出发，先识别运营断点，再进入方案设计。', { x:1.20, y:5.50, w:3.12, h:0.18, fontSize:8.2, color:C.muted, fit:'shrink', valign:'mid' });
    }

    addText(slide, s.rightTitle || '升级诉求', { x:6.05, y:1.76, w:3.5, h:0.25, fontSize:15.5, bold:true, color:C.text });
    addText(slide, '将材料里的问题转成可验证、可落地的决策议题。', { x:6.05, y:2.12, w:4.6, h:0.16, fontSize:8.7, color:C.muted });
    (s.cards || []).slice(0,3).forEach((c,i)=>{
      const y = 2.62 + i*1.16;
      const accent = i===1 ? C.cyan : C.accent;
      addRect(slide, 6.05, y, 5.18, 0.92, C.white, 'E8EEF6', { line:{color:'E8EEF6', transparency:4, width:0.55} });
      addText(slide, String(i+1).padStart(2,'0'), { x:6.30, y:y+0.18, w:0.34, h:0.11, fontSize:7.2, bold:true, color:accent });
      addText(slide, c.title, { x:6.78, y:y+0.13, w:2.75, h:0.15, fontSize:11.8, bold:true, color:C.text, fit:'shrink', valign:'mid' });
      addText(slide, c.body, { x:6.78, y:y+0.44, w:3.92, h:0.26, fontSize:7.6, color:C.body, fit:'shrink', valign:'mid', breakLine:true });
    });
  }

  return {
    twoColumnClean
  };
}

function entries(renderers = {}) {
  return [
    { types:['two-column', 'two-column-clean'], render:renderers.twoColumnClean, source:`page-family:${family}` }
  ];
}

module.exports = {
  createGeneralRenderers,
  family,
  types,
  entries
};
