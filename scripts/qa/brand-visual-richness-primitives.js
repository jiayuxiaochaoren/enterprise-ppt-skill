const BRAND_VISUAL_COMPONENTS = Object.freeze([
  'proof-gallery',
  'product-matrix',
  'caption-bar',
  'hero-image',
  'value-chain',
  'kpi-strip'
]);

const PRODUCT_MATRIX_TEXT = /sku|单品|明星单品|质地|功效|efficacy|texture|pack/i;
const BRAND_SCENE_TEXT = /brand|品牌|consumer|消费者|lookbook|photo|gallery|proof|证据|门店|柜台|会员|复购/i;

function flattenText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenText).join(' ');
  return '';
}

function arrayOf(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function directImageRefs(plan = {}, slide = {}) {
  const visual = slide.visual || {};
  const type = String(slide.type || '');
  const variant = String(slide.layoutVariant || slide.variant || slide.proofObject || '');
  const refs = [
    slide.image,
    visual.image,
    ...arrayOf(slide.images),
    ...arrayOf(visual.images)
  ].filter(Boolean);
  const galleryFallback = ['case-gallery', 'gallery', 'portfolio', 'product-showcase', 'strategy-map'].includes(type) ||
    /brand-world|proof|lookbook|mosaic|product-evidence|consumer-photo/i.test(variant);
  if (!refs.length && galleryFallback && plan.media && plan.media.gallery) refs.push(...arrayOf(plan.media.gallery));
  if (!refs.length && plan.media && ['cover', 'cover-dark'].includes(type)) {
    refs.push(...arrayOf(plan.media.cover));
  }
  return refs.filter(Boolean);
}

function captionRefs(slide = {}) {
  const visual = slide.visual || {};
  const proof = slide.proof || {};
  const refs = [
    slide.caption,
    slide.sourceNote,
    slide.source_note,
    visual.caption,
    proof.explanation,
    proof.sourceNote,
    slide.note
  ];
  ['cards', 'items', 'productStory', 'products', 'lookbook', 'drivers', 'actions', 'outcomes', 'metrics'].forEach(field => {
    if (!Array.isArray(slide[field])) return;
    slide[field].forEach(item => {
      if (typeof item === 'string') refs.push(item);
      else if (item) refs.push(item.caption, item.body, item.note, item.description, item.scene, item.claim, item.efficacy, item.businessMeaning);
    });
  });
  return refs.filter(value => String(value || '').trim());
}

function expectedComponentsForSlide(plan = {}, slide = {}) {
  const text = flattenText({
    industry: plan.industry,
    documentType: plan.documentType,
    type: slide.type,
    layoutVariant: slide.layoutVariant || slide.variant,
    proofObject: slide.proofObject || slide.proof_object || (slide.proof && slide.proof.id),
    title: slide.title,
    subtitle: slide.subtitle,
    claim: slide.claim,
    cards: slide.cards,
    items: slide.items,
    productStory: slide.productStory,
    products: slide.products
  });
  const images = directImageRefs(plan, slide);
  const expected = new Set();
  const type = String(slide.type || '');
  const variant = String(slide.layoutVariant || slide.variant || '');
  const bodyVisualEligible = !['cover', 'cover-dark', 'toc', 'toc-clean', 'closing', 'closing-dark', 'chapter-divider', 'timeline', 'timeline-dark', 'risk-table', 'table'].includes(type);
  const heroEligible = !['toc', 'toc-clean', 'closing', 'closing-dark', 'chapter-divider'].includes(type);
  const brandWorldStrategySignal = type === 'strategy-map' && /brand-world|brand-world-and-business/i.test(variant);
  const explicitGalleryRoute = ['case-gallery', 'gallery', 'portfolio'].includes(type) ||
    (!brandWorldStrategySignal && /gallery|photo|lookbook|mosaic/i.test(variant));
  const productStory = Array.isArray(slide.productStory) && slide.productStory.length;
  const imageBackedGallery = images.length > 0;
  const productStoryGallery = productStory && (imageBackedGallery || /product-evidence|product-showcase|gallery|photo|lookbook/i.test(`${variant} ${type}`));
  const brandSceneGallery = imageBackedGallery && BRAND_SCENE_TEXT.test(text);
  const galleryLike = explicitGalleryRoute ||
    imageBackedGallery ||
    productStoryGallery ||
    brandSceneGallery ||
    (!brandWorldStrategySignal && /proof/i.test(variant) && imageBackedGallery);
  if (bodyVisualEligible && galleryLike && !brandWorldStrategySignal) {
    expected.add('proof-gallery');
    expected.add('caption-bar');
  }
  if (bodyVisualEligible && brandWorldStrategySignal) expected.add('caption-bar');
  if (heroEligible && (images.length || explicitGalleryRoute || ['cover', 'cover-dark'].includes(type) || /hero|cover|brand-world|image/i.test(text))) {
    expected.add('hero-image');
  }
  const productFields = Array.isArray(slide.products) && slide.products.length;
  const explicitProductVariant = /product-evidence|product-showcase/i.test(String(slide.layoutVariant || slide.variant || slide.type || ''));
  if (bodyVisualEligible && (productFields || productStory || explicitProductVariant || PRODUCT_MATRIX_TEXT.test(text))) {
    expected.add('product-matrix');
  }
  if (bodyVisualEligible && (slide.type === 'strategy-map' || /brand-world-and-business|value-creation|value-chain|品牌世界观/i.test(text) || slide.valueChain || slide.drivers || slide.outcomes)) {
    expected.add('value-chain');
  }
  return [...expected];
}

function hasProductMatrixData(slide = {}) {
  if (Array.isArray(slide.products) && slide.products.length) return true;
  if (Array.isArray(slide.productStory) && slide.productStory.length) return true;
  return /product-evidence|product-showcase/i.test(String(slide.layoutVariant || slide.variant || slide.type || ''));
}

function plannedIdsForSlide(slide = {}) {
  const plan = slide.componentPlan || {};
  if (Array.isArray(plan.componentIds)) return plan.componentIds.slice();
  if (Array.isArray(plan.components)) {
    return plan.components.map(component => typeof component === 'string' ? component : component.id).filter(Boolean);
  }
  return [];
}

function renderedSlideFor(renderMeta = null, slideNumber = 1) {
  if (!renderMeta || !Array.isArray(renderMeta.slides)) return null;
  return renderMeta.slides.find(slide => Number(slide.slide) === Number(slideNumber)) || renderMeta.slides[slideNumber - 1] || null;
}

function consumedIdsForSlide(rendered = null) {
  if (!rendered || !Array.isArray(rendered.consumedComponents)) return [];
  return rendered.consumedComponents.filter(component => component && component.rendered).map(component => component.id).filter(Boolean);
}

function consumedComponent(rendered = null, id = '') {
  if (!rendered || !Array.isArray(rendered.consumedComponents)) return null;
  return rendered.consumedComponents.find(component => component && component.id === id && component.rendered) || null;
}

function meaningfulDrawnCount(component = null) {
  if (!component) return 0;
  return Number(component.drawnCount || component.itemCount || 0);
}

module.exports = {
  BRAND_VISUAL_COMPONENTS,
  captionRefs,
  consumedComponent,
  consumedIdsForSlide,
  directImageRefs,
  expectedComponentsForSlide,
  hasProductMatrixData,
  meaningfulDrawnCount,
  plannedIdsForSlide,
  renderedSlideFor
};
