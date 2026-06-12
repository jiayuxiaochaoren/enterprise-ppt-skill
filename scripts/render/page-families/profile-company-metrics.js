function createCompanyProfileMetrics(ctx = {}) {
  const C = ctx.colors();
  const {
    MetricStrip,
    addRect,
    addText,
    panelFill
  } = ctx;

  function drawCompanyProfileMetrics(slide, s) {
    const metrics = (s.metrics || []).slice(0, 4);
    MetricStrip(slide, metrics, 0.86, 5.90, 10.84, { h:0.74 });
    if (!metrics.length) {
      addRect(slide, 0.86, 5.88, 4.84, 0.42, panelFill(), C.line, { fill:{color:panelFill(), transparency:0}, line:{color:C.line, transparency:16, width:0.38} });
      addText(slide, '补充始建年份、厂区规模、车间面积、核心设备等可核验事实后，可形成更完整的外发公司页。', {
        x:1.08, y:6.02, w:4.20, h:0.10, fontSize:6.8, color:C.muted, fit:'shrink'
      });
    }
  }

  return {
    drawCompanyProfileMetrics
  };
}

module.exports = {
  createCompanyProfileMetrics
};
