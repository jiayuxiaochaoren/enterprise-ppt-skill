const { createPageFamilyPrimitives } = require('./primitives');
const {
  createProductEvidenceHero
} = require('./evidence-proof-product-hero');
const {
  createProductEvidenceProofList
} = require('./evidence-proof-product-list');

function createProductEvidenceStoryRenderer(ctx = {}) {
  const { drawFooter, drawLightPageHeader } = createPageFamilyPrimitives(ctx);
  const {
    addText,
    galleryImages,
  } = ctx;
  const C = ctx.colors();
  const { drawProductEvidenceHero } = createProductEvidenceHero(ctx);
  const { drawProductEvidenceProofList } = createProductEvidenceProofList(ctx);

  return function productEvidenceStory(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'PRODUCT EVIDENCE STORY',
      title:s.title || '产品证据故事',
      titleW:6.0,
      titleSize:23.5,
      subtitle:s.subtitle || s.claim || '产品页要同时证明质地、功效和使用场景。',
      subtitleW:7.0,
      subtitleSize:9.6,
      idx,
      pageNumber:'chrome'
    });
    const images = galleryImages(plan, s);
    const items = (s.cards || s.items || s.productStory || []).slice(0, 4);
    const hero = { x:0.92, y:2.04, w:5.44, h:4.02 };
    const lead = items[0] || { title:'明星单品', body:'产品图必须解释购买理由。' };
    drawProductEvidenceHero(slide, lead, images[0], hero);
    const proof = { x:6.86, y:2.04, w:4.72, h:4.02 };
    drawProductEvidenceProofList(slide, items, proof);
    addText(slide, s.note || '产品证据页不能只有漂亮图片，必须解释购买理由和业务作用。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createProductEvidenceStoryRenderer
};
