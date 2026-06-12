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

  function productEvidenceItems(s = {}) {
    return [
      s.products,
      s.productStory,
      s.cards,
      s.items
    ].find(value => Array.isArray(value) && value.length) || [];
  }

  return function productEvidenceStory(slide, plan, s, idx) {
    const header = drawLightPageHeader(slide, {
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
    const contentY = Math.max(2.50, Number(header && header.contentTop) || 2.50);
    const contentH = Math.max(3.20, 6.10 - contentY);
    const images = galleryImages(plan, s);
    const items = productEvidenceItems(s).slice(0, 4);
    const hero = { x:0.92, y:contentY, w:5.44, h:contentH };
    const lead = items[0] || { title:'明星单品', body:'产品图必须解释购买理由。' };
    drawProductEvidenceHero(slide, lead, images[0], hero);
    const proof = { x:6.86, y:contentY, w:4.72, h:contentH };
    drawProductEvidenceProofList(slide, items, proof);
    addText(slide, s.note || '产品证据页不能只有漂亮图片，必须解释购买理由和业务作用。', { x:0.94, y:6.42, w:8.8, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createProductEvidenceStoryRenderer
};
