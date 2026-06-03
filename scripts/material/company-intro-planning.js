const {
  slideContentOverlap
} = require('../design-system');
const {
  claimVisibleText,
  externalUseCaveatText,
  factText,
  textItems
} = require('./claim-slide-fields');

function shouldSuppressCompanyIntroClaim(claim = {}) {
  const proof = String(claim.proof_object || '').toLowerCase();
  const role = String(claim.narrative_role || '').toLowerCase();
  const text = claimVisibleText(claim);
  if (role === 'governance' || proof.includes('risk') || proof.includes('responsibility')) {
    return externalUseCaveatText(text);
  }
  if (role === 'decision') return true;
  return false;
}

function hasUsableCustomerCase(extraction = {}) {
  const text = [
    ...(extraction.facts || []).map(v => factText(v)),
    ...(extraction.evidence || []).map(v => factText(v)),
    ...(extraction.claim_spine || []).map(v => claimVisibleText(v))
  ].join(' ');
  return /客户|案例|项目|交付|业绩/.test(text) && !externalUseCaveatText(text);
}

function hasUsableCertificate(extraction = {}) {
  const text = [
    ...(extraction.facts || []).map(v => factText(v)),
    ...(extraction.evidence || []).map(v => factText(v)),
    ...(extraction.claim_spine || []).map(v => claimVisibleText(v))
  ].join(' ');
  return /资质|证书|认证|专利|荣誉|高新|专精特新/.test(text) && !externalUseCaveatText(text);
}

function companyIntroTocItems(extraction = {}, contacts = []) {
  const items = ['公司概况', '产品与工艺', '制造与交付能力'];
  const hasImages = Array.isArray(extraction.images) && extraction.images.length;
  if (hasUsableCustomerCase(extraction)) items.push('项目案例');
  else if (hasImages || (extraction.claim_spine || []).some(c => /case-gallery|case-evidence|evidence/i.test(String(c.proof_object || '')))) items.push('产品与现场图像');
  if (hasUsableCertificate(extraction)) items.push('资质荣誉');
  items.push(contacts.length ? '联系方式' : '致谢');
  return [...new Set(items)].slice(0, 6);
}

function materialHygieneSummary(bundle = {}) {
  const sources = bundle.sources || [];
  const removedLineCount = sources.reduce((sum, src) => sum + Number((src.materialHygiene || {}).removedLineCount || 0), 0);
  const removedSample = sources.flatMap(src => ((src.materialHygiene || {}).removedSample || []).map(item => ({
    sourceId: src.id,
    sourceName: src.name,
    lineNumber: item.lineNumber,
    text: item.text,
    reasons: item.reasons
  }))).slice(0, 10);
  return { removedLineCount, removedSample };
}

function companyIntroDuplicateReason(slide = {}, profileSlide = {}) {
  const overlap = slideContentOverlap(profileSlide, slide);
  if (overlap.sharedNumbers.length >= 2) {
    return `reuses company-profile metrics: ${overlap.sharedNumbers.join(', ')}`;
  }
  if (overlap.score >= 0.46 && /基础|规模|厂区|车间|加工|概况|简介|成立|始建/i.test([slide.title, slide.subtitle, slide.claim].filter(Boolean).join(' '))) {
    return `overlaps company profile text (${overlap.sharedTokens.slice(0, 6).join(', ')})`;
  }
  return '';
}

function filterCompanyIntroDuplicateSlides(slides = [], profileSlide = {}) {
  const removed = [];
  const kept = slides.filter(slide => {
    const reason = companyIntroDuplicateReason(slide, profileSlide);
    if (!reason) return true;
    removed.push({ title: slide.title || '', type: slide.type || '', reason });
    return false;
  });
  return { slides: kept, removed };
}

function imageCaptionCards(bundle = {}, max = 3) {
  return (bundle.images || []).slice(0, max).map((img, i) => ({
    title: img.caption || img.name || `现场图片 ${i + 1}`,
    body: img.suggestedRole ? `图片角色：${img.suggestedRole}` : '企业现场或产品图片'
  }));
}

function applyCompanyIntroRhythm(slides = []) {
  let galleryIndex = 0;
  return slides.map(slide => {
    const imageCount = Array.isArray(slide.images) ? slide.images.length : 0;
    if (imageCount >= 2) {
      galleryIndex += 1;
      if (!slide.layoutVariant && galleryIndex % 2 === 1) {
        return Object.assign({}, slide, { layoutVariant: 'case-hero' });
      }
    }
    return slide;
  });
}

module.exports = {
  applyCompanyIntroRhythm,
  companyIntroTocItems,
  filterCompanyIntroDuplicateSlides,
  imageCaptionCards,
  materialHygieneSummary,
  shouldSuppressCompanyIntroClaim
};
