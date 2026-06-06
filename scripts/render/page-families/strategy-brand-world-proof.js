const {
  createBrandWorldBoardRenderer
} = require('./strategy-brand-world-board');
const {
  createBrandWorldHeroRenderer
} = require('./strategy-brand-world-hero');
const {
  createBrandWorldProofLinkRenderer
} = require('./strategy-brand-world-proof-link');
const {
  createPageFamilyPrimitives
} = require('./primitives');

function createBrandWorldBusinessProofRenderer(ctx = {}) {
  const {
    drawFooter,
    drawLightPageHeader
  } = createPageFamilyPrimitives(ctx);
  const { drawBrandWorldBoard } = createBrandWorldBoardRenderer(ctx);
  const { drawBrandWorldHero } = createBrandWorldHeroRenderer(ctx);
  const { drawBrandWorldProofLink } = createBrandWorldProofLinkRenderer(ctx);

  return function brandWorldBusinessProof(slide, plan, s, idx) {
    drawLightPageHeader(slide, {
      kicker:'BRAND WORLD / BUSINESS PROOF',
      title:s.title || '品牌世界观与经营证据',
      titleW:6.2,
      titleSize:23.5,
      subtitle:s.claim || s.subtitle || '品牌主张、产品承诺和业务证据必须在同一页相互解释。',
      subtitleW:7.1,
      subtitleSize:9.6,
      idx,
      pageNumber:'chrome'
    });
    const images = ctx.galleryImages(plan, s);
    const metrics = (s.metrics || []).slice(0, 3);
    const drivers = (s.drivers && s.drivers.length ? s.drivers : [
      { title: metrics[0] ? `${metrics[0].value} ${metrics[0].label || ''}`.trim() : 'Global footprint' },
      { title: 'Global prestige footprint' },
      { title: 'Hero franchise memory' }
    ]).slice(0, 3);
    const actions = (s.actions && s.actions.length ? s.actions : [
      { title: 'Use ULTIMUNE as spine' },
      { title: 'Connect SKU proof' },
      { title: 'Source-bound story' }
    ]).slice(0, 3);
    const outcomes = (s.outcomes && s.outcomes.length ? s.outcomes : [
      { title: 'Operating priority' },
      { title: 'Measurement system' },
      { title: 'Regional growth review' }
    ]).slice(0, 3);
    const hero = { x:0.92, y:2.04, w:4.72, h:4.02 };
    drawBrandWorldHero(slide, hero, s, drivers, images[0]);

    const board = { x:6.18, y:2.04, w:5.26, h:4.02 };
    drawBrandWorldBoard(slide, board, { drivers, actions, outcomes });
    drawBrandWorldProofLink(slide, s, metrics);
    drawFooter(slide, plan);
  };
}

module.exports = {
  createBrandWorldBusinessProofRenderer
};
