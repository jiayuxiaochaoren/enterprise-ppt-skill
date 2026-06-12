function createEnergySituationRenderers(ctx = {}, deps = {}) {
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    addVisualPhotoPanel,
    slideWantsImage
  } = ctx;
  const colors = deps.colors || (() => ctx.colors());
  const canvasWidth = deps.canvasWidth || (() => typeof ctx.canvasWidth === 'function' ? ctx.canvasWidth() : 13.333);
  const canvasHeight = deps.canvasHeight || (() => typeof ctx.canvasHeight === 'function' ? ctx.canvasHeight() : 7.5);
  const addEnergyFooter = deps.addEnergyFooter || (() => {});

  function energySituationEditorial(slide, plan, s, idx) {
    const C = colors();
    const H = canvasHeight();
    slide.background = { color:'F7FAFD' };
    addRect(slide, 0, 0, canvasWidth(), H, 'F7FAFD', 'F7FAFD');
    const useImage = slideWantsImage(plan, s, 'situation');
    if (useImage) {
      addVisualPhotoPanel(slide, plan, s, 'situation', 0, 0, 4.82, H, { transparency:36, stroke:'334155', strokeTransparency:78 });
    }
    addRect(slide, 0, 0, 4.82, H, useImage ? C.ink : C.white, useImage ? C.ink : 'E4ECF5', {
      fill:{color:useImage ? C.ink : C.white, transparency:useImage ? 18 : 0},
      line:{color:useImage ? C.ink : 'E4ECF5', transparency:useImage ? 100 : 18, width:0.42}
    });
    const leftTitleColor = useImage ? C.white : C.text;
    const leftBodyColor = useImage ? 'CBD5E1' : C.body;
    const leftMutedColor = useImage ? '94A3B8' : C.muted;
    addLabel(slide, 'SITE READOUT', { x:0.78, y:0.76, w:1.36, h:0.12, fontSize:6.8, color:leftMutedColor, charSpace:1.1 });
    addText(slide, s.title || '多站点能源资产运营背景', { x:0.76, y:1.18, w:3.18, h:0.62, typeRole:'pageTitle', fontSize:22.5, bold:true, color:leftTitleColor, fit:'shrink', breakLine:true });
    addText(slide, s.leftTitle || '管理现状', { x:0.82, y:2.28, w:1.36, h:0.18, fontSize:10.6, bold:true, color:leftBodyColor, valign:'mid' });
    (s.left || []).slice(0,3).forEach((it,i)=>{
      const y = 2.78 + i*0.78;
      const accent = i===1 ? C.cyan : C.accent;
      slide.addShape('ellipse', { x:0.86, y:y+0.07, w:0.07, h:0.07, fill:{color:accent}, line:{color:accent, transparency:100} });
      addText(slide, it, { x:1.08, y, w:2.80, h:0.34, typeRole:'bodySmall', fontSize:8.8, color:leftBodyColor, fit:'shrink', breakLine:true, valign:'mid' });
    });
    addHairline(slide, 0.82, 5.62, 1.06, C.accent, 0, 0.65);
    addLabel(slide, 'BESS · PV · MICROGRID', { x:0.82, y:5.92, w:2.18, h:0.12, typeRole:'microLabel', fontSize:6.8, color:leftMutedColor, charSpace:0.7 });

    addLabel(slide, 'UPGRADE DEMANDS', { x:5.62, y:0.72, w:1.48, h:0.12, typeRole:'kicker', fontSize:6.8, color:C.muted, charSpace:1.0 });
    addText(slide, s.rightTitle || '升级诉求', { x:5.58, y:1.10, w:3.0, h:0.30, fontSize:22.0, bold:true, color:C.text });
    addText(slide, '把设备数据、运行状态和策略复盘收束成同一套管理视图。', { x:5.60, y:1.56, w:4.80, h:0.18, typeRole:'bodySmall', fontSize:8.8, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.68, w:0.72, h:0.20, fontSize:12.6, color:C.accent, align:'right' });

    (s.cards || []).slice(0,3).forEach((card,i)=>{
      const y = 2.20 + i*1.22;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addRect(slide, 5.58, y, 5.86, 0.94, C.white, 'E4ECF5', { line:{color:'E4ECF5', transparency:4, width:0.54} });
      addRect(slide, 5.58, y, 0.05, 0.94, accent, accent, { line:{color:accent, transparency:100} });
      addText(slide, String(i+1).padStart(2,'0'), { x:5.90, y:y+0.35, w:0.34, h:0.12, typeRole:'number', fontSize:7.0, bold:true, color:accent, valign:'mid' });
      addText(slide, card.title, { x:6.46, y:y+0.22, w:1.72, h:0.17, typeRole:'cardTitle', fontSize:12.0, bold:true, color:C.text, fit:'shrink', valign:'mid' });
      addText(slide, card.body, { x:8.24, y:y+0.18, w:2.70, h:0.36, typeRole:'bodySmall', fontSize:8.8, color:C.body, fit:'shrink', valign:'mid' });
    });

    addRect(slide, 5.58, 6.03, 5.86, 0.42, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'DESIGN PRINCIPLE', { x:5.88, y:6.16, w:1.20, h:0.12, typeRole:'microLabel', fontSize:6.8, color:C.accent, charSpace:0.7 });
    addText(slide, '先统一运行事实，再设计调度闭环。', { x:7.22, y:6.12, w:2.72, h:0.16, typeRole:'caption', fontSize:8.4, bold:true, color:'CBD5E1', fit:'shrink' });
    addEnergyFooter(slide, plan, false);
  }

  return {
    energySituationEditorial
  };
}

module.exports = {
  createEnergySituationRenderers
};
