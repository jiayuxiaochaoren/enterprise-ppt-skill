function createEnergySiteMetricsStrip(ctx = {}) {
  const {
    addText
  } = ctx;
  const C = ctx.colors();

  function drawEnergySiteMetrics(slide, metrics) {
    const metricStart = 2.38;
    metrics.forEach((m,i)=>{
      const x = metricStart + i*2.18;
      const accent = i===0 ? C.accent : (i===1 ? C.cyan : C.violet);
      addText(slide, m.value || m.title || String(i+1), {
        x, y:6.10, w:0.76, h:0.16, fontSize:12.4, bold:true, color:accent, fit:'shrink'
      });
      addText(slide, m.label || m.body || '', {
        x:x+0.96, y:6.12, w:0.88, h:0.12, fontSize:7.8, color:'CBD5E1', fit:'shrink'
      });
    });
  }

  return {
    drawEnergySiteMetrics
  };
}

module.exports = {
  createEnergySiteMetricsStrip
};
