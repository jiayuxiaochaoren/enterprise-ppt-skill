const family = 'manifesto';

const types = ['manifesto'];

function createManifestoRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    addDarkBreathingCircle,
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText,
    footerText,
    itemBody,
    itemTitle,
    lightCanvas,
    panelFill,
    sectionKicker,
    stageCanvas,
    variantOf
  } = ctx;

  function manifestoSlide(slide, plan, s, idx) {
    const manifestoVariant = variantOf(s, '');
    if (manifestoVariant === 'culture-cover-with-soft-geometry') return cultureCoverSoftGeometry(slide, plan, s, idx);
    if (manifestoVariant === 'mission-statement-stage') return missionStatementStage(slide, plan, s, idx);
    if (manifestoVariant === 'value-principle-cards') return valuePrincipleCards(slide, plan, s, idx);
    stageCanvas(slide, { field:true });
    addLabel(slide, 'CULTURE MANIFESTO', { x:0.84, y:0.92, w:1.80, h:0.13, fontSize:6.8, color:C.cyan, charSpace:1.1 });
    addText(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.76, w:0.72, h:0.22, fontSize:13, bold:true, color:C.accent, align:'right' });
    const statement = s.statement || s.title || '共识不是口号，而是持续行动的方式';
    addText(slide, statement, { x:0.82, y:1.72, w:6.88, h:0.92, fontSize:30, bold:true, color:C.white, fit:'shrink', breakLine:true });
    addText(slide, s.claim || s.subtitle || s.intro || '', { x:0.86, y:3.02, w:5.80, h:0.25, fontSize:11.0, color:'CBD5E1', fit:'shrink' });
    addHairline(slide, 0.88, 3.54, 0.86, C.accent, 0, 0.75);
    const values = (s.values || s.items || []).slice(0,4);
    values.forEach((v,i)=>{
      const x = 0.92 + i*2.78;
      const title = typeof v === 'string' ? v : (v.title || v.label || '');
      const body = typeof v === 'string' ? '' : (v.body || v.note || '');
      addRect(slide, x, 4.66, 2.30, 1.10, C.ink2, '334155', { fill:{color:C.ink2, transparency:34}, line:{color:i===0?C.accent:'334155', transparency:i===0?24:58, width:0.45} });
      addText(slide, String(i+1).padStart(2,'0'), { x:x+0.24, y:4.92, w:0.32, h:0.12, fontSize:7.0, bold:true, color:i===0?C.accent:C.cyan });
      addText(slide, title, { x:x+0.24, y:5.20, w:1.48, h:0.16, fontSize:10.8, bold:true, color:C.white, fit:'shrink' });
      if (body) addText(slide, body, { x:x+0.24, y:5.52, w:1.68, h:0.14, fontSize:6.7, color:'A8B3C3', fit:'shrink' });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function cultureCoverSoftGeometry(slide, plan, s, idx) {
    stageCanvas(slide, { field:true });
    addDarkBreathingCircle(slide, 8.66, 0.34, 4.12, 2.34, C.accent);
    addLabel(slide, 'CULTURE COVER', { x:0.86, y:0.88, w:1.42, h:0.13, fontSize:7.0, color:C.cyan, charSpace:1.0 });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.74, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
    addText(slide, s.statement || s.title || '文化不是口号，而是团队交付方式', {
      x:0.84, y:1.56, w:6.48, h:0.96, fontSize:31.0, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    addText(slide, s.claim || s.subtitle || '用组织场景、行为原则和产出证据说明文化如何发生。', {
      x:0.88, y:2.88, w:5.70, h:0.22, fontSize:10.4, color:C.captionOnImage, fit:'shrink'
    });
    addHairline(slide, 0.90, 3.42, 0.90, C.accent, 0, 0.72);
    const soft = [
      { x:7.72, y:2.00, w:2.62, h:1.18, color:C.accent, title:'行为', body:'能被观察' },
      { x:8.94, y:3.42, w:2.40, h:1.08, color:C.cyan, title:'场景', body:'能被复盘' },
      { x:6.82, y:4.44, w:2.36, h:1.04, color:C.violet, title:'产出', body:'能被证明' }
    ];
    soft.forEach((box, i) => {
      addRect(slide, box.x, box.y, box.w, box.h, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:24 + i * 8},
        line:{color:box.color, transparency:38, width:0.42}
      });
      addText(slide, box.title, { x:box.x+0.28, y:box.y+0.34, w:0.72, h:0.14, fontSize:9.6, bold:true, color:C.white, fit:'shrink' });
      addText(slide, box.body, { x:box.x+1.32, y:box.y+0.36, w:0.76, h:0.12, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink', align:'right' });
    });
    const values = (s.values || s.items || []).slice(0, 3);
    values.forEach((v, i) => {
      const y = 4.52 + i * 0.46;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : C.violet);
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:0.92, y:y+0.02, w:0.30, h:0.09, fontSize:6.2, color:accent });
      addText(slide, itemTitle(v, `原则 ${i + 1}`), { x:1.36, y:y, w:1.24, h:0.13, fontSize:8.7, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(v), { x:2.98, y:y, w:3.00, h:0.12, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function missionStatementStage(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    addLabel(slide, 'MISSION STAGE', { x:0.86, y:0.90, w:1.50, h:0.13, fontSize:7.0, color:C.cyan, charSpace:1.0 });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.74, w:0.62, h:0.18, fontSize:11.5, color:C.accent, align:'right' });
    addText(slide, s.statement || s.title || '使命必须被行为证明', {
      x:0.82, y:1.42, w:7.10, h:1.10, fontSize:34.0, bold:true, color:C.white, fit:'shrink', breakLine:true
    });
    addText(slide, s.claim || s.subtitle || '使命页必须用行为原则和证据支撑。', { x:0.86, y:2.82, w:5.60, h:0.20, fontSize:10.0, color:C.captionOnImage, fit:'shrink' });
    addRect(slide, 0.88, 3.30, 0.94, 0.05, C.accent, C.accent);
    addRect(slide, 1.96, 3.30, 0.34, 0.05, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:38}, line:{color:C.cyan, transparency:100} });

    const values = (s.values || s.items || []).slice(0, 4);
    const board = { x:0.92, y:4.24, w:10.54, h:1.42 };
    values.forEach((v, i) => {
      const x = board.x + i * 2.58;
      const accent = i === 0 ? C.accent : (i === 1 ? C.cyan : (i === 2 ? C.violet : '94A3B8'));
      addRect(slide, x, board.y, 2.18, board.h, C.ink2, '334155', {
        fill:{color:C.ink2, transparency:i === 0 ? 18 : 38},
        line:{color:i === 0 ? accent : '334155', transparency:i === 0 ? 22 : 58, width:0.42}
      });
      addNumber(slide, String(i + 1).padStart(2, '0'), { x:x+0.22, y:board.y+0.32, w:0.28, h:0.09, fontSize:6.2, color:accent });
      addText(slide, itemTitle(v, `行为 ${i + 1}`), { x:x+0.60, y:board.y+0.25, w:1.08, h:0.14, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, itemBody(v), { x:x+0.24, y:board.y+0.78, w:1.56, h:0.18, fontSize:7.0, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    });
    addRect(slide, 0.92, 6.18, 8.72, 0.34, C.ink2, '334155', { fill:{color:C.ink2, transparency:28}, line:{color:'334155', transparency:68, width:0.30} });
    addLabel(slide, 'PROOF REQUIRED', { x:1.14, y:6.28, w:1.22, h:0.09, fontSize:5.4, color:C.accent, charSpace:0.7 });
    addText(slide, s.note || '使命必须落到行为、角色和产出证据。', { x:2.62, y:6.26, w:6.34, h:0.11, fontSize:7.4, color:C.darkMuted || 'A8B3C3', fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  function valuePrincipleCards(slide, plan, s, idx) {
    lightCanvas(slide);
    sectionKicker(slide, 'VALUE PRINCIPLE CARDS', 0.86, 0.72, false);
    addText(slide, s.title || '价值观卡片必须写出可观察行为', { x:0.84, y:1.05, w:6.20, h:0.35, fontSize:24, bold:true, color:C.text, fit:'shrink' });
    addText(slide, s.claim || s.subtitle || '每张卡片都包含原则、行为和证明材料。', { x:0.86, y:1.52, w:6.70, h:0.20, fontSize:10.0, color:C.muted, fit:'shrink' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.70, y:0.66, w:0.72, h:0.22, fontSize:13, color:C.accent, align:'right' });
    const values = (s.values || s.items || []).slice(0, 4);
    const slots = [
      { x:0.92, y:2.18, color:C.accent },
      { x:6.24, y:2.18, color:C.cyan },
      { x:0.92, y:4.32, color:C.violet },
      { x:6.24, y:4.32, color:C.muted }
    ];
    slots.forEach((slot, i) => {
      const v = values[i] || {};
      addRect(slide, slot.x, slot.y, 4.86, 1.62, panelFill(), i === 0 ? slot.color : C.line, {
        fill:{color:panelFill(), transparency:0},
        line:{color:i === 0 ? slot.color : C.line, transparency:i === 0 ? 18 : 16, width:0.44}
      });
      addRect(slide, slot.x, slot.y, 0.08, 1.62, slot.color, slot.color, { line:{color:slot.color, transparency:100} });
      addLabel(slide, `PRINCIPLE ${String(i + 1).padStart(2, '0')}`, { x:slot.x+0.28, y:slot.y+0.28, w:1.16, h:0.09, fontSize:5.6, color:slot.color, charSpace:0.7 });
      addText(slide, itemTitle(v, `原则 ${i + 1}`), { x:slot.x+0.28, y:slot.y+0.66, w:1.48, h:0.15, fontSize:9.8, bold:true, color:C.text, fit:'shrink' });
      addText(slide, itemBody(v), { x:slot.x+2.20, y:slot.y+0.48, w:2.08, h:0.26, fontSize:8.0, color:C.body, fit:'shrink', breakLine:true });
      addLabel(slide, 'OBSERVABLE BEHAVIOR', { x:slot.x+0.28, y:slot.y+1.20, w:1.44, h:0.09, fontSize:5.3, color:C.muted, charSpace:0.55 });
    });
    addText(slide, s.note || '价值观卡片没有行为证据时不能通过。', { x:0.94, y:6.48, w:7.40, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:C.muted });
  }

  return {
    manifestoSlide
  };
}

function entries(renderers = {}) {
  return [
    { types, render:renderers.manifestoSlide, source:`page-family:${family}` }
  ];
}

module.exports = {
  family,
  types,
  createManifestoRenderers,
  entries
};
