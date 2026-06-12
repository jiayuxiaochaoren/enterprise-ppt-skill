function createProductEvidenceHero(ctx = {}) {
  const {
    addLabel,
    addPhotoPanel,
    addRect,
    addText,
    genericShowcaseField,
    itemBodyNoEllipsis,
    itemTitle
  } = ctx;
  const C = ctx.colors();

  function field(item = {}, keys = [], fallback = '') {
    if (typeof item === 'string') return keys.includes('title') ? item : fallback;
    return keys.map(key => item[key]).find(Boolean) || fallback;
  }

  function drawProductEvidenceHero(slide, lead, image, hero) {
    const heroCaptionH = 0.90;
    const heroImageH = hero.h - heroCaptionH - 0.22;
    addRect(slide, hero.x, hero.y, hero.w, hero.h, C.ink, C.ink, {
      fill:{color:C.ink, transparency:0},
      line:{color:C.ink, transparency:100}
    });
    if (image) {
      addPhotoPanel(slide, image, hero.x+0.18, hero.y+0.18, hero.w-0.36, heroImageH, {
        tone:'light',
        transparency:96,
        stroke:'FFFFFF',
        strokeTransparency:70,
        fit:'cover'
      });
    } else {
      genericShowcaseField(slide, hero.x+0.18, hero.y+0.18, hero.w-0.36, heroImageH, 'HERO PRODUCT');
    }
    addRect(slide, hero.x, hero.y+hero.h-0.90, hero.w, 0.90, C.ink, C.ink, {
      fill:{color:C.ink, transparency:12},
      line:{color:C.ink, transparency:100}
    });
    addLabel(slide, 'HERO PRODUCT PROOF', {
      x:hero.x+0.30, y:hero.y+hero.h-0.60, w:1.42, h:0.09,
      fontSize:5.8, color:C.accent, charSpace:0.7
    });
    addText(slide, field(lead, ['product', 'sku', 'name', 'title', 'label'], itemTitle(lead, '明星单品')), {
      x:hero.x+0.30, y:hero.y+hero.h-0.34, w:1.64, h:0.14,
      fontSize:9.6, bold:true, color:C.white, fit:'shrink'
    });
    addText(slide, field(lead, ['benefit', 'efficacy', 'claim', 'sellingPoint', 'body', 'note', 'description'], itemBodyNoEllipsis(lead, '产品图解释购买理由和功效边界。')), {
      x:hero.x+2.34, y:hero.y+hero.h-0.42, w:2.42, h:0.26,
      fontSize:7.8, color:C.captionOnImage, fit:false, breakLine:true
    });
  }

  return {
    drawProductEvidenceHero
  };
}

module.exports = {
  createProductEvidenceHero
};
