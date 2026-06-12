const {
  createPageFamilyPrimitives
} = require('./primitives');
const {
  createFinancePortfolioHeroRenderer
} = require('./evidence-industry-finance-portfolio-hero');
const {
  createFinancePortfolioProofRenderer
} = require('./evidence-industry-finance-portfolio-proof');

function createFinancePortfolioEvidenceGalleryRenderer(ctx = {}, deps = {}) {
  const { drawEvidenceHeader } = deps;
  const {
    addText,
    galleryImages
  } = ctx;
  const C = ctx.colors();
  const {
    drawFooter
  } = createPageFamilyPrimitives(ctx);
  const { drawFinancePortfolioHero } = createFinancePortfolioHeroRenderer(ctx);
  const {
    drawFinancePortfolioProofSlots,
    drawFinancePortfolioReadout
  } = createFinancePortfolioProofRenderer(ctx);

  return function financePortfolioEvidenceGallery(slide, plan, s, idx) {
    drawEvidenceHeader(slide, s, idx, {
      kicker:'PORTFOLIO EVIDENCE',
      title:'组合项目证据图册',
      subtitle:'把项目材料、经营快照和投后动作放入投委会可判断的证据语法。',
      subtitleW:6.8
    });

    const images = galleryImages(plan, s);
    const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
    const hero = { x:0.92, y:2.02, w:4.96, h:3.86 };
    drawFinancePortfolioHero(slide, images, items, hero);
    drawFinancePortfolioProofSlots(slide, images, items);
    const readout = { x:6.28, y:4.26, w:5.14, h:1.62 };
    drawFinancePortfolioReadout(slide, readout);
    addText(slide, s.note || '图片材料转化为投委会判断对象，不停留在普通图册。', { x:0.94, y:6.38, w:8.9, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { color:'738297' });
  };
}

module.exports = {
  createFinancePortfolioEvidenceGalleryRenderer
};
