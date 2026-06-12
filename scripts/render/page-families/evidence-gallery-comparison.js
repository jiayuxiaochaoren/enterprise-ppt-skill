const {
  createCaseComparisonPanels
} = require('./evidence-gallery-comparison-panels');
const {
  createCaseComparisonTransition
} = require('./evidence-gallery-comparison-transition');

function createCaseComparisonSlide(ctx = {}, deps = {}) {
  const {
    addText,
    galleryImages,
    resolveAssetPath
  } = ctx;
  const C = ctx.colors();
  const {
    drawFooter,
    drawLightPageHeader,
    drawMetricRow
  } = deps;
  const { drawCaseComparisonPanels } = createCaseComparisonPanels(ctx);
  const { drawCaseComparisonTransition } = createCaseComparisonTransition(ctx);

  return function caseComparisonSlide(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'CASE COMPARISON',
      title:s.title || '案例前后对比',
      titleSize:23.5,
      subtitle:s.subtitle || s.claim,
      subtitleW:6.2,
      subtitleSize:9.4,
      idx
    });

    const images = galleryImages(plan, s);
    const before = typeof s.before === 'string' ? { title:'Before', image:s.before } : (s.before || {});
    const after = typeof s.after === 'string' ? { title:'After', image:s.after } : (s.after || {});
    const beforeImg = resolveAssetPath(before.image || before.img || images[0] || '');
    const afterImg = resolveAssetPath(after.image || after.img || images[1] || '');
    const panels = [
      { label: before.label || 'BEFORE', title: before.title || '改造前', body: before.body || before.note || '问题、断点或改造前状态。', image:beforeImg, x:0.92, color:C.muted },
      { label: after.label || 'AFTER', title: after.title || '改造后', body: after.body || after.note || '动作、结果或改造后状态。', image:afterImg, x:7.02, color:C.accent }
    ];
    const [beforePanel, afterPanel] = drawCaseComparisonPanels(slide, panels);
    drawCaseComparisonTransition(slide, beforePanel, afterPanel);

    const metrics = (s.metrics || s.facts || []).slice(0,3);
    drawMetricRow(slide, metrics, { x:3.10, y:6.18, cardW:1.66, h:0.46, gap:0.38 }, {
      accentForIndex: i => i===0 ? C.accent : (i===1 ? C.cyan : C.violet)
    });
    addText(slide, s.note || '对比页把改造前后的动作、体验和复盘口径保持同构。', { x:0.94, y:6.72, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createCaseComparisonSlide
};
