const {
  createEnergySiteDetailSlotsRenderer
} = require('./evidence-industry-energy-details');
const {
  createEnergySiteHeroRenderer
} = require('./evidence-industry-energy-hero');
const {
  createEnergySiteReadoutRenderer
} = require('./evidence-industry-energy-readout');
const {
  createPageFamilyPrimitives
} = require('./primitives');

function createEnergySiteEvidenceGallery(ctx = {}, deps = {}) {
  const { drawEvidenceHeader } = deps;
  const C = ctx.colors();
  const {
    addText,
    galleryImages,
  } = ctx;
  const {
    drawFooter
  } = createPageFamilyPrimitives(ctx);
  const { drawEnergySiteDetailSlots } = createEnergySiteDetailSlotsRenderer(ctx);
  const { drawEnergySiteHero } = createEnergySiteHeroRenderer(ctx);
  const { drawEnergySiteReadout } = createEnergySiteReadoutRenderer(ctx);

  return function energySiteEvidenceGallery(slide, plan, s, idx) {
    drawEvidenceHeader(slide, s, idx, {
      kicker:'SITE EVIDENCE',
      title:'站端现场证据',
      subtitle:'把站端资产、设备状态和区域调度证据放在同一页，而不是只做图片拼贴。',
      subtitleW:6.6
    });

    const images = galleryImages(plan, s);
    const items = (s.items || s.cards || []).map(v => typeof v === 'string' ? { title:v } : v);
    const hero = { x:0.92, y:2.02, w:6.36, h:2.52 };
    const lead = items[0] || { title:'站端资产', body:'以现场图片确认资产对象和运行边界。' };
    drawEnergySiteHero(slide, hero, lead, images[0]);

    const readout = { x:7.70, y:2.02, w:3.80, h:2.52 };
    drawEnergySiteReadout(slide, readout);

    const detailSlots = [
      { x:0.92, y:4.86, w:5.18, h:1.10, image:images[1], item:items[1], color:C.cyan, fallback:'设备细节' },
      { x:6.34, y:4.86, w:5.16, h:1.10, image:images[2], item:items[2], color:C.violet, fallback:'区域视角' }
    ];
    drawEnergySiteDetailSlots(slide, detailSlots);
    addText(slide, s.note || '站端照片、设备细节和调度信息共同构成能源现场证据。', { x:0.94, y:6.38, w:8.9, h:0.14, fontSize:8.0, color:C.muted, fit:'shrink' });
    drawFooter(slide, plan, { color:'738297' });
  };
}

module.exports = {
  createEnergySiteEvidenceGallery
};
