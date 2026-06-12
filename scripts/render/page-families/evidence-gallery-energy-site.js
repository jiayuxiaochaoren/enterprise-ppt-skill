const { createEnergySiteDispatchBridge } = require('./evidence-gallery-energy-site-dispatch');
const { createEnergySiteMetricsStrip } = require('./evidence-gallery-energy-site-metrics');
const { createEnergySiteComparisonPanels } = require('./evidence-gallery-energy-site-panels');

function createEnergySiteComparisonSlide(ctx = {}, deps = {}) {
  const { addText, galleryImages, resolveAssetPath } = ctx;
  const C = ctx.colors();
  const { drawDarkPageHeader, drawDarkStageShell, drawFooter } = deps;
  const { drawEnergySiteDispatchBridge } = createEnergySiteDispatchBridge(ctx);
  const { drawEnergySiteMetrics } = createEnergySiteMetricsStrip(ctx);
  const { drawEnergySiteComparisonPanels } = createEnergySiteComparisonPanels(ctx);

  return function energySiteComparisonSlide(slide, plan, s, idx) {
    drawDarkStageShell(slide, {
      stageOpts:{ field:false },
      breathingCircle:{ x:8.28, y:0.64, w:4.14, h:2.28, color:C.violet }
    });
    drawDarkPageHeader(slide, {
      stage:false,
      kicker:'SITE BEFORE / AFTER',
      title:s.title || '站端接入前后对比',
      titleW:6.1,
      titleSize:23.5,
      subtitle:s.subtitle || s.claim,
      subtitleY:1.50,
      subtitleW:6.3,
      subtitleSize:9.8,
      idx,
      pageNumberOpts:{ x:11.66, y:0.72, w:0.62 }
    });

    const images = galleryImages(plan, s);
    const before = typeof s.before === 'string' ? { title:'接入前', image:s.before } : (s.before || {});
    const after = typeof s.after === 'string' ? { title:'接入后', image:s.after } : (s.after || {});
    const panels = [
      { label:before.label || 'BEFORE', title:before.title || '接入前', body:before.body || before.note || '状态、告警和收益复盘分散。', image:resolveAssetPath(before.image || before.img || images[0] || ''), x:0.92, accent:'94A3B8' },
      { label:after.label || 'AFTER', title:after.title || '接入后', body:after.body || after.note || '站端状态、工单和收益口径统一。', image:resolveAssetPath(after.image || after.img || images[1] || ''), x:7.10, accent:C.accent }
    ];
    drawEnergySiteComparisonPanels(slide, panels);
    drawEnergySiteDispatchBridge(slide);

    const metrics = (s.metrics || s.facts || []).slice(0,3);
    drawEnergySiteMetrics(slide, metrics);
    addText(slide, s.note || '前后对比用于说明站端接入如何把告警、巡检和收益复盘接入同一套调度证据。', { x:0.94, y:6.62, w:8.9, h:0.13, fontSize:7.6, color:'94A3B8', fit:'shrink' });
    drawFooter(slide, plan, { color:'64748B' });
  };
}

module.exports = {
  createEnergySiteComparisonSlide
};
