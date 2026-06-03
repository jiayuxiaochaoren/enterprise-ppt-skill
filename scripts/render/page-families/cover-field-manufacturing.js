function createManufacturingCoverField(ctx = {}, opts = {}) {
  const colors = opts.colors || (() => ctx.colors());

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
      fill:{ color:C.ink2, transparency:34 },
      line:{ color:'334155', transparency:68, width:0.38 }
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
        fill:{ color:C.ink, transparency:i === 0 ? 6 : 22 },
        line:{ color:st.color, transparency:i === 0 ? 18 : 48, width:0.38 }
      });
      ctx.addText(slide, st.label, { x:st.x+0.08, y:st.y+0.14, w:0.48, h:0.08, fontSize:5.8, bold:true, color:i === 0 ? C.white : 'A8B3C3', align:'center', fit:'shrink' });
      if (i < stations.length - 1) ctx.addArrowLine(slide, st.x+0.72, st.y+0.20, 0.32, 0, st.color, { transparency:44, width:0.34 });
    });

    proofRows.slice(0, 3).forEach((row, i) => {
      const y = panel.y + 3.10 + i * 0.42;
      const dot = [C.cyan, C.violet, '94A3B8'][i] || C.cyan;
      slide.addShape('ellipse', { x:panel.x+0.42, y:y+0.04, w:0.08, h:0.08, fill:{ color:dot }, line:{ color:dot, transparency:100 } });
      ctx.addText(slide, row.label || row.title || `事实 ${i + 1}`, { x:panel.x+0.64, y, w:1.26, h:0.12, fontSize:7.2, color:'A8B3C3', fit:'shrink' });
      ctx.addText(slide, row.value || '—', { x:panel.x+3.10, y:y-0.02, w:1.02, h:0.12, fontSize:8.4, bold:true, color:C.white, align:'right', fit:'shrink' });
      ctx.addHairline(slide, panel.x+2.02, y+0.19, 1.16, '334155', 56, 0.30);
    });
  }

  return {
    drawManufacturingCoverField
  };
}

module.exports = {
  createManufacturingCoverField
};
