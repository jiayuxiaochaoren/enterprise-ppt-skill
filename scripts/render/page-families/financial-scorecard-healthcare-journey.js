function createHealthcareJourneyRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addArrowLine,
    addLabel,
    addText
  } = ctx;

  function drawHealthcareJourneyReadout(slide, wait, satisfaction, closure, origin) {
    const flowX = origin.x;
    const flowY = origin.y;
    addLabel(slide, '患者旅程', { x:flowX, y:flowY-0.02, w:1.22, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    const journey = [
      { title:'预约', metric:wait, color:C.accent },
      { title:'到院', metric:satisfaction, color:C.cyan },
      { title:'反馈', metric:closure, color:C.violet }
    ];
    journey.forEach((j,i)=>{
      const x = flowX + i*2.12;
      slide.addShape('ellipse', { x:x, y:flowY+0.70, w:0.18, h:0.18, fill:{color:j.color}, line:{color:j.color, transparency:100} });
      if (i < journey.length - 1) addArrowLine(slide, x+0.30, flowY+0.79, 1.54, 0, j.color, { transparency:44, width:0.34 });
      addText(slide, j.title, { x:x-0.24, y:flowY+1.12, w:0.72, h:0.14, fontSize:8.6, bold:true, color:C.text, align:'center', fit:'shrink' });
      addText(slide, j.metric.value || '—', { x:x-0.34, y:flowY+1.52, w:0.92, h:0.16, fontSize:11.0, bold:true, color:j.color, align:'center', fit:'shrink' });
    });
  }

  return {
    drawHealthcareJourneyReadout
  };
}

module.exports = {
  createHealthcareJourneyRenderer
};
