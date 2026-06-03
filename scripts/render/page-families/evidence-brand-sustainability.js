const {
  createSustainabilityProofPanels
} = require('./evidence-brand-sustainability-panels');

function createSustainabilityProofSpread(ctx = {}, opts = {}) {
  const drawBrandStoryHeader = opts.drawBrandStoryHeader || (() => {});
  const drawFooter = opts.drawFooter || (() => {});
  const {
    drawImageEvidenceSpread,
    drawMetricsReadout
  } = createSustainabilityProofPanels(ctx);

  return function sustainabilityProofSpread(slide, plan, s, idx) {
    drawBrandStoryHeader(slide, s, idx, {
      kicker:'SUSTAINABILITY PROOF SPREAD',
      title:'可持续证据展开页',
      titleW:6.1,
      subtitle:'证据图像、影响指标、项目说明和来源必须成对出现。',
      subtitleW:7.2,
      pageNumber:'chrome'
    });
    const metrics = (s.metrics || []).slice(0, 3);
    if (metrics.length >= 2) {
      drawMetricsReadout(slide, s, metrics);
      drawFooter(slide, plan);
      return;
    }
    drawImageEvidenceSpread(slide, plan, s);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createSustainabilityProofSpread
};
