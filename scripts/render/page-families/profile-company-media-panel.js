function createCompanyProfileMediaPanel(ctx = {}) {
  const {
    EvidenceImageFrame,
    galleryImages,
    itemTitle,
    mediaForRole,
    resolveAssetPath
  } = ctx;

  function drawCompanyProfileMedia(slide, plan, s, company, profileCards) {
    const images = galleryImages(plan, s);
    const hero = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : (images[0] || mediaForRole(plan, s, 'situation'));
    EvidenceImageFrame(slide, hero, 6.10, 0.98, 5.62, 3.24, {
      dark:true,
      role:'showcase',
      label:'现场 / 产品图像',
      labelWidth:1.30,
      caption:(s.visual && s.visual.caption) || itemTitle(profileCards[0], '以真实图片承接企业基础与制造能力证明。'),
      fallbackLabel:company
    });

    const secondary = images.filter(p => p !== hero).slice(0, 2);
    secondary.forEach((img, i) => {
      const x = 6.10 + i * 2.86;
      EvidenceImageFrame(slide, img, x, 4.54, 2.60, 1.12, {
        dark:false,
        role:'evidence',
        inset:0.10,
        captionH:0.28,
        label:`图像 ${i + 2}`,
        labelWidth:0.68,
        caption:itemTitle(profileCards[i + 1], `现场图片 ${i + 2}`),
        fontSize:6.0
      });
    });
  }

  return {
    drawCompanyProfileMedia
  };
}

module.exports = {
  createCompanyProfileMediaPanel
};
