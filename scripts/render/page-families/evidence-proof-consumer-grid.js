const { createPageFamilyPrimitives } = require('./primitives');
const {
  consumerProofGridSlots,
  createConsumerProofGridSlotRenderer
} = require('./evidence-proof-consumer-grid-slots');

function createConsumerProofPhotoGridRenderer(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    addText,
    galleryImages,
  } = ctx;
  const C = ctx.colors();
  const { drawConsumerProofGridSlot } = createConsumerProofGridSlotRenderer(ctx);

  return function consumerProofPhotoGrid(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'CONSUMER PROOF PHOTO GRID',
      title:s.title || '消费者场景证据',
      titleW:6.1,
      titleSize:23.5,
      subtitle:s.subtitle || s.claim || '每个场景都需要一句 caption 说明它证明什么。',
      subtitleW:7.0,
      subtitleSize:9.6,
      idx,
      pageNumber:'chrome'
    });
    const images = galleryImages(plan, s);
    const items = (s.cards || s.items || s.lookbook || []).slice(0, 4);
    const slots = consumerProofGridSlots(C);
    slots.forEach((slot, i) => {
      const item = items[i] || {};
      const slotImage = images[i] || images[0];
      drawConsumerProofGridSlot(slide, slot, item, slotImage, i);
    });
    addText(slide, s.note || '消费者图像必须绑定场景、理由、购买或复购信号。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createConsumerProofPhotoGridRenderer
};
