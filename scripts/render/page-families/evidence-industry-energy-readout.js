function createEnergySiteReadoutRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addNumber,
    addRect,
    addText
  } = ctx;

  function drawEnergySiteReadout(slide, readout) {
    addRect(slide, readout.x, readout.y, readout.w, readout.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, 'ASSET READOUT', { x:readout.x+0.26, y:readout.y+0.28, w:1.24, h:0.10, fontSize:5.8, color:C.accent, charSpace:0.8 });
    [
      ['01', '站端资产', '可见边界'],
      ['02', '设备状态', '可查对象'],
      ['03', '区域调度', '可复盘动作']
    ].forEach((row,i)=>{
      const y = readout.y + 0.78 + i*0.48;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addNumber(slide, row[0], { x:readout.x+0.28, y:y+0.02, w:0.28, h:0.10, typeRole:'number', fontSize:7.0, color:accent });
      addText(slide, row[1], { x:readout.x+0.78, y:y, w:0.88, h:0.13, fontSize:8.8, bold:true, color:C.white, fit:'shrink' });
      addText(slide, row[2], { x:readout.x+2.20, y:y, w:0.90, h:0.12, fontSize:7.4, color:'A8B3C3', fit:'shrink', align:'right' });
      addHairline(slide, readout.x+0.28, y+0.28, 3.02, '334155', 44, 0.30);
    });
  }

  return {
    drawEnergySiteReadout
  };
}

module.exports = {
  createEnergySiteReadoutRenderer
};
