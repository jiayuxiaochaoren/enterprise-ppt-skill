function createManufacturingEvidenceVisual(ctx = {}) {
  const {
    EvidenceImageFrame,
    addCaptionBar,
    addEquipmentNameplate,
    addSmartPhotoPanel,
    fileExists,
    galleryImages,
    mediaForRole,
    resolveAssetPath
  } = ctx;

  function drawManufacturingEvidenceVisual(slide, plan, s, opts = {}) {
    const y = (opts.y || 2.10) + 0.08;
    const images = galleryImages(plan, s);
    const hero = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : (images[0] || mediaForRole(plan, s, 'situation'));
    const uniqueImages = [...new Set([hero, ...images].filter(Boolean))].filter(fileExists).slice(0, 2);
    if (uniqueImages.length && addSmartPhotoPanel) {
      if (uniqueImages.length > 1) {
        const gap = 0.16;
        const tileW = (3.36 - gap) / 2;
        uniqueImages.forEach((image, index) => {
          addSmartPhotoPanel(slide, image, 8.18 + index * (tileW + gap), y, tileW, 1.18, {
            role:'evidence',
            tone:'light',
            transparency:100,
            strokeTransparency:28
          });
        });
      } else {
        addSmartPhotoPanel(slide, uniqueImages[0], 8.18, y, 3.36, 1.28, {
          role:'evidence',
          tone:'light',
          transparency:100,
          strokeTransparency:28
        });
      }
      if (addCaptionBar) {
        addCaptionBar(slide, 8.18, y + 1.40, 3.36, 0.50, {
          dark:false,
          label:'现场图片',
          labelWidth:0.72,
          caption:(s.visual && s.visual.caption) || '图片仅作为制造证据入口，事实以材料可核验内容为准。',
          fontSize:6.0
        });
      }
    } else if (hero && fileExists(hero)) {
      EvidenceImageFrame(slide, hero, 8.42, opts.y || 2.10, 2.94, 3.72, {
        dark:false,
        role:'evidence',
        inset:0.12,
        captionH:0.48,
        label:'现场图片',
        labelWidth:0.72,
        caption:(s.visual && s.visual.caption) || '图片仅作为制造证据入口，事实以材料可核验内容为准。',
        fontSize:6.0
      });
    } else {
      addEquipmentNameplate(slide, 8.18, y + 0.24, 3.36, {
        label:'制造证据',
        text:'补充厂区、车间、设备或项目图片后，可形成更完整的企业画册式证据页。'
      });
    }
  }

  return {
    drawManufacturingEvidenceVisual
  };
}

module.exports = {
  createManufacturingEvidenceVisual
};
