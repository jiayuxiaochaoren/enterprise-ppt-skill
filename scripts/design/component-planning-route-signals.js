function hasExplicitRiskMatrixData(s = {}) {
  if (s.riskMatrix || s.risk_matrix || s.controlsMatrix || s.controls_matrix) return true;
  const matrix = s.matrix;
  if (!matrix) return false;
  if (matrix === true) return true;
  if (Array.isArray(matrix)) return matrix.length > 0;
  if (typeof matrix !== 'object') return Boolean(matrix);
  return ['items', 'points', 'cells', 'quadrants', 'rows', 'data', 'risks']
    .some(field => Array.isArray(matrix[field]) && matrix[field].length);
}

function directImageCountForSlide(s = {}) {
  const visual = s.visual || {};
  return (s.image || visual.image ? 1 : 0) +
    (Array.isArray(s.images) ? s.images.length : 0) +
    (Array.isArray(visual.images) ? visual.images.length : 0);
}

function componentRouteSignalSummary({ s = {}, type = '', variant = '', proofObject = '', proofObjectForVisualRules = '', signals = {}, slideRouteText = '' } = {}) {
  const directImageCount = directImageCountForSlide(s);
  const galleryEligible = !['cover', 'cover-dark', 'closing', 'closing-dark', 'chapter-divider', 'toc', 'toc-clean'].includes(type);
  const brandWorldStrategySignal = type === 'strategy-map' && /brand-world|brand-world-and-business/i.test(`${variant} ${proofObject}`);
  const brandConsumerSceneSignal = /brand|consumer|retail|beauty|lookbook|shopper|store|柜台|门店|陳列|陈列|消费者|消費者|会员|會員|复购|復購|种草|品牌故事|产品故事/i.test(slideRouteText);
  const productStorySignal = Array.isArray(s.productStory) && s.productStory.length;
  const explicitProductMatrixTextSignal = /SKU|核心单品|明星单品|單品|单品|質地|质地|功效|efficacy|texture/i.test([s.title, s.subtitle, s.claim, proofObject].filter(Boolean).join(' '));
  const productShowcaseHasEvidence = type === 'product-showcase' && (directImageCount > 0 || productStorySignal || (Array.isArray(s.products) && s.products.length) || explicitProductMatrixTextSignal);
  const productProofSignal =
    Boolean(s.product || (Array.isArray(s.products) && s.products.length) || productStorySignal) ||
    productShowcaseHasEvidence ||
    /sku|product-evidence|product-showcase|texture|efficacy|单品|質地|质地|功效/i.test(proofObject) ||
    explicitProductMatrixTextSignal;
  const explicitGalleryRouteSignal = ['case-gallery', 'gallery', 'portfolio'].includes(type) ||
    (!brandWorldStrategySignal && /gallery|photo|lookbook|mosaic/i.test(`${variant} ${proofObject}`));
  const imageBackedGallerySignal = signals.imageCount >= 2 || directImageCount > 0;
  const productStoryGallerySignal = productStorySignal && (imageBackedGallerySignal || /product-evidence|product-showcase|gallery|photo|lookbook/i.test(`${variant} ${proofObject} ${type}`));
  const brandSceneGallerySignal = brandConsumerSceneSignal && imageBackedGallerySignal;
  const activeBrandWorldHero = /brand-world/i.test(proofObjectForVisualRules) && /brand-world/i.test(variant);
  const proofObjectVisualAnchor = activeBrandWorldHero || /hero|cover|(?:^|[-_])product(?:$|[-_])|image/i.test(proofObjectForVisualRules);
  const heroImageRouteEligible = ['cover', 'cover-dark', 'case-gallery', 'gallery', 'portfolio', 'product-showcase', 'company-profile-spread'].includes(type) ||
    proofObjectVisualAnchor ||
    /hero|cover|brand|showcase|lookbook|gallery|photo|image/i.test(variant);
  return {
    activeBrandWorldHero,
    brandSceneGallerySignal,
    brandWorldStrategySignal,
    directImageCount,
    explicitGalleryRouteSignal,
    galleryEligible,
    heroImageRouteEligible,
    imageBackedGallerySignal,
    productProofSignal,
    productShowcaseHasEvidence,
    productStoryGallerySignal,
    productStorySignal,
    proofObjectVisualAnchor
  };
}

module.exports = {
  componentRouteSignalSummary,
  directImageCountForSlide,
  hasExplicitRiskMatrixData
};
