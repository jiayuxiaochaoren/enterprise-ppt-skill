function createProfileProofIdentityRenderer(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawProfileProofIdentity(slide, plan, s, companyIntro) {
    addRect(slide, 0.92, 2.10, 3.18, 3.72, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, companyIntro ? '企业信息' : 'IDENTITY', { x:1.20, y:2.44, w:1.0, h:0.10, fontSize:5.8, color:C.accent, charSpace:companyIntro ? 0 : 0.8 });
    addText(slide, s.company || plan.organization || '组织名称', { x:1.20, y:2.90, w:2.12, h:0.36, fontSize:18.8, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.description || s.body || '围绕企业基础、产品能力、制造交付和长期服务建立合作信任。', { x:1.20, y:3.58, w:2.30, h:0.70, fontSize:8.8, color:C.captionOnImage, breakLine:true, fit:'shrink' });
    addHairline(slide, 1.20, 4.72, 0.86, C.accent, 0, 0.72);
    addText(slide, s.tagline || (companyIntro ? '以制造基础和项目经验建立合作信任' : '以可验证经验建立决策信任'), { x:1.20, y:5.05, w:2.12, h:0.14, fontSize:7.4, color:C.darkMuted, fit:'shrink' });
  }

  return {
    drawProfileProofIdentity
  };
}

module.exports = {
  createProfileProofIdentityRenderer
};
