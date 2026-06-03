const {
  createManufacturingEvidenceVisual
} = require('./profile-manufacturing-evidence-visual');
const {
  createManufacturingFactCards
} = require('./profile-manufacturing-fact-cards');
const {
  createManufacturingIdentityPanel
} = require('./profile-manufacturing-identity-panel');

function createManufacturingCompanyProfileSpread(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    drawFooter,
    drawLightPageHeader
  } = deps;
  const {
    addText,
  } = ctx;
  const { drawManufacturingEvidenceVisual } = createManufacturingEvidenceVisual(ctx);
  const { drawManufacturingFactCards } = createManufacturingFactCards(ctx);
  const { drawManufacturingIdentityPanel } = createManufacturingIdentityPanel(ctx);

  return function manufacturingCompanyProfileSpread(slide, plan, s, idx) {
    const company = s.company || plan.organization || plan.title || '公司名称';
    drawLightPageHeader(slide, {
      kicker:'公司概况',
      title:s.title || company,
      titleY:1.04,
      titleW:5.40,
      titleH:0.36,
      titleSize:24.0,
      subtitle:s.subtitle || '以制造基础、产品谱系和现场交付经验建立合作信任。',
      subtitleW:6.20,
      subtitleSize:10.0,
      idx
    });

    drawManufacturingIdentityPanel(slide, s, company);
    const metrics = (s.metrics || []).slice(0, 4);
    const profileCards = (s.cards || s.items || []).map(v => typeof v === 'string' ? { title:v } : v).slice(0, 4);
    const proofCards = metrics.length ? metrics : profileCards;
    drawManufacturingFactCards(slide, proofCards);
    drawManufacturingEvidenceVisual(slide, plan, s);

    addText(slide, s.note || '公司基础页先建立可信身份，再用少量事实和一张证据图承接能力证明。', {
      x:0.96, y:6.36, w:7.70, h:0.13, fontSize:7.8, color:C.muted, fit:'shrink'
    });
    drawFooter(slide, plan);
  };
}

module.exports = {
  createManufacturingCompanyProfileSpread
};
