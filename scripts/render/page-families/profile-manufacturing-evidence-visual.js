function createManufacturingEvidenceVisual(ctx = {}) {
  const {
    EvidenceImageFrame,
    addEquipmentNameplate,
    fileExists,
    galleryImages,
    mediaForRole,
    resolveAssetPath
  } = ctx;

  function drawManufacturingEvidenceVisual(slide, plan, s) {
    const images = galleryImages(plan, s);
    const hero = (s.visual && s.visual.image) ? resolveAssetPath(s.visual.image) : (images[0] || mediaForRole(plan, s, 'situation'));
    if (hero && fileExists(hero)) {
      EvidenceImageFrame(slide, hero, 8.42, 2.10, 2.94, 3.72, {
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
      addEquipmentNameplate(slide, 8.42, 2.34, 2.94, {
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
