const {
  createConsumerProofInsightPanel
} = require('./evidence-brand-consumer-insight');
const {
  createConsumerProofSlots
} = require('./evidence-brand-consumer-slots');

function createConsumerProofPhotoGridRenderer(ctx = {}, deps = {}) {
  const {
    galleryImages,
  } = ctx;
  const C = ctx.colors();
  const {
    drawBrandStoryHeader,
    drawFooter
  } = deps;
  const { drawConsumerProofInsight } = createConsumerProofInsightPanel(ctx);
  const { drawConsumerProofSlots } = createConsumerProofSlots(ctx);

  return function consumerProofPhotoGrid(slide, plan, s, idx) {
    drawBrandStoryHeader(slide, s, idx, {
      kicker:'CONSUMER PROOF GRID',
      title:'消费者场景证据',
      titleW:5.9,
      subtitle:'把柜台、内容触点和会员反馈放进同一组证据栅格。',
      subtitleW:6.6,
      subtitleSize:9.4
    });

    const images = galleryImages(plan, s);
    const items = (s.lookbook || s.productStory || s.cards || s.items || []).slice(0,4).map(v => typeof v === 'string' ? { title:v } : v);
    const insight = { x:0.92, y:2.06, w:3.20, h:3.86 };
    drawConsumerProofInsight(slide, s, insight);
    const slots = [
      { x:4.58, y:2.06, w:2.08, h:3.86, color:C.accent, label:'触点' },
      { x:6.96, y:2.06, w:2.08, h:3.86, color:C.cyan, label:'理由' },
      { x:9.34, y:2.06, w:2.08, h:3.86, color:C.violet, label:'复购' }
    ];
    drawConsumerProofSlots(slide, items, images, slots);
    drawFooter(slide, plan, { color:'738297' });
  };
}

module.exports = {
  createConsumerProofPhotoGridRenderer
};
