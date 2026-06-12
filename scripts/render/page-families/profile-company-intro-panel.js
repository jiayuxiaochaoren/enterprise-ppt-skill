function createCompanyProfileIntroPanel(ctx = {}, deps = {}) {
  const C = ctx.colors();
  const {
    addEquipmentNameplate,
    addRect,
    addText
  } = ctx;
  const { drawLightPageHeader } = deps;

  function drawCompanyProfileIntro(slide, plan, s, idx, company) {
    drawLightPageHeader(slide, {
      kicker:'公司概况',
      title:company,
      titleY:1.14,
      titleW:4.62,
      titleH:0.72,
      titleSize:24.5,
      titleBreakLine:true,
      subtitle:s.subtitle || '以制造基础、产品谱系和现场交付经验建立合作信任。',
      subtitleY:2.06,
      subtitleW:4.60,
      subtitleH:0.22,
      subtitleSize:10.6,
      subtitleColor:C.body,
      idx
    });
    addRect(slide, 0.86, 2.54, 0.92, 0.045, C.accent, C.accent);
    addRect(slide, 1.94, 2.54, 0.34, 0.045, C.cyan, C.cyan, { fill:{color:C.cyan, transparency:34}, line:{color:C.cyan, transparency:100} });
    addText(slide, s.description || s.body || '围绕装备制造、输送系统和现场交付形成综合服务能力。', {
      x:0.86, y:3.04, w:4.68, h:0.74, fontSize:9.2, color:C.body, breakLine:true, fit:'shrink', valign:'mid'
    });
    if (plan.industry === 'manufacturing-operations') {
      addEquipmentNameplate(slide, 0.86, 4.08, 4.48, {
        label:'制造证据',
        text:'厂区、车间、设备与项目图像统一作为外发证据，而非装饰背景。'
      });
    }
  }

  return {
    drawCompanyProfileIntro
  };
}

module.exports = {
  createCompanyProfileIntroPanel
};
