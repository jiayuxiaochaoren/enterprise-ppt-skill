function createManufacturingIdentityPanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addLabel,
    addRect,
    addText
  } = ctx;

  function drawManufacturingIdentityPanel(slide, s, company, opts = {}) {
    const dark = { x:0.92, y:opts.y || 2.10, w:3.06, h:3.72 };
    addRect(slide, dark.x, dark.y, dark.w, dark.h, C.ink, C.ink, { fill:{color:C.ink, transparency:0}, line:{color:C.ink, transparency:100} });
    addLabel(slide, '制造基础', { x:dark.x+0.30, y:dark.y+0.34, w:1.02, h:0.10, fontSize:5.8, color:C.accent, charSpace:0 });
    addText(slide, company, { x:dark.x+0.30, y:dark.y+0.82, w:2.16, h:0.38, fontSize:17.2, bold:true, color:C.white, fit:'shrink' });
    addText(slide, s.description || s.body || '围绕装备制造、输送系统和现场交付形成综合服务能力。', {
      x:dark.x+0.30, y:dark.y+1.56, w:2.22, h:0.68, fontSize:8.4, color:C.captionOnImage, breakLine:true, fit:'shrink'
    });
    addHairline(slide, dark.x+0.30, dark.y+2.72, 0.82, C.accent, 0, 0.62);
    addText(slide, s.tagline || '以可核验制造事实建立合作信任', {
      x:dark.x+0.30, y:dark.y+3.02, w:2.14, h:0.13, fontSize:7.2, color:C.darkMuted || 'A8B3C3', fit:'shrink'
    });
  }

  return {
    drawManufacturingIdentityPanel
  };
}

module.exports = {
  createManufacturingIdentityPanel
};
