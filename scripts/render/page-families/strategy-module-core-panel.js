function createModuleMatrixCorePanel(ctx = {}) {
  const C = ctx.colors();
  const {
    addHairline,
    addText,
    glassPanel,
    industryProfile
  } = ctx;

  function drawModuleMatrixCorePanel(slide, plan, s) {
    const leftPanel = { x:0.92, y:2.20, w:2.92, h:3.42 };
    glassPanel(slide, leftPanel.x, leftPanel.y, leftPanel.w, leftPanel.h, false);
    addText(slide, 'CORE', { x:leftPanel.x+0.28, y:leftPanel.y+0.34, w:0.7, h:0.14, fontSize:8.0, color:C.muted, charSpace:1.1 });
    const industry = industryProfile(plan);
    addText(slide, s.coreTitle || industry.coreTitle || '运营能力地图', { x:leftPanel.x+0.28, y:leftPanel.y+0.86, w:2.12, h:0.28, fontSize:16.8, bold:true, color:C.text });
    addText(slide, s.coreBody || industry.coreBody || '以中心能力雷达串联关键模块，表达平台不是功能堆叠，而是围绕业务闭环形成能力场。', { x:leftPanel.x+0.28, y:leftPanel.y+1.54, w:2.06, h:0.78, fontSize:9.4, color:C.body, breakLine:true });
    addHairline(slide, leftPanel.x+0.28, leftPanel.y+2.70, 0.72, C.accent, 0, 0.75);
  }

  return {
    drawModuleMatrixCorePanel
  };
}

module.exports = {
  createModuleMatrixCorePanel
};
