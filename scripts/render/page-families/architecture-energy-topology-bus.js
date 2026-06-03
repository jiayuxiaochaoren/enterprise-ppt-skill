function createEnergyTopologyBusRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawOperatingDataBus(slide, columns) {
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
  }

  return {
    drawOperatingDataBus
  };
}

module.exports = {
  createEnergyTopologyBusRenderer
};
