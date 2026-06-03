const {
  createConsumerProofPhotoGridRenderer
} = require('./evidence-brand-consumer-grid');
const {
  createRetailLookbookPanels
} = require('./evidence-brand-lookbook-panels');

function createRetailLookbookStory(ctx = {}, deps = {}) {
  const {
    variantOf
  } = ctx;
  const {
    drawBrandStoryHeader,
    drawFooter
  } = deps;
  const {
    drawLookbookStory
  } = createRetailLookbookPanels(ctx);
  const consumerProofPhotoGrid = createConsumerProofPhotoGridRenderer(ctx, {
    drawBrandStoryHeader,
    drawFooter
  });

  return function retailLookbookStory(slide, plan, s, idx) {
    const variant = variantOf(s, 'lookbook-story');
    if (variant === 'consumer-proof-photo-grid') {
      return consumerProofPhotoGrid(slide, plan, s, idx);
    }
    drawBrandStoryHeader(slide, s, idx, {
      kicker:'LOOKBOOK STORY',
      title:'产品故事与门店场景',
      titleW:5.9,
      subtitle:'把产品、空间、搭配和会员触达组织成一组可阅读的品牌故事。',
      subtitleW:6.4,
      subtitleSize:9.4
    });

    drawLookbookStory(slide, plan, s);
    drawFooter(slide, plan, { color:'738297' });
  };
}

module.exports = {
  createRetailLookbookStory
};
