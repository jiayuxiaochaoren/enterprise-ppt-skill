function createArchitectureEnergyRenderers(ctx = {}) {
  const C = ctx.colors();
  const {
    addDarkBreathingCircle,
    addLabel,
    addNumber,
    addRect,
    addText,
    footerText,
    sectionKicker,
    stageCanvas
  } = ctx;

  function energyArchitecture(slide, plan, s, idx) {
    stageCanvas(slide, { field:false });
    addDarkBreathingCircle(slide, 8.62, 0.74, 4.05, 2.22, C.violet);
    sectionKicker(slide, 'ENERGY TOPOLOGY', 0.84, 0.72, true);
    addText(slide, s.title, { x:0.82, y:1.06, w:5.8, h:0.36, fontSize:24, bold:true, color:C.white });
    if (s.subtitle) addText(slide, s.subtitle, { x:0.84, y:1.52, w:6.2, h:0.22, fontSize:10.8, color:'94A3B8' });
    addNumber(slide, String(idx).padStart(2,'0'), { x:11.76, y:0.74, w:0.58, h:0.18, fontSize:11.5, color:'64748B', align:'right' });

    const layerItems = Array.isArray(s.layers) ? s.layers.slice(0,4) : [];
    const fallback = [
      { label:'设备侧', title:'设备采集', items:['逆变器','PCS','BMS','电表'], body:'逆变器 / PCS / BMS / 电表', chips:['发电','储能','负荷'], accent:C.accent },
      { label:'数据侧', title:'统一数据底座', items:['协议适配','指标口径','历史曲线'], body:'协议适配、指标口径、历史曲线', chips:['接入','清洗','归集'], accent:C.cyan },
      { label:'调度侧', title:'告警工单与策略复盘', items:['告警分级','工单处置','SOC 策略'], body:'告警分级、派工处置、SOC 策略', chips:['告警','工单','策略'], accent:C.violet },
      { label:'管理侧', title:'区域运维驾驶舱', items:['多站点态势','收益波动','区域协同'], body:'多站点态势、收益波动、资源协同', chips:['态势','收益','协同'], accent:'94A3B8' }
    ];
    const xs = [1.08, 3.82, 6.58, 9.42];
    const ws = [2.22, 2.28, 2.38, 2.08];
    const columns = fallback.map((base,i)=>{
      const raw = layerItems[i] || {};
      const items = raw.items || base.items;
      return Object.assign({}, base, {
        label: raw.name || raw.title || base.label,
        body: items.join(' / '),
        chips: items.slice(0,3),
        x: xs[i],
        w: ws[i]
      });
    });

    addRect(slide, 0.78, 2.04, 11.48, 4.26, C.ink2, '334155', { fill:{color:C.ink2, transparency:68}, line:{color:'334155', transparency:74, width:0.36} });
    addLabel(slide, 'REAL-TIME DATA FLOW', { x:1.08, y:2.32, w:1.70, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'64748B', charSpace:1.0 });
    addLabel(slide, 'EDGE  →  DATA  →  DISPATCH  →  MANAGEMENT', { x:7.56, y:2.32, w:3.70, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'64748B', charSpace:0.85, align:'right' });

    const y=2.92, h=1.66;
    const connectorLayer = [];
    columns.forEach((c,i)=>{
      addText(slide, c.label, { x:c.x, y:y-0.29, w:1.06, h:0.16, fontSize:10.2, bold:true, color:'7C8BA3', charSpace:0.18, fit:'shrink' });
      addRect(slide, c.x, y, c.w, h, C.ink, '334155', { fill:{color:C.ink, transparency:i===0?6:18}, line:{color:c.accent, transparency:i===0?20:50, width:0.48} });
      slide.addShape('ellipse', { x:c.x+0.22, y:y+0.25, w:0.11, h:0.11, fill:{color:c.accent}, line:{color:c.accent, transparency:100} });
      addNumber(slide, String(i+1).padStart(2,'0'), { x:c.x+0.40, y:y+0.22, w:0.28, h:0.11, typeRole:'number', fontSize:7.0, color:c.accent });
      addText(slide, c.title, { x:c.x+0.74, y:y+0.17, w:c.w-0.92, h:0.18, fontSize:12.2, bold:true, color:C.white, fit:'shrink' });
      addText(slide, c.body, { x:c.x+0.22, y:y+0.64, w:c.w-0.44, h:0.22, fontSize:8.9, color:'A8B3C3', fit:'shrink' });
      c.chips.forEach((chip,j)=>{
        const chipW = (c.w-0.58) / 3;
        addRect(slide, c.x+0.22+j*(chipW+0.05), y+1.10, chipW, 0.34, C.ink2, '334155', { fill:{color:C.ink2, transparency:30}, line:{color:'334155', transparency:58, width:0.24} });
        addText(slide, chip, { x:c.x+0.22+j*(chipW+0.05), y:y+1.19, w:chipW, h:0.14, fontSize:8.8, color:'CBD5E1', align:'center', fit:'shrink', valign:'mid' });
      });
      slide.addShape('line', { x:c.x+c.w/2, y:y+h, w:0, h:0.50, line:{color:c.accent, transparency:52, width:0.32} });
      if(i<columns.length-1) connectorLayer.push({ x:c.x+c.w+0.12, y:y+0.80, w:0.38, color:c.accent });
    });
    connectorLayer.forEach(connector => {
      slide.addShape('line', {
        x:connector.x,
        y:connector.y,
        w:connector.w,
        h:0,
        line:{color:connector.color, transparency:42, width:0.42, endArrowType:'triangle'}
      });
    });
    const busY = 5.32;
    addLabel(slide, 'OPERATING DATA BUS', { x:1.08, y:5.08, w:1.48, h:0.12, typeRole:'microLabel', fontSize:6.8, color:'64748B', charSpace:0.7 });
    columns.forEach((c,i)=>{
      const accent = c.accent;
      addRect(slide, c.x, busY, c.w, 0.56, C.ink, '334155', { fill:{color:C.ink, transparency:12}, line:{color:accent, transparency:i===0?32:56, width:0.30} });
      addText(slide, ['设备数据', '历史曲线', '告警工单', '收益复盘'][i] || c.label, {
        x:c.x+0.14,
        y:busY+0.18,
        w:c.w-0.28,
        h:0.14,
        typeRole:'caption',
        fontSize:8.8,
        bold:true,
        color:'CBD5E1',
        align:'center',
        fit:'shrink'
      });
    });
    addText(slide, footerText(plan), { x:0.82, y:7.05, w:7.8, h:0.16, fontSize:7.8, color:'64748B' });
  }

  return {
    energyArchitecture
  };
}

module.exports = {
  createArchitectureEnergyRenderers
};
